const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Phone = sequelize.define(
    'Phone',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      phoneable_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      phoneable_type: {
        type: DataTypes.ENUM('supplier', 'customer', 'credit'),
        allowNull: false,
      },

      phone_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },

      contact_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Name of the person using this number',
      },

      type: {
        type: DataTypes.ENUM('main', 'sales', 'support', 'other'),
        defaultValue: 'other',
        comment: 'Type of number',
      },

      note: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Additional info like WhatsApp, preferred contact time, etc.',
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'phones',
      timestamps: true,
      underscored: true,
    }
  );

  // Auto-set phoneable_type based on association
  Phone.beforeValidate((phone, options) => {
    if (phone.supplier_id) {
      phone.phoneable_type = 'supplier';
      phone.phoneable_id = phone.supplier_id;
    } else if (phone.customer_id) {
      phone.phoneable_type = 'customer';
      phone.phoneable_id = phone.customer_id;
    } else if (phone.credit_id) {
      phone.phoneable_type = 'credit';
      phone.phoneable_id = phone.credit_id;
    }
  });

  // Associations
  Phone.associate = (models) => {
    Phone.belongsTo(models.Supplier, {
      foreignKey: 'phoneable_id',
      constraints: false,
      as: 'supplier',
      scope: { phoneable_type: 'supplier' },
    });

    Phone.belongsTo(models.Customer, {
      foreignKey: 'phoneable_id',
      constraints: false,
      as: 'customer',
      scope: { phoneable_type: 'customer' },
    });

    Phone.belongsTo(models.Credit, {
      foreignKey: 'phoneable_id',
      constraints: false,
      as: 'credit',
      scope: { phoneable_type: 'credit' },
    });
  };

  return Phone;
};
