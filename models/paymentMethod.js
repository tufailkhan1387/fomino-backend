module.exports = (sequelize, DataTypes) =>{
    const paymentMethod = sequelize.define('paymentMethod', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        cardFee: {
            type: DataTypes.FLOAT(6,2),
            allowNull: true,
        },
    });
    paymentMethod.associate = (models)=>{
        paymentMethod.hasOne(models.restaurant);
        models.restaurant.belongsTo(paymentMethod);
        paymentMethod.hasOne(models.order);
        models.order.belongsTo(paymentMethod);
    };
    
    return paymentMethod;
};