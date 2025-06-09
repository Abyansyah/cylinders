const { Warehouse, sequelize } = require('../models');
const { Op } = require('sequelize');

const createWarehouse = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const newWarehouse = await Warehouse.create(req.body, { transaction: t });
    await t.commit();
    res.status(201).json({ message: 'Warehouse created successfully', warehouse: newWarehouse });
  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const getAllWarehouses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const searchableFields = ['name', 'location'];
    let whereClause = {};

    if (search) {
      whereClause = {
        [Op.or]: searchableFields.map((field) => ({
          [field]: { [Op.iLike]: `%${search}%` },
        })),
      };
    }

    const { count, rows: data } = await Warehouse.findAndCountAll({
      where: whereClause,
      limit: limitNum,
      offset: offset,
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      data,
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    next(error);
  }
};

const getWarehouseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    res.status(200).json(warehouse);
  } catch (error) {
    next(error);
  }
};

const updateWarehouse = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findByPk(id, { transaction: t });

    if (!warehouse) {
      await t.rollback();
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    await warehouse.update(req.body, { transaction: t });
    await t.commit();

    res.status(200).json({ message: 'Warehouse updated successfully', warehouse });
  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const deleteWarehouse = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findByPk(id, { transaction: t });

    if (!warehouse) {
      await t.rollback();
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    const usersInWarehouse = await warehouse.getUsers({ transaction: t });
    if (usersInWarehouse.length > 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot delete warehouse. It is assigned to one or more users.' });
    }

    // Asumsi ada relasi dengan model lain, contoh: 'Inventories'
    // const inventoriesInWarehouse = await warehouse.getInventories({ transaction: t });
    // if (inventoriesInWarehouse.length > 0) {
    //   await t.rollback();
    //   return res.status(400).json({ message: 'Cannot delete warehouse. It contains inventory.' });
    // }

    await warehouse.destroy({ transaction: t });
    await t.commit();

    res.status(200).json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Cannot delete warehouse. It is currently in use by other data.' });
    }
    next(error);
  }
};

module.exports = {
  createWarehouse,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
};
