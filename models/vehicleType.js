module.exports = (sequelize, DataTypes) =>{
    const vehicleType = sequelize.define('vehicleType', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        image: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        icon: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        baseRate: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        perUnitRate: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        }, 
    });
    vehicleType.associate = (models)=>{
        vehicleType.hasMany(models.order);
        models.order.belongsTo(vehicleType);
        // Vehicle type can belong to many vehicle details
        vehicleType.hasMany(models.vehicleDetails);
        models.vehicleDetails.belongsTo(vehicleType);
    };
    
    return vehicleType;
};