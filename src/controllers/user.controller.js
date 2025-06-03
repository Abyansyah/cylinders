const { User, Role, Warehouse } = require('../models');
const { Op } = require('sequelize');

const createUser = async (req, res, next) => {
  try {
    const { username, password, name, email, phone_number, address, role_id, is_active, warehouse_id } = req.body;

    const role = await Role.findByPk(role_id);
    if (!role) {
      return res.status(400).json({ message: `Role with ID ${role_id} not found.` });
    }

    if (role.role_name === 'Super Admin') {
      return res.status(400).json({ message: "Cannot create a user with the role 'Super Admin'. This role is reserved for system use." });
    }

    if (req?.user && req?.user?.role?.role_name === 'Admin' && role.role_name === 'Admin') {
      return res.status(403).json({ message: 'Forbidden: Admin role cannot create another Admin.' });
    }

    if (req?.user && req?.user?.role?.role_name === 'Sales' && role.role_name !== 'Customer') {
      return res.status(403).json({ message: 'Forbidden: Sales role can only create users with the Customer role.' });
    }

    if (warehouse_id) {
      const warehouse = await Warehouse.findByPk(warehouse_id);
      if (!warehouse) {
        return res.status(400).json({ message: `Warehouse with ID ${warehouse_id} not found.` });
      }
    }

    const newUser = await User.create({
      username,
      password,
      name,
      email,
      phone_number,
      address,
      role_id,
      is_active: is_active !== undefined ? is_active : true,
      warehouse_id,
    });
    const userResponse = { ...newUser.toJSON() };
    delete userResponse.password;
    res.status(201).json({ message: 'User created successfully', user: userResponse });
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let mainWhereClause = {};
    if (search) {
      mainWhereClause = {
        [Op.or]: [{ name: { [Op.iLike]: `%${search}%` } }, { email: { [Op.iLike]: `%${search}%` } }, { username: { [Op.iLike]: `%${search}%` } }],
      };
    }

    const includeClauses = [
      {
        model: Role,
        as: 'role',
        attributes: ['id', 'role_name'],
      },
      {
        model: Warehouse,
        as: 'warehouse',
        attributes: ['id', 'name', 'address'],
        required: false,
      },
    ];

    const roleInclude = includeClauses.find((include) => include.model === Role && include.as === 'role');

    if (req.user && req.user.role && roleInclude) {
      const loggedInUserRole = req.user.role.role_name;
      if (loggedInUserRole === 'Sales') {
        roleInclude.where = { role_name: 'Customer' };
        roleInclude.required = true;
      } else if (loggedInUserRole === 'Distributor') {
        roleInclude.where = { role_name: 'Driver' };
        roleInclude.required = true;
      } else if (loggedInUserRole === 'Admin') {
        roleInclude.where = { role_name: { [Op.ne]: 'Super Admin' } };
        roleInclude.required = true;
      }
    }

    const { count, rows: data } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      include: includeClauses,
      where: mainWhereClause,
      limit: limitNum,
      offset: offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    res.status(200).json({
      data,
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      message: 'Users fetched successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'role_name'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name', 'address'] },
      ],
    });
    if (req?.user && req?.user?.role?.role_name === 'Admin' && user?.role?.role_name === 'Super Admin') {
      return res.status(403).json({ message: 'Forbidden: Cannot access Super Admin profile.' });
    }
    if (req?.user && req?.user?.role?.role_name === 'Sales' && user?.role?.role_name !== 'Customer') {
      return res.status(403).json({ message: 'Forbidden: Sales role can only access Customer profiles.' });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { username, name, email, phone_number, address, role_id, is_active, password, warehouse_id } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (role_id) {
      const role = await Role.findByPk(role_id);

      if (!role) {
        return res.status(400).json({ message: `Role with ID ${role_id} not found.` });
      }

      user.role_id = role_id;
    }

    if (warehouse_id !== undefined) {
      if (warehouse_id !== null) {
        const warehouse = await Warehouse.findByPk(warehouse_id);
        if (!warehouse) {
          return res.status(400).json({ message: `Warehouse with ID ${warehouse_id} not found.` });
        }
      }
      user.warehouse_id = warehouse_id;
    }

    if (username) user.username = username;

    if (name) user.name = name;

    if (email) user.email = email;

    if (phone_number) user.phone_number = phone_number;

    if (address) user.address = address;

    if (is_active !== undefined) user.is_active = is_active;

    if (password) {
      user.password = password;
    }

    await user.save();

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));

      return res.status(400).json({ message: 'Validation Error', errors });
    }

    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
