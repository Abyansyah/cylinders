'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OrderStatusHistory extends Model {
    static associate(models) {
      OrderStatusHistory.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order',
      });
      OrderStatusHistory.belongsTo(models.User, {
        foreignKey: 'created_by_user_id',
        as: 'user',
      });
    }
  }
  OrderStatusHistory.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      order_id: { type: DataTypes.INTEGER, allowNull: false },
      status: { type: DataTypes.STRING(50), allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_by_user_id: { type: DataTypes.INTEGER, allowNull: true },
      timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'OrderStatusHistory',
      tableName: 'order_status_histories',
      timestamps: false,
      createdAt: 'timestamp',
      updatedAt: false,
    }
  );
  return OrderStatusHistory;
};
