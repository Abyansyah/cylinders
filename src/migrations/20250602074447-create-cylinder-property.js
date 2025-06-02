'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cylinder_properties', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      size_cubic_meter: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      material: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      max_age_years: {
        type: Sequelize.INTEGER,
        defaultValue: 5,
        allowNull: false,
      },
      default_buy_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      default_rent_price_per_day: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      notes: {
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cylinder_properties');
  },
};
