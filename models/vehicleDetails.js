module.exports = (sequelize, DataTypes) =>{
    const vehicleDetails = sequelize.define('vehicleDetails', {
        make: {
            type: DataTypes.STRING(),
            allowNull: true,
        }, 
        model: {
            type: DataTypes.STRING(),
            allowNull: true,
        }, 
        year: {
            type: DataTypes.STRING(),
            allowNull: true,
        }, 
        registrationNum: {
            type: DataTypes.STRING(),
            allowNull: true,
        }, 
        color: {
            type: DataTypes.STRING(),
            allowNull: true,
        }, 
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },  
    });
    vehicleDetails.associate = (models)=>{
        vehicleDetails.hasMany(models.vehicleImages, {
            as: 'vehicleImages',
            foreignKey: 'vehicleDetailId'
          });
        vehicleDetails.hasMany(models.vehicleImages, {
            as: 'vehicleDocuments',
            foreignKey: 'vehicleDetailId'
          });
        models.vehicleImages.belongsTo(vehicleDetails);
    };
    
    return vehicleDetails;
};