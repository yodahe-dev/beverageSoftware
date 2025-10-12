const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0 },
      },

      sell_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 },
      },

      cost_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 },
      },

      category: {
        type: DataTypes.ENUM('drink', 'bottle', 'both'),
        allowNull: false,
      },

      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      supplier_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'suppliers',
          key: 'id',
        },
      },

      subbrand_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'subbrands', // new table for sub-brand
          key: 'id',
        },
      },

      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'products',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  // Associations
  Product.associate = (models) => {
    Product.belongsTo(models.Supplier, {
      foreignKey: 'supplier_id',
      as: 'supplier',
    });

    Product.belongsTo(models.SubBrand, {
      foreignKey: 'subbrand_id',
      as: 'subbrand',
    });
  };

  return Product;
};
