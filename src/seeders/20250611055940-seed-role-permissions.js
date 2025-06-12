'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const rolesResult = await queryInterface.sequelize.query('SELECT id, role_name from "roles";', {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });
    const permissionsResult = await queryInterface.sequelize.query('SELECT id, name, description from "permissions";', {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });

    const rolesMap = new Map(rolesResult.map((r) => [r.role_name, r.id]));
    const rolePermissions = [];

    const addPerms = (roleName, perms) => {
      const roleId = rolesMap.get(roleName);
      if (roleId && perms.length > 0) {
        for (const perm of perms) {
          rolePermissions.push({
            role_id: roleId,
            permission_id: perm.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    };

    const adminPerms = permissionsResult.filter(
      (p) =>
        p.name.startsWith('user:') ||
        ['warehouse:create', 'warehouse:view', 'warehouse:view_all', 'warehouse:update', 'warehouse:delete'].includes(p.name) ||
        p.name === 'gastype:manage' ||
        p.name === 'product:manage' ||
        p.name === 'cylinderproperty:manage' ||
        p.name.startsWith('cylinder:') ||
        p.name.startsWith('stockmovement:') ||
        p.name.startsWith('customer:') ||
        p.name.startsWith('order:') ||
        p.name === 'delivery:view_ready' ||
        p.name === 'delivery:create'
    );
    addPerms('Admin', adminPerms);

    const salesPerms = permissionsResult.filter((p) => p.name.startsWith('customer:') || p.name.startsWith('order:') || p.name === 'delivery:view_ready' || p.name === 'delivery:create');
    addPerms('Sales', salesPerms);

    const warehousePerms = permissionsResult.filter((p) => p.description && p.description.toLowerCase().includes('warehouse staff'));
    addPerms('Petugas Gudang', warehousePerms);

    const driverPerms = permissionsResult.filter((p) => p.description && p.description.toLowerCase().includes('driver'));
    addPerms('Driver', driverPerms);

    if (rolePermissions.length > 0) {
      await queryInterface.bulkInsert('role_permissions', rolePermissions, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('role_permissions', null, {});
  },
};
