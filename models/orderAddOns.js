module.exports = (sequelize, DataTypes) =>{
    const orderAddOns = sequelize.define('orderAddOns', {
        total: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
        qty: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    });

    // orderAddOns.associate = (models)=>{
    //     orderAddOns.hasMany(models.P_A_ACLink);
    //     models.P_A_ACLink.belongsTo(orderAddOns);
    // };
    return orderAddOns;
};
