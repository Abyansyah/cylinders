'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Role, {
        foreignKey: 'role_id',
        as: 'role',
      });
      User.belongsTo(models.Warehouse, {
        foreignKey: 'warehouse_id',
        as: 'warehouse',
        allowNull: true,
      });
      User.hasMany(models.StockMovement, {
        foreignKey: 'user_id',
        as: 'stockMovementsByUser', 
      });
    }

    async isValidPassword(password) {
      return bcrypt.compare(password, this.password);
    }
  }
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
          msg: 'Username must be unique',
        },
        validate: {
          notNull: { msg: 'Username cannot be null' },
          notEmpty: { msg: 'Username cannot be empty' },
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notNull: { msg: 'Password cannot be null' },
          notEmpty: { msg: 'Password cannot be empty' },
        },
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notNull: { msg: 'Name cannot be null' },
          notEmpty: { msg: 'Name cannot be empty' },
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: {
          msg: 'Email must be unique',
        },
        validate: {
          isEmail: { msg: 'Invalid email format' },
        },
      },
      phone_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
      },
      warehouse_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'warehouses',
          key: 'id',
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );
  return User;
};
