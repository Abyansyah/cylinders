'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Warehouse extends Model {
    static associate(models) {
      Warehouse.hasMany(models.User, {
        foreignKey: 'warehouse_id',
        as: 'users',
      });
      Warehouse.hasMany(models.Cylinder, {
        foreignKey: 'warehouse_id',
        as: 'cylindersInWarehouse',
      });
      Warehouse.hasMany(models.Order, {
        foreignKey: 'assigned_warehouse_id',
        as: 'assignedOrders',
      });
      Warehouse.hasMany(models.StockMovement, {
        foreignKey: 'from_warehouse_id',
        as: 'stockMovementsFrom',
      });
      Warehouse.hasMany(models.StockMovement, {
        foreignKey: 'to_warehouse_id',
        as: 'stockMovementsTo',
      });
    }
  }
  Warehouse.init(
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
          msg: 'Warehouse name must be unique',
        },
        validate: {
          notNull: { msg: 'Name cannot be null' },
          notEmpty: { msg: 'Name cannot be empty' },
        },
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notNull: { msg: 'Address cannot be null' },
          notEmpty: { msg: 'Address cannot be empty' },
        },
      },
      phone_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
          // Tambahkan validasi format nomor telepon jika perlu
          // is: /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/g
        },
      },
    },
    {
      sequelize,
      modelName: 'Warehouse',
      tableName: 'warehouses',
      timestamps: true,
    }
  );
  return Warehouse;
};
