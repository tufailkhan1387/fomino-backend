module.exports = (sequelize, DataTypes) =>{
    const deliveryFeeType = sequelize.define('deliveryFeeType', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    deliveryFeeType.associate = (models)=>{
        deliveryFeeType.hasMany(models.restaurant);
        models.restaurant.belongsTo(deliveryFeeType);
    };
    
    return deliveryFeeType;
};