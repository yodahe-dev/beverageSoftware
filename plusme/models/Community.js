// models/Community.js
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Community = sequelize.define('Community', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // for readable URLs
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    visibility: {
      type: DataTypes.ENUM('public', 'private', 'invite'), // who can see/join
      defaultValue: 'public',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'communities',
    timestamps: true,
  });

  Community.associate = (models) => {
    Community.hasMany(models.Post, { foreignKey: 'communityId', as: 'posts' });
    Community.hasMany(models.CommunityMembership, { foreignKey: 'communityId', as: 'memberships' });
  };

  return Community;
};
