module.exports = (sequelize, DataTypes) =>{
    const R_PLink = sequelize.define('R_PLink', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        nutrients: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        allergies: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        ingredients: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        countryOfOrigin: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        description:{
            type: DataTypes.STRING(),
            allowNull: true,
        },
        image: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        originalPrice: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        deliveryPrice: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        pickupPrice: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        discountPrice:{
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        originalPrice: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        discountPrice:{
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        discountValue: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        discountLimit:{
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        isPopular:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        isNew:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        isRecommended:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        isAdult:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        isAvailable:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        sold:{
            type: DataTypes.INTEGER,
            allowNull: true,
        },
      
    });
    R_PLink.associate = (models)=>{
        // R_PLink has many Product-AddOn Link
        R_PLink.hasMany(models.P_AOLink);
        models.P_AOLink.belongsTo(R_PLink);
        //
        R_PLink.hasMany(models.orderItems);
        models.orderItems.belongsTo(R_PLink);

        R_PLink.hasMany(models.orderGroup_Items);
        models.orderGroup_Items.belongsTo(R_PLink);
        
        R_PLink.hasMany(models.wishList);
        models.wishList.belongsTo(R_PLink);
        
        R_PLink.hasMany(models.variants);
        models.variants.belongsTo(R_PLink);
        
        R_PLink.hasOne(models.productStock);
        models.productStock.belongsTo(R_PLink);
        
        R_PLink.hasMany(models.productCollections);
        models.productCollections.belongsTo(R_PLink);
        
       
    };
    return R_PLink;
};