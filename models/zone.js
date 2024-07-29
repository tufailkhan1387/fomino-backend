module.exports = (sequelize, DataTypes) =>{
    const zone = sequelize.define('zone', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        coordinates: {
            type: DataTypes.GEOMETRY('POLYGON'),
            allowNull: true,
        },
       
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    zone.associate = (models)=>{
        
        zone.hasOne(models.zoneDetails);
        models.zoneDetails.belongsTo(zone);

        zone.hasOne(models.driverZone);
        models.driverZone.belongsTo(zone);
        
        zone.hasMany(models.zoneRestaurants);
        models.zoneRestaurants.belongsTo(zone);
    };
    return zone;
};
