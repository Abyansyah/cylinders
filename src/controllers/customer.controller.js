const { Customer, User, Role, sequelize } = require('../models');
const { Op } = require('sequelize');

const createCustomer = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { customer_name, company_name, phone_number, email, shipping_address_default, billing_address_default, contact_person, customer_type, username, password } = req.body;

    const created_by_user_id = req.user.id;

    const customerRole = await Role.findOne({ where: { role_name: 'Customer' } }, { transaction: t });
    if (!customerRole) {
      await t.rollback();
      return res.status(500).json({ message: "System Error: 'Customer' role not found." });
    }

    const newUser = await User.create(
      {
        username,
        password,
        name: customer_name,
        email: email,
        phone_number: phone_number,
        address: shipping_address_default,
        role_id: customerRole.id,
        is_active: true,
      },
      { transaction: t }
    );

    const newCustomer = await Customer.create(
      {
        user_id: newUser.id,
        customer_name,
        company_name,
        phone_number,
        email,
        shipping_address_default,
        billing_address_default,
        contact_person,
        customer_type,
        created_by_user_id,
      },
      { transaction: t }
    );

    await t.commit();

    const customerResponse = { ...newCustomer.toJSON() };
    const userResponse = { ...newUser.toJSON() };
    delete userResponse.password;

    res.status(201).json({
      message: 'Customer and User account created successfully',
      customer: customerResponse,
      user: userResponse,
    });
  } catch (error) {
    await t.rollback();

    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      if (errors.some((e) => e.field === 'username')) {
        return res.status(400).json({ message: 'Validation Error', errors: [{ field: 'username', message: `Username '${req.body.username}' already exists.` }] });
      }
      if (errors.some((e) => e.field === 'email')) {
        return res.status(400).json({ message: 'Validation Error', errors: [{ field: 'email', message: `Email '${req.body.email}' already exists.` }] });
      }
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const getAllCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search_query = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = {};
    if (search_query) {
      whereClause = {
        [Op.or]: [{ customer_name: { [Op.iLike]: `%${search_query}%` } }, { company_name: { [Op.iLike]: `%${search_query}%` } }, { phone_number: { [Op.iLike]: `%${search_query}%` } }, { email: { [Op.iLike]: `%${search_query}%` } }],
      };
    }

    if (req.user.role.role_name === 'Sales') {
      whereClause.created_by_user_id = req.user.id;
    }

    const { count, rows: customers } = await Customer.findAndCountAll({
      where: whereClause,
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'name', 'username'] }],
      limit: limitNum,
      offset: offset,
      order: [['customer_name', 'ASC']],
    });

    res.status(200).json({
      data: customers,
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let whereClause = { id };

    if (req.user.role.role_name === 'Sales') {
      whereClause.created_by_user_id = req.user.id;
    }

    const customer = await Customer.findOne({
      where: whereClause,
      include: [
        { model: User, as: 'createdBy', attributes: ['name', 'username'] },
        { model: User, as: 'userAccount', attributes: ['username', 'email', 'phone_number'] },
      ],
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found or access denied.' });
    }
    res.status(200).json(customer);
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { username, password, ...customerData } = req.body;

    const customer = await Customer.findByPk(id, { transaction: t });
    if (!customer) {
      await t.rollback();
      return res.status(404).json({ message: 'Customer not found.' });
    }

    await customer.update(customerData, { transaction: t });

    if ((username || password) && customer.user_id) {
      const userAccount = await User.findByPk(customer.user_id, { transaction: t });
      if (userAccount) {
        if (username) userAccount.username = username;
        if (password) userAccount.password = password;
        await userAccount.save({ transaction: t });
      }
    }

    await t.commit();
    res.status(200).json({ message: 'Customer updated successfully', customer });
  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const deleteCustomer = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    // Cari customer berdasarkan ID
    const customer = await Customer.findByPk(id, { transaction: t });

    if (!customer) {
      await t.rollback();
      return res.status(404).json({ message: 'Customer not found.' });
    }

    const userIdToDelete = customer.user_id;

    await customer.destroy({ transaction: t });

    if (userIdToDelete) {
      const user = await User.findByPk(userIdToDelete, { transaction: t });
      if (user) {
        const userRole = await user.getRole();
        if (userRole.role_name === 'Super Admin' || userRole.role_name === 'Admin') {
          await t.rollback();
          return res.status(400).json({ message: 'Cannot delete a customer associated with an Admin-level user account.' });
        }
        await user.destroy({ transaction: t });
      }
    }

    await t.commit();

    res.status(200).json({ message: 'Customer and associated user account were deleted successfully.' });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
