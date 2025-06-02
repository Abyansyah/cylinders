const jwt = require('jsonwebtoken');
const passport = require('passport');
const { User, Role } = require('../models');
require('dotenv').config();

const register = async (req, res, next) => {
  try {
    const { username, password, name, email, phone_number, address, role_name } = req.body;

    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername) {
      return res.status(400).json({ message: 'Username already exists.' });
    }
    if (email) {
      const existingUserByEmail = await User.findOne({ where: { email } });
      if (existingUserByEmail) {
        return res.status(400).json({ message: 'Email already exists.' });
      }
    }

    let roleId;
    if (role_name) {
      const role = await Role.findOne({ where: { role_name } });
      if (!role) {
        return res.status(400).json({ message: `Role '${role_name}' not found. Please create the role first or use an existing one.` });
      }
      roleId = role.id;
    } else {
      const defaultRole = await Role.findOne({ where: { role_name: 'Customer' } });
      if (!defaultRole) {
        return res.status(400).json({ message: "Default role 'Customer' not found. Please specify a role_name." });
      }
      roleId = defaultRole.id;
    }

    const newUser = await User.create({
      username,
      password,
      name,
      email,
      phone_number,
      address,
      role_id: roleId,
      is_active: true,
    });

    const userResponse = { ...newUser.toJSON() };
    delete userResponse.password;

    res.status(201).json({ message: 'User registered successfully', user: userResponse });
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const login = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info.message || 'Login failed' });
    }
    req.login(user, { session: false }, (err) => {
      if (err) {
        return next(err);
      }
      const payload = {
        id: user.id,
        username: user.username,
        role: user.role ? user.role.role_name : null,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
      const userResponse = { ...user.toJSON() };
      delete userResponse.password;

      return res.json({ message: 'Login successful', token, user: userResponse });
    });
  })(req, res, next);
};

const getProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized: No user data found in request.' });
  }
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Role, as: 'role', attributes: ['id', 'role_name'] }],
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
};
