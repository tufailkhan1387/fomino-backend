module.exports = (sequelize, DataTypes) =>{
    const orderItems = sequelize.define('orderItems', {
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        unitPrice: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
        total: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
    });

    orderItems.associate = (models)=>{
        orderItems.hasMany(models.orderAddOns);
        models.orderAddOns.belongsTo(orderItems);
    };
    return orderItems;
};
