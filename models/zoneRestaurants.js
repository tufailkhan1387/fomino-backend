module.exports = (sequelize, DataTypes) =>{
    const zoneRestaurants = sequelize.define('zoneRestaurants', {
       
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        
    });
    zoneRestaurants.associate = (models)=>{

    };
    return zoneRestaurants;
};
