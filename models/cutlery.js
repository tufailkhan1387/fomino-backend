module.exports = (sequelize, DataTypes) =>{
    const cutlery = sequelize.define('cutlery', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        description: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        image: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    cutlery.associate = (models)=>{
           
        cutlery.hasOne(models.restaurant_cultery);
        models.restaurant_cultery.belongsTo(cutlery);
        
        cutlery.hasOne(models.orderCultery);
        models.orderCultery.belongsTo(cutlery);
    };
    
    return cutlery;
};