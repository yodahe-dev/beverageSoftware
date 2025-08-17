const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Chat = sequelize.define(
    'Chat',
    
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        primaryKey: true,
      },
      conversationId: {
        type: DataTypes.STRING,
        allowNull: false,
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
      isSeen: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      seenAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deletedBySender: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      deletedByReceiver: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isEdited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      editedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },

    {
      tableName: 'chats',
      timestamps: true,
      indexes: [
        {
          name: 'idx_conversation_latest',
          fields: ['conversationId', 'createdAt'],
        },
        {
          name: 'idx_sender_receiver',
          fields: ['senderId', 'receiverId'],
        },
      ],
    }
  );

  Chat.associate = (models) => {
    Chat.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender',
    });

    Chat.belongsTo(models.User, {
      foreignKey: 'receiverId',
      as: 'receiver',
    });
  };

  return Chat;
};
