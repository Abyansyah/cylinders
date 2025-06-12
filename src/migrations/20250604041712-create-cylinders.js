'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cylinders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      barcode_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
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
        allowNull: true,
        references: {
          model: 'gas_types',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      warehouse_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'warehouses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      manufacture_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      last_fill_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      is_owned_by_customer: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      current_order_item_id: {
        type: Sequelize.INTEGER,
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
    await queryInterface.addIndex('cylinders', ['barcode_id']);
    await queryInterface.addIndex('cylinders', ['cylinder_properties_id']);
    await queryInterface.addIndex('cylinders', ['gas_type_id']);
    await queryInterface.addIndex('cylinders', ['warehouse_id']);
    await queryInterface.addIndex('cylinders', ['status']);
    await queryInterface.addIndex('cylinders', ['manufacture_date']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cylinders');
  },
};
