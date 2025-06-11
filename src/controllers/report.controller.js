'use strict';
const { Cylinder, StockMovement, User, Warehouse, Customer, Order } = require('../models');
const { Op } = require('sequelize');

const getCylinderHistoryReport = async (req, res, next) => {
  try {
    const { barcode_id, start_date, end_date } = req.query;

    const cylinder = await Cylinder.findOne({ where: { barcode_id } });
    if (!cylinder) {
      return res.status(404).json({ message: `Cylinder with barcode '${barcode_id}' not found.` });
    }

    const whereClause = { cylinder_id: cylinder.id };
    if (start_date && end_date) {
      whereClause.timestamp = { [Op.between]: [start_date, end_date] };
    } else if (start_date) {
      whereClause.timestamp = { [Op.gte]: start_date };
    } else if (end_date) {
      whereClause.timestamp = { [Op.lte]: end_date };
    }

    const history = await StockMovement.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'username'],
        },
        {
          model: Warehouse,
          as: 'fromWarehouse',
          attributes: ['id', 'name'],
        },
        {
          model: Warehouse,
          as: 'toWarehouse',
          attributes: ['id', 'name'],
        },
        {
          model: Customer,
          as: 'fromCustomer',
          attributes: ['id', 'customer_name'],
        },
        {
          model: Customer,
          as: 'toCustomer',
          attributes: ['id', 'customer_name'],
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number'],
        },
      ],
      order: [['timestamp', 'ASC']],
    });

    res.status(200).json({
      cylinder_info: cylinder,
      history: history,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCylinderHistoryReport,
};
