const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const UserBlock = sequelize.define('UserBlock', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    blockerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    blockedId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'user_blocks',
    timestamps: false,
    indexes: [
      { fields: ['blockerId'] },
      { fields: ['blockedId'] },
      { unique: true, fields: ['blockerId', 'blockedId'], name: 'uniq_block_pair' },
    ],
  });

  UserBlock.associate = (models) => {
    UserBlock.belongsTo(models.User, { foreignKey: 'blockerId', as: 'blocker' });
    UserBlock.belongsTo(models.User, { foreignKey: 'blockedId', as: 'blocked' });
  };

  UserBlock.beforeCreate((block, opts) => {
    if (block.blockerId === block.blockedId) {
      throw new Error("Cannot block yourself");
    }
  });

  return UserBlock;
};
