const { CylinderProperty, sequelize } = require('../models');
const { Op } = require('sequelize');

const createCylinderProperty = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const newCylinderProperty = await CylinderProperty.create(req.body, { transaction: t });
    await t.commit();
    res.status(201).json({ message: 'Cylinder property created successfully', cylinderProperty: newCylinderProperty });
  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const getAllCylinderProperties = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const searchableFields = ['name', 'material', 'thread_type'];
    let whereClause = {};

    if (search) {
      whereClause = {
        [Op.or]: searchableFields.map((field) => ({
          [field]: { [Op.iLike]: `%${search}%` },
        })),
      };
    }

    const { count, rows: data } = await CylinderProperty.findAndCountAll({
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

const getCylinderPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cylinderProperty = await CylinderProperty.findByPk(id);
    if (!cylinderProperty) {
      return res.status(404).json({ message: 'Cylinder property not found' });
    }
    res.status(200).json(cylinderProperty);
  } catch (error) {
    next(error);
  }
};

const updateCylinderProperty = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const cylinderProperty = await CylinderProperty.findByPk(id, { transaction: t });

    if (!cylinderProperty) {
      await t.rollback();
      return res.status(404).json({ message: 'Cylinder property not found' });
    }

    await cylinderProperty.update(req.body, { transaction: t });
    await t.commit();

    res.status(200).json({ message: 'Cylinder property updated successfully', cylinderProperty });
  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const deleteCylinderProperty = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const cylinderProperty = await CylinderProperty.findByPk(id, { transaction: t });

    if (!cylinderProperty) {
      await t.rollback();
      return res.status(404).json({ message: 'Cylinder property not found' });
    }

    await cylinderProperty.destroy({ transaction: t });
    await t.commit();

    res.status(200).json({ message: 'Cylinder property deleted successfully' });
  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Cannot delete cylinder property. It is currently in use by other data.' });
    }
    next(error);
  }
};

module.exports = {
  createCylinderProperty,
  getAllCylinderProperties,
  getCylinderPropertyById,
  updateCylinderProperty,
  deleteCylinderProperty,
};
