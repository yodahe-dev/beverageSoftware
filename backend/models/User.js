const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          len: [2, 100],
        },
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 50],
          is: /^[a-zA-Z0-9_.-]+$/i, // safe username pattern
        },
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      profileImageUrl: {
        type: DataTypes.STRING(2048),
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      phoneNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
      },
      isBadgeVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      timestamps: true, // adds createdAt & updatedAt
      paranoid: true, // enables soft deletes using deletedAt
      underscored: true, // uses snake_case in DB
      indexes: [
        { unique: true, fields: ['email'], name: 'users_email_idx' },
        { unique: true, fields: ['username'], name: 'users_username_idx' },
        { fields: ['created_at'], name: 'users_created_idx' },
      ],
      defaultScope: {
        attributes: { exclude: ['password'] }, // never return password by default
      },
      scopes: {
        withPassword: { attributes: {} },
        verified: { where: { emailVerified: true } },
      },
    }
  );

  return User;
};
