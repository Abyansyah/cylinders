'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.hasMany(models.OrderItem, {
        foreignKey: 'product_id',
        as: 'orderItems',
      });
      Product.belongsTo(models.CylinderProperty, {
        foreignKey: 'cylinder_properties_id',
        as: 'cylinderProperty',
      });
      Product.belongsTo(models.GasType, {
        foreignKey: 'gas_type_id',
        as: 'gasType',
      });
    }
  }
  Product.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      sku: { type: DataTypes.STRING(100), allowNull: true, unique: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      unit: { type: DataTypes.STRING(20), allowNull: true },
      rent_price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      buy_price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      cylinder_properties_id: { type: DataTypes.INTEGER, allowNull: true },
      gas_type_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: 'Product',
      tableName: 'products',
      timestamps: true,
    }
  );
  return Product;
};
