/**
 * User Model
 * Represents an application user with authentication capabilities.
 */
'use strict';

const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      role: {
        type: DataTypes.ENUM('client', 'freelancer', 'admin'),
        allowNull: false,
        defaultValue: 'client',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'users',
      underscored: true,
      timestamps: true,
      // Hide password field from JSON serialization
      defaultScope: {
        attributes: { exclude: ['password'] },
      },
      scopes: {
        withPassword: {
          attributes: { include: ['password'] },
        },
      },
    }
  );

  // ─── Hooks ─────────────────────────────────
  const hashPassword = async (user) => {
    if (user.changed('password')) {
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(user.password, salt);
    }
  };

  User.addHook('beforeCreate', hashPassword);
  User.addHook('beforeUpdate', hashPassword);

  // ─── Instance Methods ───────────────────────
  User.prototype.comparePassword = async function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
  };

  // ─── Associations ───────────────────────────
  User.associate = (models) => {
    User.hasMany(models.RefreshToken, {
      foreignKey: 'user_id',
      as: 'refreshTokens',
      onDelete: 'CASCADE',
    });
  };

  return User;
};
