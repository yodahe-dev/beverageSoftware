const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const MessageRequest = sequelize.define(
    'MessageRequest',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        primaryKey: true,
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      receiverId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      content: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'declined'),
        defaultValue: 'pending',
      },
    },
    {
      tableName: 'message_requests',
      timestamps: true,
    }
  );

  MessageRequest.associate = (models) => {
    MessageRequest.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
    MessageRequest.belongsTo(models.User, { foreignKey: 'receiverId', as: 'receiver' });
  };

  return MessageRequest;
};
