module.exports = (sequelize, DataTypes) =>{
    const orderMode = sequelize.define('orderMode', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        }, 
    });
    orderMode.associate = (models)=>{
        orderMode.hasMany(models.order);
        models.order.belongsTo(orderMode);
    };
    
    return orderMode;
};