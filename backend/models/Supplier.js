const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Supplier = sequelize.define(
    'Supplier',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: { isEmail: true },
      },
      location: {
        type: DataTypes.STRING(100),
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
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'suppliers',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  Supplier.associate = (models) => {
    // Polymorphic Phones
    Supplier.hasMany(models.Phone, {
      foreignKey: 'phoneable_id',
      as: 'phones',
      scope: { phoneable_type: 'supplier' },
      onDelete: 'CASCADE',
    });

    // Brand association
    Supplier.belongsTo(models.Brand, { foreignKey: 'brand_id', as: 'brand' });
  };

  return Supplier;
};
