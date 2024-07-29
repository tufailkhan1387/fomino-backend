module.exports = (sequelize, DataTypes) =>{
    const orderCultery = sequelize.define('orderCultery', {
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        qty:{
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    });
    orderCultery.associate = (models)=>{
        
       
        
       
    };
    
    return orderCultery;
};