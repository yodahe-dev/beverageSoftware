const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const SaleItem = sequelize.define(
    'SaleItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        primaryKey: true,
      },

      category: {
        type: DataTypes.ENUM('drink', 'bottle', 'both'),
        allowNull: false,
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },

      drink_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },

      bottle_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },

      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        comment: 'Automatically calculated based on category and quantity',
      },

      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      sales_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'sales',
          key: 'id',
        },
      },

      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
      },

      subbrand_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'subbrands',
          key: 'id',
        },
      },

      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'sale_items',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  // Hook to automatically calculate subtotal
  SaleItem.beforeValidate((saleItem) => {
    if (saleItem.category === 'drink') {
      saleItem.subtotal = saleItem.quantity * parseFloat(saleItem.drink_price || 0);
    } else if (saleItem.category === 'bottle') {
      saleItem.subtotal = saleItem.quantity * parseFloat(saleItem.bottle_price || 0);
    } else if (saleItem.category === 'both') {
      saleItem.subtotal =
        saleItem.quantity * (parseFloat(saleItem.drink_price || 0) + parseFloat(saleItem.bottle_price || 0));
    }
  });

  // Associations
  SaleItem.associate = (models) => {
    SaleItem.belongsTo(models.Sales, { foreignKey: 'sales_id', as: 'sales' });
    SaleItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
    SaleItem.belongsTo(models.SubBrand, { foreignKey: 'subbrand_id', as: 'subbrand' });
  };

  return SaleItem;
};
