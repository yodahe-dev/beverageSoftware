const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, models) => {
    const Follow = sequelize.define('Follow', {
        id: {
            type: DataTypes.UUID,
            defaultValue: () => uuidv4(),
            primaryKey: true,
        },
        Follower: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                models: 'User',
                key: 'id'
            }
        },
        Following: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                models: 'User',
                key: 'id'
            }
        },
    }, {
        timestamps: true,
    });

    Follow.associate = (models) => {
        Follow.belongsTo(models.User, { foreignKey: 'Follower', as: 'FollowerUser' });
        Follow.belongsTo(models.User, { foreignKey: 'Following', as: 'FollowingUser' });
    };

    return Follow;
};
