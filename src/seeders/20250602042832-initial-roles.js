'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const defaultRoles = [
      { role_name: 'Admin', createdAt: new Date(), updatedAt: new Date() },
      { role_name: 'Sales', createdAt: new Date(), updatedAt: new Date() },
      { role_name: 'Petugas Gudang', createdAt: new Date(), updatedAt: new Date() },
      { role_name: 'Distributor', createdAt: new Date(), updatedAt: new Date() },
      { role_name: 'Driver', createdAt: new Date(), updatedAt: new Date() },
      { role_name: 'Customer', createdAt: new Date(), updatedAt: new Date() },
    ];

    const existingRoles = await queryInterface.sequelize.query(`SELECT role_name from "roles";`);

    const rolesInDb = existingRoles[0].map((r) => r.role_name);

    const rolesToInsert = defaultRoles.filter((role) => !rolesInDb.includes(role.role_name));

    if (rolesToInsert.length > 0) {
      await queryInterface.bulkInsert('roles', rolesToInsert, {});
      console.log('Default roles seeded.');
    } else {
      console.log('Default roles already exist.');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'roles',
      {
        role_name: ['Admin', 'Sales', 'Petugas Gudang', 'Distributor', 'Driver', 'Customer'],
      },
      {}
    );
    console.log('Default roles removed.');
  },
};
