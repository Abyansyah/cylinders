const { GasType, sequelize } = require('../models');
const { Op } = require('sequelize');

const createGasType = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { name, description } = req.body;

    const newGasType = await GasType.create({ name, description }, { transaction: t });

    await t.commit();

    res.status(201).json({ message: 'Gas type created successfully', gasType: newGasType });
  } catch (error) {
    await t.rollback();

    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const getAllGasTypes = async (req, res, next) => {
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

    const { count, rows: data } = await GasType.findAndCountAll({
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

const getGasTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const gasType = await GasType.findByPk(id);

    if (!gasType) {
      return res.status(404).json({ message: 'Gas type not found' });
    }

    res.status(200).json(gasType);
  } catch (error) {
    next(error);
  }
};

const updateGasType = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const gasType = await GasType.findByPk(id, { transaction: t });

    if (!gasType) {
      await t.rollback();
      return res.status(404).json({ message: 'Gas type not found' });
    }

    await gasType.update({ name, description }, { transaction: t });

    await t.commit();

    res.status(200).json({ message: 'Gas type updated successfully', gasType });
  } catch (error) {
    await t.rollback();

    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const deleteGasType = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const gasType = await GasType.findByPk(id, { transaction: t });

    if (!gasType) {
      await t.rollback();
      return res.status(404).json({ message: 'Gas type not found' });
    }

    // Opsional: uncomment dan sesuaikan jika ada pemeriksaan relasi data
    // const relatedData = await models.OtherModel.findOne({ where: { gas_type_id: id }, transaction: t });
    // if (relatedData) {
    //   await t.rollback();
    //   return res.status(400).json({ message: 'Cannot delete gas type. It is currently in use.' });
    // }

    await gasType.destroy({ transaction: t });

    await t.commit();

    res.status(200).json({ message: 'Gas type deleted successfully' });
  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Cannot delete gas type. It is currently in use by other data.' });
    }
    next(error);
  }
};

module.exports = {
  createGasType,
  getAllGasTypes,
  getGasTypeById,
  updateGasType,
  deleteGasType,
};
