module.exports = (sequelize, DataTypes) =>{
    const orderApplication = sequelize.define('orderApplication', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        }, 
    });
    orderApplication.associate = (models)=>{
        
        orderApplication.hasMany(models.order);
        models.order.belongsTo(orderApplication);
        
        orderApplication.hasMany(models.cutlery);
        models.cutlery.belongsTo(orderApplication);
    };
    
    return orderApplication;
};