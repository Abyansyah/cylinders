const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { User, Role, Permission, sequelize } = require('../models');
require('dotenv').config();

passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
    },
    async (username, password, done) => {
      try {
        const user = await User.findOne({
          where: { username },
          include: [{ model: Role, as: 'role' }],
        });
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (!user.is_active) {
          return done(null, false, { message: 'User account is inactive.' });
        }
        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findByPk(payload.id, {
        include: [
          {
            model: Role,
            as: 'role',
            include: [
              {
                model: Permission,
                as: 'permissions',
                attributes: ['name'],
                through: { attributes: [] },
              },
            ],
          },
        ],
      });
      if (user && user.is_active) {
        return done(null, user);
      } else {
        return done(null, false, { message: user ? 'User is inactive' : 'User not found' });
      }
    } catch (error) {
      return done(error, false);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'role',
          include: [
            {
              model: Permission,
              as: 'permissions',
              attributes: ['name'],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
