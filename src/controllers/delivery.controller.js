'use strict';
const { Delivery, Order, OrderItem, OrderItemAssignment, Cylinder, StockMovement, User, Customer, sequelize, Role } = require('../models');
const { Op, json } = require('sequelize');
const { generateSuratJalanNumber, generateTrackingNumber } = require('../helpers/delivery.helper');
const { updateOrderStatus } = require('../helpers/order.helper');

const getOrdersReadyForDelivery = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Order.findAndCountAll({
      where: { status: 'Siap Kirim' },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'customer_name', 'shipping_address_default'] },
        { model: User, as: 'salesUser', attributes: ['id', 'name'] },
      ],
      limit: limitNum,
      offset: offset,
      order: [['order_date', 'ASC']],
    });

    res.status(200).json({ data: rows, totalItems: count, totalPages: Math.ceil(count / limitNum), currentPage: pageNum });
  } catch (error) {
    next(error);
  }
};

const createDelivery = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { order_id, driver_user_id, vehicle_number, shipping_method } = req.body;
    const assigned_by_user_id = req.user.id;

    const order = await Order.findByPk(order_id, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (order.status !== 'Siap Kirim') {
      await t.rollback();
      return res.status(400).json({ message: `Order status is '${order.status}', not 'Siap Kirim'.` });
    }

    const driver = await User.findByPk(driver_user_id, { include: [{ model: Role, as: 'role' }], transaction: t });
    if (!driver || driver.role.role_name !== 'Driver') {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid user ID or user is not a Driver.' });
    }

    const surat_jalan_number = await generateSuratJalanNumber();
    const tracking_number = generateTrackingNumber();

    const delivery = await Delivery.create(
      {
        order_id,
        driver_user_id,
        assigned_by_user_id,
        vehicle_number,
        status: 'Menunggu Pickup',
        shipping_method,
        surat_jalan_number,
        tracking_number,
      },
      { transaction: t }
    );

    await order.save({ transaction: t });
    await updateOrderStatus(order_id, 'Menugaskan Driver', req.user.id, `Driver ${driver.name} ditugaskan.`, t);

    await t.commit();
    res.status(201).json({ message: 'Delivery created successfully.', delivery });
  } catch (error) {
    if (t.finished !== 'commit') await t.rollback();
    next(error);
  }
};

const getActiveDeliveriesForDriver = async (req, res, next) => {
  try {
    const driver_user_id = req.user.id;
    const deliveries = await Delivery.findAll({
      where: {
        driver_user_id,
        status: { [Op.in]: ['Menunggu Pickup', 'Dalam Perjalanan'] },
      },
      include: [{ model: Order, as: 'order', include: [{ model: Customer, as: 'customer' }] }],
      order: [['createdAt', 'ASC']],
    });
    res.status(200).json({ data: deliveries, success: true, message: 'Active deliveries retrieved successfully.' });
  } catch (error) {
    next(error);
  }
};

const pickupFromWarehouse = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const driver_user_id = req.user.id;

    const delivery = await Delivery.findOne({ where: { id, driver_user_id }, transaction: t });
    console.log('delivery', delivery);
    

    if (!delivery) {
      await t.rollback();
      return res.status(404).json({ message: 'Delivery not found or you are not authorized.' });
    }
    if (delivery.status !== 'Menunggu Pickup') {
      await t.rollback();
      return res.status(400).json({ message: `Cannot pickup, delivery status is '${delivery.status}'.` });
    }

    const assignments = await OrderItemAssignment.findAll({
      include: [{ model: OrderItem, as: 'orderItem', where: { order_id: delivery.order_id } }],
      transaction: t,
    });
    const cylinderIds = assignments.map((a) => a.cylinder_id);

    const assignmentIds = assignments.map((a) => a.id);

    if (assignmentIds.length > 0) {
      await OrderItemAssignment.update({ status: 'Dikirim' }, { where: { id: { [Op.in]: assignmentIds } }, transaction: t });
    }

    await Cylinder.update({ status: 'Dalam Pengiriman' }, { where: { id: { [Op.in]: cylinderIds } }, transaction: t });

    const stockMovements = cylinderIds.map((cylinder_id) => ({
      cylinder_id,
      user_id: driver_user_id,
      movement_type: 'KELUAR_UNTUK_PENGIRIMAN',
      order_id: delivery.order_id,
      notes: `Keluar dari gudang untuk pengiriman #${delivery.id}`,
    }));
    await StockMovement.bulkCreate(stockMovements, { transaction: t });

    await updateOrderStatus(delivery.order_id, 'Dikirim', req.user.id, `Driver dalam perjalanan.`, t);

    delivery.status = 'Dalam Perjalanan';
    delivery.dispatch_time = new Date();
    await delivery.save({ transaction: t });

    await t.commit();
    res.status(200).json({ message: 'Delivery picked up from warehouse successfully.', delivery });
  } catch (error) {
    if (t.finished !== 'commit') await t.rollback();
    next(error);
  }
};

