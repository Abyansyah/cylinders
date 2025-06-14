const { User, Role, Warehouse, sequelize } = require('../models');
const { Op } = require('sequelize');

const createUser = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { username, password, name, email, phone_number, address, role_id, is_active, warehouse_id } = req.body;

    const role = await Role.findByPk(role_id, { transaction: t });
    if (!role) {
      await t.rollback();
      return res.status(400).json({ message: `Role with ID ${role_id} not found.` });
    }

    if (role.role_name === 'Super Admin') {
      await t.rollback();
      return res.status(403).json({ message: "Forbidden: Cannot create a user with the 'Super Admin' role." });
    }

    if (req.user?.role?.role_name === 'Admin' && role.role_name === 'Admin') {
      await t.rollback();
      return res.status(403).json({ message: 'Forbidden: Admin role cannot create another Admin.' });
    }

    if (req.user?.role?.role_name === 'Sales' && role.role_name !== 'Customer') {
      await t.rollback();
      return res.status(403).json({ message: 'Forbidden: Sales role can only create Customer users.' });
    }

    if (warehouse_id) {
      const warehouse = await Warehouse.findByPk(warehouse_id, { transaction: t });
      if (!warehouse) {
        await t.rollback();
        return res.status(400).json({ message: `Warehouse with ID ${warehouse_id} not found.` });
      }
    }

    const newUser = await User.create(
      {
        username,
        password,
        name,
        email,
        phone_number,
        address,
        role_id,
        is_active: is_active !== undefined ? is_active : true,
        warehouse_id,
      },
      { transaction: t }
    );

    await t.commit();

    const userResponse = { ...newUser.toJSON() };
    delete userResponse.password;
    res.status(201).json({ message: 'User created successfully', user: userResponse });
  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', role_id, is_active } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let mainWhereClause = {};
    if (search) {
      mainWhereClause = {
        [Op.or]: [{ name: { [Op.iLike]: `%${search}%` } }, { email: { [Op.iLike]: `%${search}%` } }, { username: { [Op.iLike]: `%${search}%` } }],
      };
    }

    if (role_id) {
      mainWhereClause.role_id = parseInt(role_id, 10);
    }

    if (is_active !== undefined) {
      mainWhereClause.is_active = is_active === 'true';
    }

    const includeClauses = [
      { model: Role, as: 'role', attributes: ['id', 'role_name'] },
      { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'], required: false },
    ];

    if (req.user?.role) {
      const loggedInUserRole = req.user.role.role_name;
      const roleInclude = includeClauses.find((inc) => inc.as === 'role');

      if (loggedInUserRole === 'Admin' || loggedInUserRole === 'Super Admin') {
        roleInclude.where = { role_name: { [Op.ne]: 'Super Admin' } };
      } else if (loggedInUserRole === 'Sales') {
        roleInclude.where = { role_name: 'Customer' };
      }
    }

    const { count, rows: data } = await User.findAndCountAll({
      attributes: { exclude: ['password', 'role_id', 'warehouse_id'] },
      include: includeClauses,
      where: mainWhereClause,
      limit: limitNum,
      offset: offset,
      order: [['name', 'ASC']],
      distinct: true,
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

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'role_id', 'warehouse_id'] },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'role_name'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'], required: false },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const loggedInUserRole = req.user?.role?.role_name;
    const targetUserRole = user.role?.role_name;

    if (loggedInUserRole === 'Admin' && targetUserRole === 'Super Admin') {
      return res.status(403).json({ message: 'Forbidden: Cannot access Super Admin profile.' });
    }
    if (loggedInUserRole === 'Sales' && targetUserRole !== 'Customer') {
      return res.status(403).json({ message: 'Forbidden: Sales can only access Customer profiles.' });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { role_id, warehouse_id, ...updateData } = req.body;

    const userToUpdate = await User.findByPk(id, { include: [{ model: Role, as: 'role' }], transaction: t });
    if (!userToUpdate) {
      await t.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    const loggedInUserRole = req.user?.role?.role_name;
    const targetUserRole = userToUpdate.role.role_name;

    if (targetUserRole === 'Super Admin' && userToUpdate.id !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ message: "Forbidden: Cannot edit another Super Admin's profile." });
    }

    if (loggedInUserRole === 'Admin' && targetUserRole === 'Super Admin') {
      await t.rollback();
      return res.status(403).json({ message: 'Forbidden: Admins cannot edit Super Admins.' });
    }

    if (role_id) {
      const newRole = await Role.findByPk(role_id, { transaction: t });
      if (!newRole) {
        await t.rollback();
        return res.status(400).json({ message: `Role with ID ${role_id} not found.` });
      }
      if (newRole.role_name === 'Super Admin') {
        await t.rollback();
        return res.status(403).json({ message: "Forbidden: Cannot assign 'Super Admin' role." });
      }
      updateData.role_id = role_id;
    }

    if (warehouse_id !== undefined) {
      if (warehouse_id !== null) {
        const warehouse = await Warehouse.findByPk(warehouse_id, { transaction: t });
        if (!warehouse) {
          await t.rollback();
          return res.status(400).json({ message: `Warehouse with ID ${warehouse_id} not found.` });
        }
      }
      updateData.warehouse_id = warehouse_id;
    }

    if (updateData.password === '' || updateData.password === null || updateData.password === undefined) {
      delete updateData.password;
    }

    await userToUpdate.update(updateData, { transaction: t });
    await t.commit();

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    if (parseInt(id, 10) === req.user.id) {
      await t.rollback();
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    const user = await User.findByPk(id, { include: [{ model: Role, as: 'role' }], transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role.role_name === 'Super Admin') {
      await t.rollback();
      return res.status(403).json({ message: 'Forbidden: The Super Admin user cannot be deleted.' });
    }

    await user.destroy({ transaction: t });
    await t.commit();

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Cannot delete user. They are associated with other data.' });
    }
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
