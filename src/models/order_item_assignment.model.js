'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrderItemAssignment extends Model {
    static associate(models) {
      OrderItemAssignment.belongsTo(models.OrderItem, {
        foreignKey: 'order_item_id',
        as: 'orderItem',
      });
      OrderItemAssignment.belongsTo(models.Cylinder, {
        foreignKey: 'cylinder_id',
        as: 'cylinder',
      });
    }
  }
  OrderItemAssignment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      order_item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'order_items', key: 'id' },
      },
      cylinder_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'cylinders', key: 'id' },
        unique: {
          name: 'unique_cylinder_assignment',
          msg: 'This cylinder is already assigned to an order item.',
        },
      },
      assigned_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notNull: { msg: 'Assignment status cannot be null.' },
          isIn: {
            args: [['Dialokasikan', 'Siap Kirim', 'Dikirim', 'Diterima Pelanggan', 'Dikembalikan Gudang', 'Selesai Rental']],
            msg: 'Invalid assignment status.',
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'OrderItemAssignment',
      tableName: 'order_item_assignments',
      timestamps: true,
    }
  );
  return OrderItemAssignment;
};
