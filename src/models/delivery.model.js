'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Delivery extends Model {
    static associate(models) {
      Delivery.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order',
      });
      Delivery.belongsTo(models.User, {
        foreignKey: 'driver_user_id',
        as: 'driver',
      });
      Delivery.belongsTo(models.User, {
        foreignKey: 'assigned_by_user_id',
        as: 'assigner',
      });
      Delivery.hasMany(models.ReturnedCylinder, {
        foreignKey: 'delivery_id',
        as: 'returnedCylinders',
      });
    }
  }
  Delivery.init(
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
      },
      driver_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      assigned_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      vehicle_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: {
            args: [['Menunggu Pickup', 'Dalam Perjalanan', 'Selesai', 'Gagal']],
            msg: 'Invalid delivery status.',
          },
        },
      },
      dispatch_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completion_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes_driver: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Delivery',
      tableName: 'deliveries',
      timestamps: true,
    }
  );
  return Delivery;
};
