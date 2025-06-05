const { StockMovement, Cylinder, User, Warehouse } = require('../models');
const { Op } = require('sequelize');

const getAllStockMovements = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      cylinderId, // filter by specific cylinder
      userId,
      movementType,
      warehouseId, // can be from_ or to_
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'DESC',
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = {};
    if (cylinderId) {
      whereClause.cylinder_id = parseInt(cylinderId, 10);
    }
    if (userId) {
      whereClause.user_id = parseInt(userId, 10);
    }
    if (movementType) {
      whereClause.movement_type = movementType;
    }
    if (warehouseId) {
      const whId = parseInt(warehouseId, 10);
      whereClause[Op.or] = [{ from_warehouse_id: whId }, { to_warehouse_id: whId }];
    }
    if (startDate && endDate) {
      whereClause.timestamp = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    } else if (startDate) {
      whereClause.timestamp = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereClause.timestamp = { [Op.lte]: new Date(endDate) };
    }

    const validSortBy = ['timestamp', 'movement_type'];
    const order = [[validSortBy.includes(sortBy) ? sortBy : 'timestamp', sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']];

    const { count, rows: movements } = await StockMovement.findAndCountAll({
      where: whereClause,
      include: [
        { model: Cylinder, as: 'cylinder', attributes: ['id', 'barcode_id'] },
        { model: User, as: 'user', attributes: ['id', 'name', 'username'] },
        { model: Warehouse, as: 'fromWarehouse', attributes: ['id', 'name'] },
        { model: Warehouse, as: 'toWarehouse', attributes: ['id', 'name'] },
      ],
      limit: limitNum,
      offset: offset,
      order,
    });

    res.status(200).json({
      data: movements,
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    next(error);
  }
};

const getStockMovementById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movement = await StockMovement.findByPk(id, {
      include: [
        { model: Cylinder, as: 'cylinder', attributes: ['id', 'barcode_id'] },
        { model: User, as: 'user', attributes: ['id', 'name', 'username'] },
        { model: Warehouse, as: 'fromWarehouse', attributes: ['id', 'name'] },
        { model: Warehouse, as: 'toWarehouse', attributes: ['id', 'name'] },
      ],
    });
    if (!movement) {
      return res.status(404).json({ message: 'Stock movement not found.' });
    }
    res.status(200).json(movement);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStockMovements,
  getStockMovementById,
};
