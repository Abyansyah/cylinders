'use strict';
const { ReturnedCylinder, Cylinder, StockMovement, sequelize } = require('../models');
const { Op } = require('sequelize');

const pickupEmptyCylinders = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { customer_id, barcodes, delivery_id, destination_warehouse_id } = req.body;
    const driver_id = req.user.id;

    const results = { success: [], failed: [] };
    const cylindersToUpdate = [];
    const stockMovementsToCreate = [];
    const returnedCylindersToCreate = [];

    const cylinders = await Cylinder.findAll({ where: { barcode_id: { [Op.in]: barcodes } }, transaction: t });
    const cylinderMap = new Map(cylinders.map((c) => [c.barcode_id, c]));

    for (const barcode of barcodes) {
      const cylinder = cylinderMap.get(barcode);
      if (!cylinder) {
        results.failed.push({ barcode, reason: 'Barcode not found.' });
        continue;
      }
      if (cylinder.customer_id !== customer_id) {
        results.failed.push({ barcode, reason: `Cylinder is not registered to customer ID ${customer_id}.` });
        continue;
      }

      cylindersToUpdate.push({
        id: cylinder.id,
        status: 'Dalam Perjalanan Kembali ke Gudang',
        customer_id: null,
      });

      stockMovementsToCreate.push({
        cylinder_id: cylinder.id,
        user_id: driver_id,
        movement_type: 'DIAMBIL_DARI_CUSTOMER',
        from_customer_id: customer_id,
        to_warehouse_id: destination_warehouse_id,
        notes: `Diambil dari customer ID ${customer_id} menuju gudang ID ${destination_warehouse_id}`,
      });

      returnedCylindersToCreate.push({
        cylinder_id: cylinder.id,
        picked_up_from_customer_id: customer_id,
        picked_up_by_driver_id: driver_id,
        pickup_time: new Date(),
        status: 'Diangkut Driver',
        delivery_id: delivery_id || null,
        returned_to_warehouse_id: destination_warehouse_id,
      });

      results.success.push({ barcode, cylinder_id: cylinder.id });
    }

    if (results.failed.length > 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Some cylinders could not be processed.', results });
    }

    for (const cyl of cylindersToUpdate) {
      await Cylinder.update({ status: cyl.status, customer_id: cyl.customer_id }, { where: { id: cyl.id }, transaction: t });
    }

    await StockMovement.bulkCreate(stockMovementsToCreate, { transaction: t });
    await ReturnedCylinder.bulkCreate(returnedCylindersToCreate, { transaction: t });

    await t.commit();
    res.status(201).json({ message: 'Empty cylinders pickup processed successfully.', results });
  } catch (error) {
    if (t.finished !== 'commit') await t.rollback();
    next(error);
  }
};

const getIncomingReturnsForWarehouse = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const warehouse_id = req.user.warehouse_id;
    if (!warehouse_id) {
      return res.status(403).json({ message: 'User is not assigned to any warehouse.' });
    }

    const { count, rows } = await ReturnedCylinder.findAndCountAll({
      where: {
        returned_to_warehouse_id: warehouse_id,
        status: 'Diangkut Driver',
      },
      include: [
        {
          model: Cylinder,
          as: 'cylinder',
          attributes: ['id', 'barcode_id', 'status'],
          where: { status: 'Dalam Perjalanan Kembali ke Gudang' },
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_name'],
        },
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'name'],
        },
      ],
      limit: limitNum,
      offset: offset,
      order: [['pickup_time', 'ASC']],
      distinct: true,
    });

    res.status(200).json({ data: rows, totalItems: count, totalPages: Math.ceil(count / limitNum), currentPage: pageNum });
  } catch (error) {
    next(error);
  }
};

const receiveReturnedCylinders = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { barcodes } = req.body;
    const warehouseId = req.user.warehouse_id;
    const userId = req.user.id;

    if (!warehouseId) {
      await t.rollback();
      return res.status(403).json({ message: 'User is not assigned to a warehouse.' });
    }

    const stockMovementsToCreate = [];
    const receivedCylinders = [];

    const cylinders = await Cylinder.findAll({ where: { barcode_id: { [Op.in]: barcodes } }, transaction: t });
    const cylindersMap = new Map(cylinders.map((c) => [c.barcode_id, c]));

    for (const barcode of barcodes) {
      const cylinder = cylindersMap.get(barcode);
      if (!cylinder) {
        throw new Error(`Cylinder with barcode ${barcode} not found.`);
      }
      if (cylinder.status !== 'Dalam Perjalanan Kembali ke Gudang') {
        throw new Error(`Cylinder ${barcode} status is '${cylinder.status}', not 'Dalam Perjalanan Kembali ke Gudang'.`);
      }

      const returnedCylinderRecord = await ReturnedCylinder.findOne({
        where: {
          cylinder_id: cylinder.id,
          status: 'Diangkut Driver',
          returned_to_warehouse_id: warehouseId,
        },
        transaction: t,
      });

      if (!returnedCylinderRecord) {
        throw new Error(`No active return record found for cylinder ${barcode} destined for this warehouse.`);
      }

      cylinder.status = 'Di Gudang - Kosong';
      cylinder.warehouse_id = warehouseId;
      cylinder.notes = `Diterima di gudang ID ${warehouseId} dari customer ID ${returnedCylinderRecord.picked_up_from_customer_id}.`;
      await cylinder.save({ transaction: t });

      returnedCylinderRecord.status = 'Diterima Gudang';
      returnedCylinderRecord.warehouse_received_time = new Date();
      await returnedCylinderRecord.save({ transaction: t });

      const lastAssignment = await OrderItemAssignment.findOne({
        where: { cylinder_id: cylinder.id },
        order: [['createdAt', 'DESC']], 
        transaction: t,
      });

       if (lastAssignment && ['Dikirim', 'Diterima Pelanggan'].includes(lastAssignment.status)) {
          lastAssignment.status = 'Dikembalikan Gudang';
          await lastAssignment.save({ transaction: t });
      }

      stockMovementsToCreate.push({
        cylinder_id: cylinder.id,
        user_id: userId,
        movement_type: 'DITERIMA_DI_GUDANG',
        to_warehouse_id: warehouseId,
        from_customer_id: returnedCylinderRecord.picked_up_from_customer_id,
        notes: `Diterima di gudang ID ${warehouseId} dari customer ID ${returnedCylinderRecord.picked_up_from_customer_id}.`,
      });
      receivedCylinders.push({ barcode: cylinder.barcode_id, id: cylinder.id });
    }

    await StockMovement.bulkCreate(stockMovementsToCreate, { transaction: t });
    await t.commit();
    res.status(200).json({ message: 'Returned cylinders received successfully.', received_cylinders: receivedCylinders });
  } catch (error) {
    if (t.finished !== 'commit' && t.finished !== 'rollback') {
      await t.rollback();
    }
    res.status(400).json({ message: error.message || 'An error occurred while receiving cylinders.' });
  }
};

module.exports = {
  pickupEmptyCylinders,
  getIncomingReturnsForWarehouse,
  receiveReturnedCylinders,
};
