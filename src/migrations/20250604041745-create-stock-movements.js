'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_movements', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      cylinder_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cylinders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      movement_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      from_warehouse_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'warehouses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      to_warehouse_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'warehouses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      from_customer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      to_customer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    });
    await queryInterface.addIndex('stock_movements', ['cylinder_id']);
    await queryInterface.addIndex('stock_movements', ['user_id']);
    await queryInterface.addIndex('stock_movements', ['movement_type']);
    await queryInterface.addIndex('stock_movements', ['timestamp']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('stock_movements');
  },
};
