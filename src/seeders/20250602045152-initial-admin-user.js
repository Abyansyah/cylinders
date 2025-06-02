'use strict';

const bcrypt = require('bcryptjs');
const { Role, User } = require('../models');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const adminRole = await queryInterface.rawSelect(
        'roles',
        {
          where: {
            role_name: 'Admin',
          },
        },
        ['id']
      );

      if (!adminRole) {
        console.error("Seeder Error: 'Admin' role not found. Please run the role seeder first or ensure the 'Admin' role exists.");

        return;
      }

      const adminRoleId = adminRole;

      const adminPassword = 'rahasia123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const existingAdmin = await queryInterface.rawSelect(
        'users',
        {
          where: {
            username: 'admin',
          },
        },
        ['id']
      );

      if (existingAdmin) {
        console.log("Admin user 'admin' already exists. Seeder skipped.");
        return;
      }

      await queryInterface.bulkInsert(
        'users',
        [
          {
            username: 'admin',
            password: hashedPassword,
            name: 'Administrator',
            email: 'admin@gmail.com',
            phone_number: '081234567890',
            address: 'Kantor Pusat',
            role_id: adminRoleId,
            is_active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        {}
      );

      console.log("Admin user 'admin' seeded successfully.");
    } catch (error) {
      console.error('Error seeding admin user:', error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete(
        'users',
        {
          username: 'admin',
        },
        {}
      );
      console.log("Admin user 'admin' removed.");
    } catch (error) {
      console.error('Error removing admin user:', error);
    }
  },
};
