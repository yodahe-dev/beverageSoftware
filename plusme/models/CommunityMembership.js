const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const CommunityMembership = sequelize.define('CommunityMembership', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    communityId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('member', 'moderator', 'admin'),
      defaultValue: 'member',
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'community_memberships',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['communityId', 'userId'] },
    ],
  });

  CommunityMembership.associate = (models) => {
    CommunityMembership.belongsTo(models.Community, { foreignKey: 'communityId' });
    CommunityMembership.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return CommunityMembership;
};