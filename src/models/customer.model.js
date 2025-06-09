'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    static associate(models) {
      Customer.belongsTo(models.User, {
        foreignKey: 'created_by_user_id',
        as: 'createdBy',
      });
      Customer.hasMany(models.Order, {
        foreignKey: 'customer_id',
        as: 'orders',
      });
      Customer.hasMany(models.Cylinder, {
        foreignKey: 'customer_id',
        as: 'ownedCylinders',
      });
      Customer.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'userAccount',
      });
    }
  }
  Customer.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      customer_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notNull: { msg: 'Customer name cannot be null.' },
          notEmpty: { msg: 'Customer name cannot be empty.' },
        },
      },
      company_name: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      phone_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notNull: { msg: 'Phone number cannot be null.' },
          notEmpty: { msg: 'Phone number cannot be empty.' },
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: {
          msg: 'Email must be unique.',
        },
        validate: {
          isEmail: { msg: 'Invalid email format.' },
        },
      },
      shipping_address_default: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notNull: { msg: 'Default shipping address cannot be null.' },
          notEmpty: { msg: 'Default shipping address cannot be empty.' },
        },
      },
      billing_address_default: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      contact_person: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      customer_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      created_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      sequelize,
      modelName: 'Customer',
      tableName: 'customers',
      timestamps: true,
    }
  );
  return Customer;
};
