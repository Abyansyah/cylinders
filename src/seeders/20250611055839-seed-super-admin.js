'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = await queryInterface.sequelize.query(`SELECT id from "roles" WHERE role_name = 'Super Admin';`, {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });

    if (!roles || roles.length === 0) {
      console.log("Could not find 'Super Admin' role. Skipping super admin creation.");
      return;
    }
    const superAdminRoleId = roles[0].id;
    const superAdminUsername = 'superadmin';

    const users = await queryInterface.sequelize.query(`SELECT id from "users" WHERE username = '${superAdminUsername}';`, {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });

    if (users && users.length > 0) {
      console.log('Super Admin user already exists. Skipping creation.');
      return;
    }

    const password = process.env.SUPER_ADMIN_PASSWORD || 'supersecret123';
    const hashedPassword = bcrypt.hashSync(password, 10);

    await queryInterface.bulkInsert(
      'users',
      [
        {
          username: superAdminUsername,
          password: hashedPassword,
          name: 'Super Administrator',
          email: 'superadmin@example.com',
          phone_number: '080000000000',
          address: 'Main HQ',
          role_id: superAdminRoleId,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { username: 'superadmin' }, {});
  },
};
