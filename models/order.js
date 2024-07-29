module.exports = (sequelize, DataTypes) =>{
    const order = sequelize.define('order', {
        orderNum: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },
        scheduleDate:{
            type: DataTypes.DATE,
            allowNull: true,
        },
        note:{
            type: DataTypes.TEXT(),
            allowNull: true,
        },
        leaveOrderAt:{
            type: DataTypes.TEXT(),
            allowNull: true,
        },
        pmId: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },
        piId: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },
        chargeId: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },
        distance: {
            type: DataTypes.FLOAT(6,2),
            allowNull: true,
        },
        subTotal: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
        total: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        paymentConfirmed: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        paymentRecieved: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
         customTime: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    });
    order.associate = (models)=>{
        order.hasMany(models.orderItems);
        models.orderItems.belongsTo(order);
        order.hasOne(models.orderCharge);
        models.orderCharge.belongsTo(order);
        order.hasMany(models.driverRating);
        models.driverRating.belongsTo(order);
        //Order has many resturant ratings 
        order.hasMany(models.restaurantRating);
        models.restaurantRating.belongsTo(order);
        //Order has many wallet entries
        order.hasMany(models.wallet);
        models.wallet.belongsTo(order);
        //Order has many order histories
        order.hasMany(models.orderHistory);
        models.orderHistory.belongsTo(order);
        
        order.hasMany(models.orderCultery);
        models.orderCultery.belongsTo(order);

        //order belong to group order
        order.hasMany(models.orderGroup);
        models.orderGroup.belongsTo(order);
    };
    return order;
};
