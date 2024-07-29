module.exports = (sequelize, DataTypes) =>{
    const restaurant_cultery = sequelize.define('restaurant_cultery', {
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    restaurant_cultery.associate = (models)=>{
        
       
        
       
    };
    
    return restaurant_cultery;
};