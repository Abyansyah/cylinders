'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'warehouse_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'warehouses',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'role_id',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'warehouse_id');
  },
};
