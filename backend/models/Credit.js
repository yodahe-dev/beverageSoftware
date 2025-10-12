module.exports = (sequelize, DataTypes) => {
  const Credit = sequelize.define(
    'Credit',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // Customer & user relationships
      customer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      sale_item_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'sale_items', key: 'id' },
      },

      // Credit details
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },
      credit_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      return_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      total_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        comment: 'Calculated as quantity * credit_price',
      },
      paid_amount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        comment: 'Amount the customer has already paid',
      },
      balance: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        comment: 'Remaining amount customer owes',
      },

      // Status and due
      status: {
        type: DataTypes.ENUM('active', 'partially_paid', 'paid', 'overdue'),
        defaultValue: 'active',
        allowNull: false,
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date by which customer should pay',
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Optional note for internal tracking',
      },

      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'credits',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  // Associations
  Credit.associate = (models) => {
    Credit.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
    Credit.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Credit.belongsTo(models.SaleItem, { foreignKey: 'sale_item_id', as: 'saleItem' });

    // Link customer phones through polymorphic Phone table
    Credit.belongsTo(models.Phone, {
      foreignKey: 'customer_id',
      constraints: false,
      scope: { phoneable_type: 'customer' },
      as: 'customer_phones',
    });
  };

  return Credit;
};
