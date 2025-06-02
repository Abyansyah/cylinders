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

module.exports = {
  authenticateJWT,
  authorizeRole,
};
