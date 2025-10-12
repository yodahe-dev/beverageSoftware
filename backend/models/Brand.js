const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Brand = sequelize.define(
    'Brand',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      type: {
        type: DataTypes.ENUM('softdrink', 'alcohol', 'other'),
        allowNull: false,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'brands',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  Brand.associate = (models) => {
    Brand.hasMany(models.SubBrand, { foreignKey: 'brand_id', as: 'subbrands' });
  };

  return Brand;
};
