module.exports = (sequelize, DataTypes) =>{
    const favouriteRestaurant = sequelize.define('favouriteRestaurant', {
       
        businessType: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        
    });
    return favouriteRestaurant;
};