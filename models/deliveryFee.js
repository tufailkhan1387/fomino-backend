module.exports = (sequelize, DataTypes) =>{
    const deliveryFee = sequelize.define('deliveryFee', {
        baseCharge: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        baseDistance:{
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        chargePerExtraUnit: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        extraUnitDistance:{
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
    });
    return deliveryFee;
};