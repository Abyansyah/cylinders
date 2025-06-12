'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('order_items', 'unit', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'quantity',
    });
    await queryInterface.addColumn('order_items', 'product_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      after: 'order_id',
    });
    await queryInterface.removeColumn('order_items', 'cylinder_properties_id');
    await queryInterface.removeColumn('order_items', 'gas_type_id');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('order_items', 'cylinder_properties_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'cylinder_properties', key: 'id' },
    });
    await queryInterface.addColumn('order_items', 'gas_type_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'gas_types', key: 'id' },
    });
    await queryInterface.removeColumn('order_items', 'product_id');
    await queryInterface.removeColumn('order_items', 'unit');
  },
};
