'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ReturnedCylinder extends Model {
    static associate(models) {
      ReturnedCylinder.belongsTo(models.Cylinder, {
        foreignKey: 'cylinder_id',
        as: 'cylinder',
      });
      ReturnedCylinder.belongsTo(models.Customer, {
        foreignKey: 'picked_up_from_customer_id',
        as: 'customer',
      });
      ReturnedCylinder.belongsTo(models.User, {
        foreignKey: 'picked_up_by_driver_id',
        as: 'driver',
      });
      ReturnedCylinder.belongsTo(models.Warehouse, {
        foreignKey: 'returned_to_warehouse_id',
        as: 'warehouse',
      });
      ReturnedCylinder.belongsTo(models.Delivery, {
        foreignKey: 'delivery_id',
        as: 'delivery',
      });
    }
  }
  ReturnedCylinder.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      cylinder_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      picked_up_from_customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      picked_up_by_driver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      pickup_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      returned_to_warehouse_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      warehouse_received_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      delivery_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: {
            args: [['Diangkut Driver', 'Diterima Gudang']],
            msg: 'Invalid returned cylinder status.',
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'ReturnedCylinder',
      tableName: 'returned_cylinders',
      timestamps: true,
    }
  );
  return ReturnedCylinder;
};
