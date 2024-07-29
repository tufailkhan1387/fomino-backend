module.exports = (sequelize, DataTypes) =>{
    const orderType = sequelize.define('orderType', {
        type: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
       
    });
    orderType.associate = (models)=>{
        orderType.hasOne(models.order);
        models.order.belongsTo(orderType);

    };
    
    return orderType;
};