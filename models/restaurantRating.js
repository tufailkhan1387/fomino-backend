module.exports = (sequelize, DataTypes) =>{
    const restaurantRating = sequelize.define('restaurantRating', {
        value: {
            type: DataTypes.INTEGER(),
            allowNull: true,
        },
        comment: {
            type: DataTypes.TEXT(),
            allowNull: true,
        },
        at: {
            type: DataTypes.DATE,
            allowNull: true,
        },  
    });
    return restaurantRating;
};