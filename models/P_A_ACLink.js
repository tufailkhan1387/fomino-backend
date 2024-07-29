module.exports = (sequelize, DataTypes) =>{
    const P_A_ACLink = sequelize.define('P_A_ACLink', {
        price: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
    });
    P_A_ACLink.associate = (models)=>{
        P_A_ACLink.hasMany(models.orderAddOns);
        models.orderAddOns.belongsTo(P_A_ACLink);
    };
    return P_A_ACLink;
};