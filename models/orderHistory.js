module.exports = (sequelize, DataTypes) =>{
    const orderHistory = sequelize.define('orderHistory', {
        time: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        reason: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    });
    return orderHistory;
};

