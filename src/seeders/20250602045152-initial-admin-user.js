'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const superAdminRoleName = 'Super Admin';
      const superAdminUsername = 'superadmin';

      const superAdminRoleId = await queryInterface.rawSelect('roles', { where: { role_name: superAdminRoleName } }, ['id']);

      if (!superAdminRoleId) {
        console.error(`Seeder Error: '${superAdminRoleName}' role not found. Please run the role seeder first.`);
        return;
      }

      const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'supersecret123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const existingSuperAdmin = await queryInterface.rawSelect('users', { where: { username: superAdminUsername } }, ['id']);

      if (existingSuperAdmin) {
        console.log(`User '${superAdminUsername}' already exists. Seeder skipped.`);
        return;
      }

      await queryInterface.bulkInsert(
        'users',
        [
          {
            username: superAdminUsername,
            password: hashedPassword,
            name: 'Super Administrator',
            email: 'superadmin@gmail.com',
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

      console.log(`User '${superAdminUsername}' with role '${superAdminRoleName}' seeded successfully.`);
    } catch (error) {
      console.error('Error seeding super admin user:', error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete('users', { username: 'superadmin' }, {});
      console.log("User 'superadmin' removed.");
    } catch (error) {
      console.error('Error removing super admin user:', error);
    }
  },
};
