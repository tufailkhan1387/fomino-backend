module.exports = (sequelize, DataTypes) =>{
    const P_AOLink = sequelize.define('P_AOLink', {
        maxAllowed: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        minAllowed: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        displayText:{
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
    });
    P_AOLink.associate = (models)=>{
        P_AOLink.hasMany(models.P_A_ACLink);
        models.P_A_ACLink.belongsTo(P_AOLink);
        P_AOLink.hasMany(models.orderAddOns);
        models.orderAddOns.belongsTo(P_AOLink);
    };

    return P_AOLink;
};
