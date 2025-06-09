'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      cylinder_properties_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cylinder_properties',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      gas_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'gas_types',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      unit_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      sub_total: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      is_rental: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      rental_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      rental_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      rental_duration_days: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      notes_petugas_gudang: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    await queryInterface.addIndex('order_items', ['order_id']);
    await queryInterface.addIndex('order_items', ['cylinder_properties_id']);
    await queryInterface.addIndex('order_items', ['gas_type_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('order_items');
  },
};
