'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      customer_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      company_name: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      phone_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      shipping_address_default: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      billing_address_default: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      contact_person: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      customer_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      created_by_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', 
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', 
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
    await queryInterface.addIndex('customers', ['customer_name']);
    await queryInterface.addIndex('customers', ['phone_number']);
    await queryInterface.addIndex('customers', ['email']);
    await queryInterface.addIndex('customers', ['created_by_user_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('customers');
  },
};
