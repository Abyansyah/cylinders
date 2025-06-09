const { Permission, sequelize } = require('../models');
const { Op } = require('sequelize');

const createPermission = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { name, description } = req.body;
    const newPermission = await Permission.create({ name, description }, { transaction: t });
    await t.commit();
    res.status(201).json({ message: 'Permission created successfully', permission: newPermission });
  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const getAllPermissions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = {};
    if (search) {
      whereClause = {
        [Op.or]: [{ name: { [Op.iLike]: `%${search}%` } }, { description: { [Op.iLike]: `%${search}%` } }],
      };
    }

    const { count, rows: data } = await Permission.findAndCountAll({
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

const getPermissionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }
    res.status(200).json(permission);
  } catch (error) {
    next(error);
  }
};

const updatePermission = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const permission = await Permission.findByPk(id, { transaction: t });
    if (!permission) {
      await t.rollback();
      return res.status(404).json({ message: 'Permission not found' });
    }

    await permission.update(req.body, { transaction: t });
    await t.commit();

    res.status(200).json({ message: 'Permission updated successfully', permission });
  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const deletePermission = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const permission = await Permission.findByPk(id, { transaction: t });

    if (!permission) {
      await t.rollback();
      return res.status(404).json({ message: 'Permission not found' });
    }

    await permission.destroy({ transaction: t });
    await t.commit();

    res.status(200).json({ message: 'Permission deleted successfully' });
  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Cannot delete permission. It is currently assigned to one or more roles.' });
    }
    next(error);
  }
};

module.exports = {
  createPermission,
  getAllPermissions,
  getPermissionById,
  updatePermission,
  deletePermission,
};
