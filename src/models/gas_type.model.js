'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GasType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  GasType.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
          msg: 'Gas type name already taken',
        },
        validate: {
          notNull: { msg: 'Gas type name cannot be null' },
          notEmpty: { msg: 'Gas type name cannot be empty' },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'GasType',
      tableName: 'gas_types',
      timestamps: true,
    }
  );
  return GasType;
};
