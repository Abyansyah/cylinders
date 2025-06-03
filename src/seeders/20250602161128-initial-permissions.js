'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const permissions = [
      // User Management
      { name: 'user:create', description: 'Can create new users', createdAt: new Date(), updatedAt: new Date() },
      { name: 'user:view', description: 'Can view user details', createdAt: new Date(), updatedAt: new Date() },
      { name: 'user:view_all', description: 'Can view all users', createdAt: new Date(), updatedAt: new Date() },
      { name: 'user:update', description: 'Can update user details', createdAt: new Date(), updatedAt: new Date() },
      { name: 'user:delete', description: 'Can delete users', createdAt: new Date(), updatedAt: new Date() },
      { name: 'user:manage_roles', description: 'Can assign/revoke roles to users', createdAt: new Date(), updatedAt: new Date() },

      // Role Management
      { name: 'role:create', description: 'Can create new roles', createdAt: new Date(), updatedAt: new Date() },
      { name: 'role:view', description: 'Can view role details', createdAt: new Date(), updatedAt: new Date() },
      { name: 'role:view_all', description: 'Can view all roles', createdAt: new Date(), updatedAt: new Date() },
      { name: 'role:update', description: 'Can update roles', createdAt: new Date(), updatedAt: new Date() },
      { name: 'role:delete', description: 'Can delete roles', createdAt: new Date(), updatedAt: new Date() },

      // Permission Management
      { name: 'permission:create', description: 'Can create new permissions', createdAt: new Date(), updatedAt: new Date() },
      { name: 'permission:view', description: 'Can view permission details', createdAt: new Date(), updatedAt: new Date() },
      { name: 'permission:view_all', description: 'Can view all permissions', createdAt: new Date(), updatedAt: new Date() },
      { name: 'permission:update', description: 'Can update permissions', createdAt: new Date(), updatedAt: new Date() },
      { name: 'permission:delete', description: 'Can delete permissions', createdAt: new Date(), updatedAt: new Date() },

      // Warehouse Management
      { name: 'warehouse:create', description: 'Can create warehouses', createdAt: new Date(), updatedAt: new Date() },
      { name: 'warehouse:view', description: 'Can view warehouse details', createdAt: new Date(), updatedAt: new Date() },
      { name: 'warehouse:view_all', description: 'Can view all warehouses', createdAt: new Date(), updatedAt: new Date() },
      { name: 'warehouse:update', description: 'Can update warehouse details', createdAt: new Date(), updatedAt: new Date() },
      { name: 'warehouse:delete', description: 'Can delete warehouses', createdAt: new Date(), updatedAt: new Date() },

      // GasType Management
      { name: 'gastype:manage', description: 'Can manage gas types (CRUD)', createdAt: new Date(), updatedAt: new Date() },
      // CylinderProperty Management
      { name: 'cylinderproperty:manage', description: 'Can manage cylinder properties (CRUD)', createdAt: new Date(), updatedAt: new Date() },
    ];

    const existingPermissions = await queryInterface.sequelize.query(`SELECT name from "permissions";`);
    const permissionsInDb = existingPermissions[0].map((p) => p.name);
    const permissionsToInsert = permissions.filter((perm) => !permissionsInDb.includes(perm.name));

    if (permissionsToInsert.length > 0) {
      await queryInterface.bulkInsert('permissions', permissionsToInsert, {});
      console.log('Initial permissions seeded.');
    } else {
      console.log('Initial permissions already exist.');
    }

    const superAdminRole = await queryInterface.rawSelect('roles', { where: { role_name: 'Super Admin' } }, ['id']);
    if (superAdminRole) {
      const allPermissions = await queryInterface.sequelize.query('SELECT id from "permissions";');
      const rolePermissionsToInsert = allPermissions[0].map((perm) => ({
        role_id: superAdminRole,
        permission_id: perm.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const existingRolePermissions = await queryInterface.sequelize.query(`SELECT role_id, permission_id from "role_permissions" WHERE role_id = ${superAdminRole};`);
      const existingPermMap = new Set(existingRolePermissions[0].map((rp) => `${rp.role_id}-${rp.permission_id}`));

      const finalRolePermissionsToInsert = rolePermissionsToInsert.filter((rp) => !existingPermMap.has(`${rp.role_id}-${rp.permission_id}`));

      if (finalRolePermissionsToInsert.length > 0) {
        await queryInterface.bulkInsert('role_permissions', finalRolePermissionsToInsert, {});
        console.log('All permissions assigned to Super Admin role.');
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const superAdminRole = await queryInterface.rawSelect('roles', { where: { role_name: 'Super Admin' } }, ['id']);
    if (superAdminRole) {
      await queryInterface.bulkDelete('role_permissions', { role_id: superAdminRole }, {});
    }
    await queryInterface.bulkDelete('permissions', null, {});
    console.log('Initial permissions and Super Admin assignments removed.');
  },
};
