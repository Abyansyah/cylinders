'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer',
      });
      Order.belongsTo(models.User, {
        foreignKey: 'sales_user_id',
        as: 'salesUser',
      });
      Order.belongsTo(models.Warehouse, {
        foreignKey: 'assigned_warehouse_id',
        as: 'assignedWarehouse',
      });
      Order.hasMany(models.OrderItem, {
        foreignKey: 'order_id',
        as: 'items',
      });
      Order.hasMany(models.StockMovement, {
        foreignKey: 'order_id',
        as: 'stockMovements',
      });
    }
  }
  Order.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      order_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
          msg: 'Order number must be unique.',
        },
        validate: {
          notNull: { msg: 'Order number cannot be null.' },
          notEmpty: { msg: 'Order number cannot be empty.' },
        },
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
      },
      sales_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      assigned_warehouse_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'warehouses', key: 'id' },
      },
      order_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      order_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notNull: { msg: 'Order type cannot be null.' },
          isIn: {
            args: [['Sewa', 'Beli']],
            msg: 'Invalid order type. Must be Sewa or Beli.',
          },
        },
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notNull: { msg: 'Order status cannot be null.' },
          isIn: {
            args: [['Baru', 'Dikonfirmasi Sales', 'Dibatalkan Sales', 'Disiapkan Gudang', 'Siap Kirim', 'Dikirim', 'Selesai', 'Dibatalkan Sistem']],
            msg: 'Invalid order status.',
          },
        },
      },
      shipping_address: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notNull: { msg: 'Shipping address cannot be null.' },
        },
      },
      total_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        validate: {
          isDecimal: { msg: 'Total amount must be a decimal.' },
          min: { args: [0], msg: 'Total amount cannot be negative.' },
        },
      },
      notes_customer: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notes_internal: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Order',
      tableName: 'orders',
      timestamps: true,
    }
  );
  return Order;
};
