module.exports = (sequelize, DataTypes) =>{
    const emailVerification = sequelize.define('emailVerification', {
        requestedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        OTP: {
            type: DataTypes.STRING(10),
            allowNull: true,
        }, 
    });
    return emailVerification;
};