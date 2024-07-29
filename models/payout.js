module.exports = (sequelize, DataTypes) =>{
    const payout = sequelize.define('payout', {
        amount: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(),
            allowNull: true,
        }, 
        transactionId: {
            type: DataTypes.STRING(),
            allowNull: true,
        }, 
        message: {
            type: DataTypes.STRING(),
            allowNull: true,
        }, 
    });
    return payout;
};