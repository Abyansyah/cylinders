'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order',
      });
      OrderItem.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product',
      });
      OrderItem.hasMany(models.OrderItemAssignment, {
        foreignKey: 'order_item_id',
        as: 'assignments',
      });
      OrderItem.hasOne(models.Cylinder, {
        foreignKey: 'current_order_item_id',
        as: 'assignedCylinder',
      });
    }
  }
  OrderItem.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: 'Quantity cannot be null.' },
          isInt: { msg: 'Quantity must be an integer.' },
          min: { args: [1], msg: 'Quantity must be at least 1.' },
        },
      },
      unit: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      unit_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        // validate: {
        //   notNull: { msg: 'Unit price cannot be null.' },
        //   isDecimal: { msg: 'Unit price must be a decimal.' },
        //   min: { args: [0], msg: 'Unit price cannot be negative.' },
        // },
      },
      sub_total: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        // validate: {
        //   notNull: { msg: 'Subtotal cannot be null.' },
        //   isDecimal: { msg: 'Subtotal must be a decimal.' },
        //   min: { args: [0], msg: 'Subtotal cannot be negative.' },
        // },
      },
      is_rental: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      rental_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: { msg: 'Invalid rental start date format.' },
        },
      },
      rental_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: { msg: 'Invalid rental end date format.' },
          isAfterStartDate(value) {
            if (value && this.rental_start_date && new Date(value) < new Date(this.rental_start_date)) {
              throw new Error('Rental end date must be after rental start date.');
            }
          },
        },
      },
      rental_duration_days: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          isInt: { msg: 'Rental duration must be an integer.' },
          min: { args: [0], msg: 'Rental duration cannot be negative.' },
        },
      },
      notes_petugas_gudang: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'OrderItem',
      tableName: 'order_items',
      timestamps: true,
      hooks: {
        beforeValidate: (orderItem) => {
          if (orderItem.quantity && orderItem.unit_price) {
            orderItem.sub_total = orderItem.quantity * orderItem.unit_price;
          }
        },
      },
    }
  );
  return OrderItem;
};
