'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CylinderProperty extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CylinderProperty.hasMany(models.Cylinder, {
        foreignKey: 'cylinder_properties_id',
        as: 'cylinders',
      });
      CylinderProperty.hasMany(models.OrderItem, {
        foreignKey: 'cylinder_properties_id',
        as: 'orderItems',
      });
    }
  }
  CylinderProperty.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
          msg: 'Cylinder property name must be unique',
        },
        validate: {
          notNull: { msg: 'Name cannot be null' },
          notEmpty: { msg: 'Name cannot be empty' },
        },
      },
      size_cubic_meter: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          isDecimal: { msg: 'Size must be a decimal number' },
          min: { args: [0], msg: 'Size cannot be negative' },
        },
      },
      material: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      max_age_years: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: {
          isInt: { msg: 'Max age must be an integer' },
          min: { args: [0], msg: 'Max age cannot be negative' },
        },
      },
      default_buy_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        validate: {
          isDecimal: { msg: 'Buy price must be a decimal number' },
          min: { args: [0], msg: 'Buy price cannot be negative' },
        },
      },
      default_rent_price_per_day: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          isDecimal: { msg: 'Rent price must be a decimal number' },
          min: { args: [0], msg: 'Rent price cannot be negative' },
        },
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'CylinderProperty',
      tableName: 'cylinder_properties',
      timestamps: true,
    }
  );
  return CylinderProperty;
};
