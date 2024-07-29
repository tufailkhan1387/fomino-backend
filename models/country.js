module.exports = (sequelize, DataTypes) =>{
    const country = sequelize.define('country', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        shortName: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        flag: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
       
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    country.associate = (models)=>{
        
        country.hasMany(models.city);
        models.city.belongsTo(country);
        country.hasOne(models.driverZone);
        models.driverZone.belongsTo(country);
    };
    return country;
};
