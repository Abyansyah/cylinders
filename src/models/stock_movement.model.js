'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StockMovement extends Model {
    static associate(models) {
      StockMovement.belongsTo(models.Cylinder, {
        foreignKey: 'cylinder_id',
        as: 'cylinder',
      });
      StockMovement.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
      StockMovement.belongsTo(models.Warehouse, {
        foreignKey: 'from_warehouse_id',
        as: 'fromWarehouse',
      });
      StockMovement.belongsTo(models.Warehouse, {
        foreignKey: 'to_warehouse_id',
        as: 'toWarehouse',
      });
      StockMovement.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order',
        allowNull: true,
      });
      StockMovement.belongsTo(models.Customer, {
        foreignKey: 'from_customer_id',
        as: 'fromCustomer',
      });
      StockMovement.belongsTo(models.Customer, {
        foreignKey: 'to_customer_id',
        as: 'toCustomer',
      });
    }
  }
  StockMovement.init(
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
        references: { model: 'cylinders', key: 'id' },
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      movement_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notNull: { msg: 'Movement type cannot be null.' },
          notEmpty: { msg: 'Movement type cannot be empty.' },
          isIn: {
            args: [['TERIMA_BARU', 'ISI_ULANG', 'PINDAH_GUDANG', 'KELUAR_PELANGGAN', 'DIALOKASIKAN_KE_ORDER', 'KELUAR_UNTUK_PENGIRIMAN', 'DISERAHKAN_KE_CUSTOMER', 'DIAMBIL_DARI_CUSTOMER', 'DITERIMA_DI_GUDANG', 'KEMBALI_PELANGGAN', 'UPDATE_STATUS']],
            msg: 'Invalid movement type.',
          },
        },
      },
      from_warehouse_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'warehouses', key: 'id' },
      },
      to_warehouse_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'warehouses', key: 'id' },
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      from_customer_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'customers', key: 'id' },
      },
      to_customer_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'customers', key: 'id' },
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'orders', key: 'id' },
      },
    },
    {
      sequelize,
      modelName: 'StockMovement',
      tableName: 'stock_movements',
      timestamps: false,
    }
  );
  return StockMovement;
};
