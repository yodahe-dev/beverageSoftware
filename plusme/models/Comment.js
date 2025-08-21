const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Comment = sequelize.define(
    'Comment',
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
      postId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      parentId: {   // 👈 for replies
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'comments', // self-reference
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      content: {
        type: DataTypes.STRING,
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
      deletedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'comments',
      timestamps: true,
      paranoid: true, // enables soft delete using `deletedAt`
      indexes: [
        {
          fields: ['postId'],
        },
        {
          fields: ['parentId'],
        },
      ],
    }
  );

  Comment.associate = (models) => {
    // belongs to post
    Comment.belongsTo(models.Post, {
      foreignKey: 'postId',
      as: 'post',
    });

    // belongs to user
    Comment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    // self associations for replies
    Comment.belongsTo(models.Comment, {
      foreignKey: 'parentId',
      as: 'parent',
    });

    Comment.hasMany(models.Comment, {
      foreignKey: 'parentId',
      as: 'replies',
    });
  };

  return Comment;
};
