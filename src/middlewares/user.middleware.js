const { User, Role } = require('../models');

const canViewUserProfile = async (req, res, next) => {
  try {
    const loggedInUserRole = req?.user?.role?.role_name;
    const loggedInUserId = req?.user?.id;
    const targetUserId = parseInt(req.params.id);

    if (loggedInUserRole === 'Admin') {
      return next();
    }
    if (loggedInUserId === targetUserId) {
      return next();
    }
    if (loggedInUserRole === 'Sales') {
      const targetUser = await User.findByPk(targetUserId, {
        attributes: ['id'],
        include: [{ model: Role, as: 'role', attributes: ['role_name'] }],
      });

      if (targetUser && targetUser.role && targetUser.role.role_name === 'Customer') {
        return next();
      }
    }

    return res.status(403).json({ message: 'Forbidden: You do not have permission to view this profile.' });
  } catch (error) {
    console.error('Error in canViewUserProfile middleware:', error);
    next(error);
  }
};

module.exports = {
  canViewUserProfile,
};
