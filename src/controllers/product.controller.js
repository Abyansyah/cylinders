'use strict';
const { Product, CylinderProperty, GasType, sequelize } = require('../models');
const { Op } = require('sequelize');

const createProduct = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const newProduct = await Product.create(req.body, { transaction: t });
    await t.commit();
    res.status(201).json({ message: 'Product created successfully', success: true, product: newProduct });
  } catch (error) {
    if (t.finished !== 'commit') await t.rollback();
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', is_active } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;
    let where = {};
    if (search) {
      where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { sku: { [Op.iLike]: `%${search}%` } }];
    }
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }
    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: CylinderProperty, as: 'cylinderProperty' },
        { model: GasType, as: 'gasType' },
      ],
      limit: limitNum,
      offset: offset,
      order: [['name', 'ASC']],
    });
    res.status(200).json({ data: rows, totalItems: count, totalPages: Math.ceil(count / limitNum), currentPage: pageNum });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: CylinderProperty, as: 'cylinderProperty' },
        { model: GasType, as: 'gasType' },
      ],
    });
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const product = await Product.findByPk(req.params.id, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: 'Product not found.' });
    }
    const updatedProduct = await product.update(req.body, { transaction: t });
    await t.commit();
    res.status(200).json(updatedProduct);
  } catch (error) {
    if (t.finished !== 'commit') await t.rollback();
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const product = await Product.findByPk(req.params.id, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: 'Product not found.' });
    }
    await product.destroy({ transaction: t });
    await t.commit();
    res.status(204).send();
  } catch (error) {
    if (t.finished !== 'commit') await t.rollback();
    next(error);
  }
};

module.exports = { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct };
