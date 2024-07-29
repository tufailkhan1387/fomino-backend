module.exports = (sequelize, DataTypes) =>{
    const addOn = sequelize.define('addOn', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        orderApplicationName: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        minAllowed: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        maxAllowed: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        isPaid:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        isAvaiable :{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    addOn.associate = (models)=>{
        addOn.hasMany(models.P_A_ACLink);
        models.P_A_ACLink.belongsTo(addOn);
        addOn.hasOne(models.collectionAddons);
        models.collectionAddons.belongsTo(addOn);
        
        addOn.hasMany(models.orderAddOns);
        models.orderAddOns.belongsTo(addOn);
    };
    return addOn;
};
