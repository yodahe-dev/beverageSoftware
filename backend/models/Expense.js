const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Expense = sequelize.define(
    'Expense',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2), // handles money accurately
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
        validate: {
          min: 1,
        },
      },
      category: {
        type: DataTypes.ENUM('home', 'work', 'both', 'other'),
        allowNull: false,
        defaultValue: 'other',
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'expenses',
      timestamps: true,
      paranoid: true, // enables soft delete
      underscored: true, // use snake_case columns
      indexes: [
        { fields: ['category'], name: 'expenses_category_idx' },
        { fields: ['created_at'], name: 'expenses_created_idx' },
      ],
    }
  );

  return Expense;
};
