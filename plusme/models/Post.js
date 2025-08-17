const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Post = sequelize.define('Post', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contentJson: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    visibility: {
      type: DataTypes.ENUM('public', 'private', 'friends', 'community'),
      defaultValue: 'public',
      allowNull: false,
    },
    communityId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'posts',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['authorId'] },
      { fields: ['visibility'] },
      { fields: ['communityId'] },
      { name: 'idx_author_created', fields: ['authorId', 'createdAt'] },
    ],
  });

  Post.associate = (models) => {
    Post.belongsTo(models.User, { foreignKey: 'authorId', as: 'author' });
    if (models.Community) {
      Post.belongsTo(models.Community, { foreignKey: 'communityId', as: 'community' });
    }
    Post.hasMany(models.Comment, { foreignKey: 'postId' });
    Post.hasMany(models.Like, { foreignKey: 'postId' });
    Post.hasMany(models.SavedPost, { foreignKey: 'postId' });
    Post.hasMany(models.UserMention, { foreignKey: 'postId' });
  };

  return Post;
};
