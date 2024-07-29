module.exports = (sequelize, DataTypes) =>{
    const forgetPassword = sequelize.define('forgetPassword', {
        OTP: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        requestedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        expiryAt: {
            type: DataTypes.DATE,
            allowNull: true,
        }, 
    });
    return forgetPassword;
};