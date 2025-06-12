'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      sku: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      rent_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      buy_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      cylinder_properties_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'cylinder_properties',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
    await queryInterface.addIndex('products', ['sku']);
    await queryInterface.addIndex('products', ['is_active']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('products');
  },
};
