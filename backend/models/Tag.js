const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const slugify = require('slugify');

module.exports = (sequelize) => {
  const Tag = sequelize.define('Tag', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true,
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
    tableName: 'tags',
    indexes: [
      { fields: ['slug'] },
      { fields: ['name'] },
    ],
  });

  // Normalize name -> slug, lowercase
  Tag.beforeValidate((tag) => {
    if (tag.name) {
      tag.name = tag.name.trim().toLowerCase();
      tag.slug = slugify(tag.name, { lower: true, strict: true });
    }
  });

  Tag.associate = (models) => {
    Tag.belongsToMany(models.Post, {
      through: models.PostTag,
      foreignKey: 'tagId',
      otherKey: 'postId',
      as: 'posts',
    });
  };

  return Tag;
};
