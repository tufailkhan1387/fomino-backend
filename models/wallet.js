module.exports = (sequelize, DataTypes) =>{
    const wallet = sequelize.define('wallet', {
        paymentType:{
            type: DataTypes.STRING(),
            allowNull: true,
        },
        amount: {
            type: DataTypes.FLOAT(11,2),
            allowNull: true,
        },
        at: {
            type: DataTypes.DATE(),
            allowNull: true,
        },
         
    });
    return wallet;
};