'use strict';
const { Delivery } = require('../models');
const { Op } = require('sequelize');
const { randomBytes } = require('crypto');

const generateSuratJalanNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `DO/${year}/${month}/`;
  const lastDelivery = await Delivery.findOne({ where: { surat_jalan_number: { [Op.like]: `${prefix}%` } }, order: [['createdAt', 'DESC']] });
  let nextSeq = 1;
  if (lastDelivery) {
    nextSeq = parseInt(lastDelivery.surat_jalan_number.split('/').pop(), 10) + 1;
  }
  return `${prefix}${nextSeq.toString().padStart(4, '0')}`;
};

const generateTrackingNumber = () => randomBytes(5).toString('hex').toUpperCase();

module.exports = {
  generateSuratJalanNumber,
  generateTrackingNumber,
};
