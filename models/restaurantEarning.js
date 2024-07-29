module.exports = (sequelize, DataTypes) =>{
    const restaurantEarning = sequelize.define('restaurantEarning', {
        
        totalEarning: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
        availableBalance: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
    });
    restaurantEarning.associate = (models)=>{
        
    };
    return restaurantEarning;
};
