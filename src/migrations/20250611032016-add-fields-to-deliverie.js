'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('deliveries', 'surat_jalan_number', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true,
      after: 'id',
    });
    await queryInterface.addColumn('deliveries', 'shipping_method', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'vehicle_number',
    });
    await queryInterface.addColumn('deliveries', 'tracking_number', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true,
      after: 'shipping_method',
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('deliveries', 'tracking_number');
    await queryInterface.removeColumn('deliveries', 'shipping_method');
    await queryInterface.removeColumn('deliveries', 'surat_jalan_number');
  },
};
