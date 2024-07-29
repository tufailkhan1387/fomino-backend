module.exports = (sequelize, DataTypes) =>{
    const serviceType = sequelize.define('serviceType', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        }, 
    });
    serviceType.associate = (models)=>{
        serviceType.hasMany(models.driverDetails);
        models.driverDetails.belongsTo(serviceType);
    };
    
    return serviceType;
};