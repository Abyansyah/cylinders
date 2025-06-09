'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order',
      });
      OrderItem.belongsTo(models.CylinderProperty, {
        foreignKey: 'cylinder_properties_id',
        as: 'cylinderProperty',
      });
      OrderItem.belongsTo(models.GasType, {
        foreignKey: 'gas_type_id',
        as: 'gasType',
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
      cylinder_properties_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'cylinder_properties', key: 'id' },
      },
      gas_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'gas_types', key: 'id' },
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
      unit_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          notNull: { msg: 'Unit price cannot be null.' },
          isDecimal: { msg: 'Unit price must be a decimal.' },
          min: { args: [0], msg: 'Unit price cannot be negative.' },
        },
      },
      sub_total: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
          notNull: { msg: 'Subtotal cannot be null.' },
          isDecimal: { msg: 'Subtotal must be a decimal.' },
          min: { args: [0], msg: 'Subtotal cannot be negative.' },
        },
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
          if (orderItem.is_rental && orderItem.rental_start_date && orderItem.rental_end_date) {
            const start = new Date(orderItem.rental_start_date);
            const end = new Date(orderItem.rental_end_date);
            const diffTime = Math.abs(end - start);
            orderItem.rental_duration_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          } else if (!orderItem.is_rental) {
            orderItem.rental_start_date = null;
            orderItem.rental_end_date = null;
            orderItem.rental_duration_days = null;
          }
        },
      },
    }
  );
  return OrderItem;
};
