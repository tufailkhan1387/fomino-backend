module.exports = (sequelize, DataTypes) =>{
    const driverEarning = sequelize.define('driverEarning', {
        
        totalEarning: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
        availableBalance: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
    });
    driverEarning.associate = (models)=>{
        
    };
    return driverEarning;
};
