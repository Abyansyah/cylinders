'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'assigned_warehouse_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'warehouses',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT', 
      after: 'sales_user_id', 
    });
    await queryInterface.addIndex('orders', ['assigned_warehouse_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'assigned_warehouse_id');
  },
};
