const { CylinderProperty } = require('../models');
const { Op } = require('sequelize');

const createCylinderProperty = async (req, res, next) => {
  try {
    const newCylinderProperty = await CylinderProperty.create(req.body);
    res.status(201).json({ message: 'Cylinder property created successfully', cylinderProperty: newCylinderProperty });
  } catch (error) {
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

    const searchableFields = ['name', 'material'];
    let whereClause = {};

    if (search && searchableFields.length > 0) {
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
      order: [['createdAt', 'DESC']],
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
  try {
    const { id } = req.params;
    const cylinderProperty = await CylinderProperty.findByPk(id);
    if (!cylinderProperty) {
      return res.status(404).json({ message: 'Cylinder property not found' });
    }
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        cylinderProperty[key] = req.body[key];
      }
    });
    await cylinderProperty.save();
    res.status(200).json({ message: 'Cylinder property updated successfully', cylinderProperty });
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const deleteCylinderProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cylinderProperty = await CylinderProperty.findByPk(id);
    if (!cylinderProperty) {
      return res.status(404).json({ message: 'Cylinder property not found' });
    }
    await cylinderProperty.destroy();
    res.status(200).json({ message: 'Cylinder property deleted successfully' });
  } catch (error) {
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
