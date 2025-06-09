'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('stock_movements', {
      fields: ['order_id'],
      type: 'foreign key',
      name: 'stock_movements_order_id_fk',
      references: {
        table: 'orders',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('stock_movements', ['order_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('stock_movements', 'stock_movements_order_id_fk');
    await queryInterface.removeIndex('stock_movements', ['order_id']);
  },
};
