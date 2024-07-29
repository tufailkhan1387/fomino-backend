module.exports = (sequelize, DataTypes) =>{
    const restaurantDriver = sequelize.define('restaurantDriver', {
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    restaurantDriver.associate = (models)=>{
        
       
        
       
    };
    
    return restaurantDriver;
};