const { Role } = require('../models');
const { Op } = require('sequelize');

const createRole = async (req, res, next) => {
  try {
    const { role_name } = req.body;
    await Role.create({ role_name });
    res.status(201).json({ message: 'Role created successfully' });
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const getAllRoles = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const offset = (pageNum - 1) * limitNum;

    const whereClause = {
      role_name: {
        [Op.ne]: 'Admin',
      },
    };
    if (search) {
      whereClause = {
        role_name: { [Op.iLike]: `%${search}%` },
      };
    }

    const { count, rows: data } = await Role.findAndCountAll({
      where: whereClause,
      limit: limitNum,
      offset: offset,
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

const getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    if (role.role_name === 'Admin') {
      return res.status(403).json({ message: 'Forbidden: The Admin role cannot be read.' });
    }
    res.status(200).json(role);
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role_name } = req.body;
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (role.role_name === 'Admin') {
      return res.status(403).json({ message: 'Forbidden: The Admin role cannot be updated.' });
    }

    role.role_name = role_name;
    await role.save();
    res.status(200).json({ message: 'Role updated successfully', role });
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    if (role.role_name === 'Admin') {
      return res.status(403).json({ message: 'Forbidden: The Admin role cannot be deleted.' });
    }
    const usersWithRole = await role.getUsers();
    if (usersWithRole.length > 0) {
      return res.status(400).json({ message: 'Cannot delete role. It is currently assigned to one or more users.' });
    }

    await role.destroy();
    res.status(200).json({ message: 'Role deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
};
