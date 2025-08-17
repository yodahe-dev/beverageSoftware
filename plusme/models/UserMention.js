const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const UserMention = sequelize.define('UserMention', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    mentionedUserId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    mentionedName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    commentId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'user_mentions',
    timestamps: false, // already using createdAt manually
  });

  UserMention.associate = (models) => {
    UserMention.belongsTo(models.User, {
      foreignKey: 'mentionedUserId',
      as: 'mentionedUser',
    });

    UserMention.belongsTo(models.Post, {
      foreignKey: 'postId',
      as: 'post',
    });
    
    // optional: if you add Comment model later
    // UserMention.belongsTo(models.Comment, {
    //   foreignKey: 'commentId',
    //   as: 'comment',
    // });
  };

  return UserMention;
};
