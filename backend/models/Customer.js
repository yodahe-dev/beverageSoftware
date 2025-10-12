const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Customer = sequelize.define(
    'Customer',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          len: [2, 100],
        },
      },

      address: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      type: {
        type: DataTypes.ENUM('bar', 'individual', 'shop', 'restaurant', 'other'),
        allowNull: false,
        defaultValue: 'individual',
      },

      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'customers',
      timestamps: true,
      paranoid: true, // enables soft delete
      underscored: true, // snake_case naming in DB
      indexes: [
        { fields: ['name'], name: 'customers_name_idx' },
        { fields: ['type'], name: 'customers_type_idx' },
      ],
    }
  );

  Customer.associate = (models) => {
    // Link to generalized Phone table using phoneable_type
    Customer.hasMany(models.Phone, {
      foreignKey: 'phoneable_id',
      as: 'phones',
      constraints: false, // important for polymorphic association
      scope: { phoneable_type: 'customer' }, // only phones for this type
      onDelete: 'CASCADE',
    });
  };

  return Customer;
};
