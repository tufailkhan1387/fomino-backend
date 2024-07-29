module.exports = (sequelize, DataTypes) =>{
    const driverZone = sequelize.define('driverZone', {
        language: {
            type: DataTypes.STRING(),
            allowNull: true,
        }
    });
    return driverZone;
};