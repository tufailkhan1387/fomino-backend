module.exports = (sequelize, DataTypes) =>{
    const zoneDetails = sequelize.define('zoneDetails', {
        moduleType: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        baseCharges: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        baseDistance: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        perKmCharges: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        minDeliveryCharges: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        maxDeliveryCharges: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        maxCODorderAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
       
        adminComission: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
       
        adminComissionOnDeliveryCharges: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
       
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    zoneDetails.associate = (models)=>{
        
      
    };
    return zoneDetails;
};
