'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('stock_movements', {
      fields: ['from_customer_id'],
      type: 'foreign key',
      name: 'fk_from_customer_id',
      references: {
        table: 'customers',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addConstraint('stock_movements', {
      fields: ['to_customer_id'],
      type: 'foreign key',
      name: 'fk_to_customer_id',
      references: {
        table: 'customers',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('stock_movements', 'fk_to_customer_id');
    await queryInterface.removeConstraint('stock_movements', 'fk_from_customer_id');
  },
};
