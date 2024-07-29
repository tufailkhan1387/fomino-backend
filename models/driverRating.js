module.exports = (sequelize, DataTypes) =>{
    const driverRating = sequelize.define('driverRating', {
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
    return driverRating;
};