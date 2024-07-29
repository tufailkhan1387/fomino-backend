module.exports = (sequelize, DataTypes) =>{
    const unit = sequelize.define('unit', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        type: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        symbol:{
            type: DataTypes.STRING(),
            allowNull: true,
        }, 
        shortcode:{
            type: DataTypes.STRING(),
            allowNull: true,
        }, 
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    unit.associate = (models)=>{
        unit.hasMany(models.restaurant, { foreignKey: 'currencyUnitId' });
        models.restaurant.belongsTo(unit, {as: 'currencyUnitID',foreignKey: 'currencyUnitId' });
        
        unit.hasMany(models.R_PLink, { foreignKey: 'currencyUnitId' });
        models.R_PLink.belongsTo(unit, {as: 'currencyUnitID',foreignKey: 'currencyUnitId' });
        
        unit.hasMany(models.restaurant, { foreignKey: 'distanceUnitId' });
        models.restaurant.belongsTo(unit, {as: 'distanceUnitID',foreignKey: 'distanceUnitId' });
        //Units has many payouts
        unit.hasMany(models.payout);
        models.payout.belongsTo(unit);
        
        unit.hasMany(models.voucher);
        models.voucher.belongsTo(unit);
        
        unit.hasMany(models.order, { foreignKey: 'currencyUnitId' });
        models.order.belongsTo(unit, {as: 'currencyUnitID',foreignKey: 'currencyUnitId' });
        
        unit.hasMany(models.wallet, { foreignKey: 'currencyUnitId' });
        models.wallet.belongsTo(unit, {as: 'currencyUnitID',foreignKey: 'currencyUnitId' });

        unit.hasMany(models.wallet, {as: 'currencyUnit', foreignKey: 'currencyUnitId' });
        models.wallet.belongsTo(unit, {as: 'currencyUnit',foreignKey: 'currencyUnitId' });
        
        unit.hasMany(models.user);
        models.user.belongsTo(unit);
        
        unit.hasMany(models.restaurant);
        models.restaurant.belongsTo(unit);
        
        unit.hasMany(models.charge);
        models.charge.belongsTo(unit);
        
         unit.hasOne(models.zoneDetails, { foreignKey: 'distanceUnitId' });
        models.zoneDetails.belongsTo(unit, {as: 'distanceUnit',foreignKey: 'distanceUnitId' });
        
        unit.hasOne(models.zoneDetails, { foreignKey: 'currencyUnitId' });
        models.zoneDetails.belongsTo(unit, {as: 'currencyUnit',foreignKey: 'currencyUnitId' });
        
    };
    
    return unit;
};