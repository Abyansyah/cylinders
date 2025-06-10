'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('returned_cylinders', {
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
        onDelete: 'RESTRICT',
      },
      picked_up_from_customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      picked_up_by_driver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      pickup_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      returned_to_warehouse_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'warehouses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      warehouse_received_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      delivery_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'deliveries',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
    await queryInterface.addIndex('returned_cylinders', ['cylinder_id']);
    await queryInterface.addIndex('returned_cylinders', ['picked_up_from_customer_id']);
    await queryInterface.addIndex('returned_cylinders', ['picked_up_by_driver_id']);
    await queryInterface.addIndex('returned_cylinders', ['status']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('returned_cylinders');
  },
};
