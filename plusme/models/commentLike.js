// models/commentLike.js
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const CommentLike = sequelize.define(
    'CommentLike',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      commentId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'comment_likes',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'commentId'], // prevent duplicate likes by same user
        },
        {
          fields: ['commentId'],
        },
      ],
    }
  );

  CommentLike.associate = (models) => {
    // Each like belongs to one comment
    CommentLike.belongsTo(models.Comment, {
      foreignKey: 'commentId',
      as: 'comment',
    });

    // Each like belongs to one user
    CommentLike.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    // Optional: Many-to-Many through CommentLike
    models.Comment.belongsToMany(models.User, {
      through: CommentLike,
      as: 'likedBy',
      foreignKey: 'commentId',
      otherKey: 'userId',
    });

    models.User.belongsToMany(models.Comment, {
      through: CommentLike,
      as: 'likedComments',
      foreignKey: 'userId',
      otherKey: 'commentId',
    });
  };

  return CommentLike;
};
