const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Sales = sequelize.define(
    'Sales',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      total_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      payment_method: {
        type: DataTypes.ENUM('cash', 'transfer', 'credit'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'partially_paid'),
        defaultValue: 'pending',
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      customer_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'customers', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'sales',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  // Associations
  Sales.associate = (models) => {
    Sales.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Sales.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });

    // Link SaleItems
    Sales.hasMany(models.SaleItem, { foreignKey: 'sales_id', as: 'items' });

    // Optional: Link Credit if payment_method = credit
    Sales.hasOne(models.Credit, { foreignKey: 'sale_item_id', as: 'credit' });
  };

  return Sales;
};