const completeAtCustomer = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { notes_driver } = req.body;
    const driver_user_id = req.user.id;

    const delivery = await Delivery.findOne({ where: { id, driver_user_id }, include: [{ model: Order, as: 'order' }], transaction: t });
    if (!delivery) {
      await t.rollback();
      return res.status(404).json({ message: 'Delivery not found or you are not authorized.' });
    }
    if (delivery.status !== 'Dalam Perjalanan') {
      await t.rollback();
      return res.status(400).json({ message: `Cannot complete, delivery status is '${delivery.status}'.` });
    }

    const order = delivery.order;
    const customer_id = order.customer_id;

    const assignments = await OrderItemAssignment.findAll({
      include: [{ model: OrderItem, as: 'orderItem', where: { order_id: delivery.order_id } }],
      transaction: t,
    });
    const cylinderIds = assignments.map((a) => a.cylinder_id);
    const assignmentIds = assignments.map((a) => a.id);

    if (assignmentIds.length > 0) {
      await OrderItemAssignment.update({ status: 'Diterima Pelanggan' }, { where: { id: { [Op.in]: assignmentIds } }, transaction: t });
    }
    const newCylinderStatus = order.order_type === 'Sewa' ? 'Di Customer - Sewa' : 'Di Customer - Beli';
    await Cylinder.update({ status: newCylinderStatus, customer_id: customer_id, warehouse_id: null, notes: 'Tabung berhasil diserahkan ke customer' }, { where: { id: { [Op.in]: cylinderIds } }, transaction: t });

    const stockMovements = cylinderIds.map((cylinder_id) => ({
      cylinder_id,
      user_id: driver_user_id,
      movement_type: 'DISERAHKAN_KE_CUSTOMER',
      to_customer_id: customer_id,
      order_id: delivery.order_id,
      notes: `Diserahkan ke customer ID ${customer_id} untuk pengiriman #${delivery.id}`,
    }));
    await StockMovement.bulkCreate(stockMovements, { transaction: t });

    const rentalItems = await OrderItem.findAll({ where: { order_id: order.id, is_rental: true }, transaction: t });
    if (rentalItems.length > 0) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 30);
      await OrderItem.update({ rental_start_date: startDate, rental_end_date: endDate }, { where: { id: { [Op.in]: rentalItems.map((i) => i.id) } }, transaction: t });
    }

    await updateOrderStatus(order.id, 'Selesai', req.user.id, `Diserahkan oleh driver. Catatan: ${notes_driver || ''}`, t);

    await order.save({ transaction: t });

    delivery.status = 'Selesai';
    delivery.completion_time = new Date();
    if (notes_driver) delivery.notes_driver = notes_driver;
    await delivery.save({ transaction: t });

    await t.commit();
    res.status(200).json({ message: 'Delivery completed successfully.', success: true });
  } catch (error) {
    if (t.finished !== 'commit') await t.rollback();
    next(error);
  }
};

module.exports = {
  getOrdersReadyForDelivery,
  createDelivery,
  getActiveDeliveriesForDriver,
  pickupFromWarehouse,
  completeAtCustomer,
};
