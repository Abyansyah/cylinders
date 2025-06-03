const { Permission } = require('../models');
const { Op } = require('sequelize');

const createPermission = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const existingPermission = await Permission.findOne({ where: { name } });
    if (existingPermission) {
      return res.status(400).json({ message: `Permission with name '${name}' already exists.` });
    }

    const newPermission = await Permission.create({ name, description });
    res.status(201).json({ message: 'Permission created successfully', permission: newPermission });
  } catch (error) {
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

    const { count, rows: permissions } = await Permission.findAndCountAll({
      where: whereClause,
      limit: limitNum,
      offset: offset,
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      permissions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPermission,
  getAllPermissions,
};
