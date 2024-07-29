module.exports = (sequelize, DataTypes) =>{
    const orderStatus = sequelize.define('orderStatus', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        displayText: {
            type: DataTypes.TEXT(),
            allowNull: true,
        },
        
    });
    orderStatus.associate = (models)=>{
        orderStatus.hasMany(models.order);
        models.order.belongsTo(orderStatus);

        
        orderStatus.hasMany(models.tableBooking);
        models.tableBooking.belongsTo(orderStatus);

        orderStatus.hasMany(models.orderHistory);
        models.orderHistory.belongsTo(orderStatus);
    };
    
    return orderStatus;
};