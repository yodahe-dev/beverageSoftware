const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const SavedPost = sequelize.define('SavedPost', {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'saved_posts',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'postId'],
      },
    ],
  });

  SavedPost.associate = (models) => {
    SavedPost.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    SavedPost.belongsTo(models.Post, {
      foreignKey: 'postId',
      as: 'post',
    });
  };

  return SavedPost;
};
