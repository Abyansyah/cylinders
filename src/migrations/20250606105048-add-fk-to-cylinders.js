'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('cylinders', {
      fields: ['customer_id'],
      type: 'foreign key',
      name: 'cylinders_customer_id_fk',
      references: {
        table: 'customers',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addConstraint('cylinders', {
      fields: ['current_order_item_id'],
      type: 'foreign key',
      name: 'cylinders_current_order_item_id_fk',
      references: {
        table: 'order_items',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('cylinders', ['customer_id']);
    await queryInterface.addIndex('cylinders', ['current_order_item_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('cylinders', 'cylinders_current_order_item_id_fk');
    await queryInterface.removeConstraint('cylinders', 'cylinders_customer_id_fk');

    await queryInterface.removeIndex('cylinders', ['current_order_item_id']);
    await queryInterface.removeIndex('cylinders', ['customer_id']);
  },
};
