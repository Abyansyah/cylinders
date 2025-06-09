const { Role, Permission, sequelize } = require('../models');
const { Op } = require('sequelize');

const createRole = async (req, res, next) => {
  try {
    const { role_name } = req.body;

    await Role.create({ role_name });
    res.status(201).json({ message: 'Role created successfully' });
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const getAllRoles = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const offset = (pageNum - 1) * limitNum;

    const whereClause = {
      role_name: {
        [Op.ne]: 'Admin',
      },
    };
    if (search) {
      whereClause = {
        role_name: { [Op.iLike]: `%${search}%` },
      };
    }

    const { count, rows: data } = await Role.findAndCountAll({
      where: whereClause,
      limit: limitNum,
      offset: offset,
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
      ],
      order: [['role_name', 'ASC']],
      distinct: true,
    });

    res.status(200).json({
      data,
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    next(error);
  }
};

const getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'description'],
          through: { attributes: [] },
        },
      ],
    });
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    if (role.role_name === 'Admin') {
      return res.status(403).json({ message: 'Forbidden: The Admin role cannot be read.' });
    }
    res.status(200).json(role);
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role_name } = req.body;
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (role.role_name === 'Super Admin' && role_name !== 'Super Admin') {
      return res.status(403).json({ message: 'Forbidden: The Super Admin role name cannot be changed.' });
    }

    if (role_name === 'Super Admin' && role.role_name !== 'Super Admin') {
      return res.status(400).json({ message: "Cannot rename role to 'Super Admin'." });
    }

    role.role_name = role_name;
    await role.save();
    res.status(200).json({ message: 'Role updated successfully', role });
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    if (role.role_name === 'Super Admin') {
      return res.status(403).json({ message: 'Forbidden: The Super Admin role cannot be deleted.' });
    }
    if (role.role_name === 'Admin' && req.user.role.role_name !== 'Super Admin') {
      return res.status(403).json({ message: 'Forbidden: Only Super Admin can delete the Admin role.' });
    }
    const usersWithRole = await role.getUsers();
    if (usersWithRole.length > 0) {
      return res.status(400).json({ message: 'Cannot delete role. It is currently assigned to one or more users.' });
    }

    await role.destroy();
    res.status(200).json({ message: 'Role deleted successfully' });
  } catch (error) {
    next(error);
  }
};
const assignPermissionToRole = async (req, res, next) => {
  try {
    const { roleId, permissionId } = req.params;
    const role = await Role.findByPk(roleId);
    const permission = await Permission.findByPk(permissionId);

    if (!role || !permission) {
      return res.status(404).json({ message: 'Role or Permission not found.' });
    }

    if (role.role_name === 'Super Admin') {
      return res.status(400).json({ message: "Cannot modify Super Admin's permissions directly; they have all permissions implicitly." });
    }

    await role.addPermission(permission);
    res.status(200).json({ message: `Permission '${permission.name}' assigned to role '${role.role_name}'.` });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Permission already assigned to this role.' });
    }
    next(error);
  }
};

const revokePermissionFromRole = async (req, res, next) => {
  try {
    const { roleId, permissionId } = req.params;
    const role = await Role.findByPk(roleId);
    const permission = await Permission.findByPk(permissionId);

    if (!role || !permission) {
      return res.status(404).json({ message: 'Role or Permission not found.' });
    }

    if (role.role_name === 'Super Admin') {
      return res.status(400).json({ message: "Cannot modify Super Admin's permissions directly." });
    }

    const result = await role.removePermission(permission);
    if (result) {
      res.status(200).json({ message: `Permission '${permission.name}' revoked from role '${role.role_name}'.` });
    } else {
      res.status(400).json({ message: 'Permission was not assigned to this role.' });
    }
  } catch (error) {
    next(error);
  }
};

const getPermissionsForRole = async (req, res, next) => {
  try {
    const { roleId } = req.params;
    const role = await Role.findByPk(roleId, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'description'],
          through: { attributes: [] },
        },
      ],
    });

    if (!role) {
      return res.status(404).json({ message: 'Role not found.' });
    }
    res.status(200).json(role.permissions || []);
  } catch (error) {
    next(error);
  }
};

const syncPermissionsForRole = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds) || !permissionIds.every((id) => Number.isInteger(id) && id > 0)) {
      await t.rollback();
      return res.status(400).json({ message: 'permissionIds must be an array of positive integers.' });
    }

    const role = await Role.findByPk(roleId, { transaction: t });
    if (!role) {
      await t.rollback();
      return res.status(404).json({ message: 'Role not found.' });
    }

    if (role.role_name === 'Super Admin') {
      await t.rollback();
      return res.status(400).json({ message: "Cannot directly manage Super Admin's permissions; they have all permissions implicitly." });
    }

    const permissionsToSync = [];
    if (permissionIds.length > 0) {
      const foundPermissions = await Permission.findAll({
        where: { id: { [Op.in]: permissionIds } },
        transaction: t,
      });

      if (foundPermissions.length !== permissionIds.length) {
        const foundIds = foundPermissions.map((p) => p.id);
        const notFoundIds = permissionIds.filter((id) => !foundIds.includes(id));
        await t.rollback();
        return res.status(400).json({ message: `Invalid or non-existent permission IDs provided: ${notFoundIds.join(', ')}` });
      }
      permissionsToSync.push(...foundPermissions);
    }

    await role.setPermissions(permissionsToSync, { transaction: t });

    await t.commit();

    const updatedRoleWithPermissions = await Role.findByPk(roleId, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'description'],
          through: { attributes: [] },
        },
      ],
    });

    res.status(200).json({
      message: `Permissions for role '${role.role_name}' synchronized successfully.`,
      success: true,
    });
  } catch (error) {
    if (t.finished !== 'commit' && t.finished !== 'rollback') {
      await t.rollback();
    }

    if (error.name && (error.name.startsWith('Sequelize') || error.name === 'Error')) {
      return res.status(500).json({ message: 'An error occurred while synchronizing permissions.', error: error.message });
    }
    next(error);
  }
};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  assignPermissionToRole,
  revokePermissionFromRole,
  getPermissionsForRole,
  syncPermissionsForRole,
};
