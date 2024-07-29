module.exports = (sequelize, DataTypes) =>{
    const deliveryType = sequelize.define('deliveryType', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    deliveryType.associate = (models)=>{
        deliveryType.hasMany(models.restaurant);
        models.restaurant.belongsTo(deliveryType);
        deliveryType.hasMany(models.order);
        models.order.belongsTo(deliveryType);
    };
    
    return deliveryType;
};