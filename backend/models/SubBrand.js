const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const SubBrand = sequelize.define(
    'SubBrand',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      brand_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'brands',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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
      tableName: 'subbrands',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  SubBrand.associate = (models) => {
    SubBrand.belongsTo(models.Brand, { foreignKey: 'brand_id', as: 'brand' });
    SubBrand.hasMany(models.Product, { foreignKey: 'subbrand_id', as: 'products' });
  };

  return SubBrand;
};
