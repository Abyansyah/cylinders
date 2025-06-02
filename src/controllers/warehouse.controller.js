const { Warehouse } = require('../models');

const createWarehouse = async (req, res, next) => {
  try {
    const newWarehouse = await Warehouse.create(req.body);
    res.status(201).json({ message: 'Warehouse created successfully', warehouse: newWarehouse });
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const getAllWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.findAll();
    res.status(200).json(warehouses);
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
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        warehouse[key] = req.body[key];
      }
    });
    await warehouse.save();
    res.status(200).json({ message: 'Warehouse updated successfully', warehouse });
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const deleteWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    const usersInWarehouse = await warehouse.getUsers();
    if (usersInWarehouse.length > 0) {
      return res.status(400).json({ message: 'Cannot delete warehouse. It is currently assigned to one or more users.' });
    }
    await warehouse.destroy();
    res.status(200).json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
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
