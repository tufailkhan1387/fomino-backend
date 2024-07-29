module.exports = (sequelize, DataTypes) =>{
    const vehicleImages = sequelize.define('vehicleImages', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        image: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        uploadTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    // vehicleImages.associate = (models)=>{
    //     vehicleImages.hasMany(models.driverDetails);
    //     models.driverDetails.belongsTo(vehicleImages);
    // };
    
    return vehicleImages;
};