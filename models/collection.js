module.exports = (sequelize, DataTypes) =>{
    const collection = sequelize.define('collection', {
        title: {
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
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    collection.associate = (models)=>{
        collection.hasMany(models.collectionAddons);
        models.collectionAddons.belongsTo(collection); 
        
        collection.hasMany(models.productCollections);
        models.productCollections.belongsTo(collection);
        
         collection.hasMany(models.orderAddOns);
        models.orderAddOns.belongsTo(collection);
    };
    return collection;
};
