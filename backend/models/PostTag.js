const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const PostTag = sequelize.define('PostTag', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tagId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'post_tags',
    timestamps: false,
    indexes: [
      { fields: ['postId'] },
      { fields: ['tagId'] },
      { unique: true, fields: ['postId', 'tagId'], name: 'uniq_post_tag' },
    ],
  });

  PostTag.associate = (models) => {
    PostTag.belongsTo(models.Post, { foreignKey: 'postId' });
    PostTag.belongsTo(models.Tag, { foreignKey: 'tagId' });
  };

  return PostTag;
};
