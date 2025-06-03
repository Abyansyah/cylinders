const passport = require('passport');

const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: Invalid or missing token' });
    }
    req.user = user;
    next();
  })(req, res, next);
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role || !req.user.role.role_name) {
      return res.status(403).json({ message: 'Forbidden: Role information missing' });
    }

    const userRole = req.user.role.role_name;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden: You do not have the required role' });
    }
  };
};

const authorizePermission = (requiredPermissionName) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role || !req.user.role.role_name) {
      return res.status(403).json({ message: 'Forbidden: User or role information missing' });
    }

    if (req.user.role.role_name === 'Super Admin') {
      return next();
    }

    if (!req.user.role.permissions || !Array.isArray(req.user.role.permissions)) {
      console.warn(`Permissions not loaded for role: ${req.user.role.role_name} (User ID: ${req.user.id})`);
      return res.status(403).json({ message: 'Forbidden: Permissions not available for role' });
    }

    const hasPermission = req.user.role.permissions.some((p) => p.name === requiredPermissionName);

    if (hasPermission) {
      next();
    } else {
      res.status(403).json({ message: `Forbidden: You do not have the '${requiredPermissionName}' permission` });
    }
  };
};

const authorizePermissionOrSelf = (permissionName, userIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user || !req.user.role || !req.user.role.role_name) {
      return res.status(403).json({ message: 'Forbidden: User or role information missing' });
    }

    if (req.user.role.role_name === 'Super Admin') {
      return next();
    }

    if (req.user.id === parseInt(req.params[userIdParam], 10)) {
      return next();
    }

    if (!req.user.role.permissions || !Array.isArray(req.user.role.permissions)) {
      return res.status(403).json({ message: 'Forbidden: Permissions not available for role' });
    }

    const hasPermission = req.user.role.permissions.some((p) => p.name === permissionName);
    if (hasPermission) {
      return next();
    }

    res.status(403).json({ message: `Forbidden: You do not have the '${permissionName}' permission or are not the owner of this resource.` });
  };
};

module.exports = {
  authenticateJWT,
  authorizeRole,
  authorizePermission,
  authorizePermissionOrSelf,
};
