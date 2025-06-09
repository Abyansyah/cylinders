'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Cylinder extends Model {
    static associate(models) {
      Cylinder.belongsTo(models.CylinderProperty, {
        foreignKey: 'cylinder_properties_id',
        as: 'cylinderProperty',
      });
      Cylinder.belongsTo(models.GasType, {
        foreignKey: 'gas_type_id',
        as: 'gasType',
      });
      Cylinder.belongsTo(models.Warehouse, {
        foreignKey: 'warehouse_id',
        as: 'currentWarehouse',
      });
      Cylinder.hasMany(models.StockMovement, {
        foreignKey: 'cylinder_id',
        as: 'stockMovements',
      });
      Cylinder.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'ownerCustomer',
        allowNull: true,
      });
      Cylinder.belongsTo(models.OrderItem, {
        foreignKey: 'current_order_item_id',
        as: 'currentOrderItem',
        allowNull: true,
      });
      Cylinder.hasMany(models.OrderItemAssignment, {
        foreignKey: 'cylinder_id',
        as: 'orderAssignments',
      });
      // Future associations:
      // Cylinder.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'ownerCustomer' });
      // Cylinder.belongsTo(models.OrderItem, { foreignKey: 'current_order_item_id', as: 'currentOrderItem' });
    }
  }
  Cylinder.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      barcode_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
          msg: 'Barcode ID must be unique.',
        },
        validate: {
          notNull: { msg: 'Barcode ID cannot be null.' },
          notEmpty: { msg: 'Barcode ID cannot be empty.' },
        },
      },
      cylinder_properties_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'cylinder_properties', key: 'id' },
        validate: {
          notNull: { msg: 'Cylinder property ID cannot be null.' },
        },
      },
      gas_type_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'gas_types', key: 'id' },
      },
      warehouse_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'warehouses', key: 'id' },
        validate: {
          notNull: { msg: 'Warehouse ID cannot be null.' },
        },
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notNull: { msg: 'Status cannot be null.' },
          notEmpty: { msg: 'Status cannot be empty.' },
          isIn: {
            args: [['Di Gudang - Kosong', 'Di Gudang - Terisi', 'Dipinjam Pelanggan', 'Dialokasikan Untuk Order', 'Siap Kirim', 'Perlu Inspeksi', 'Rusak', 'Hilang']],
            msg: 'Invalid cylinder status.',
          },
        },
      },
      manufacture_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: { msg: 'Manufacture date cannot be null.' },
          isDate: { msg: 'Invalid manufacture date format.' },
        },
      },
      last_fill_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: { msg: 'Invalid last fill date format.' },
        },
      },
      is_owned_by_customer: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'customers', key: 'id' },
      },
      current_order_item_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'order_items', key: 'id' },
      },
    },
    {
      sequelize,
      modelName: 'Cylinder',
      tableName: 'cylinders',
      timestamps: true,
    }
  );
  return Cylinder;
};
