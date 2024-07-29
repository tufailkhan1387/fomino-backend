module.exports = (sequelize, DataTypes) =>{
    const restaurant = sequelize.define('restaurant', {
        businessName: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        businessEmail: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        countryCode: {
            type: DataTypes.STRING(4),
            allowNull: true,
        },
        phoneNum: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        lat: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        lng: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        zipCode: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        address: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        description: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        logo: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        image: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        deliveryCharge: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        serviceCharges: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        businessType: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        serviceChargesType: {
            type: DataTypes.STRING(), // flat or percentage
            allowNull: true,
        },
        serviceChargesStatus: {
            type: DataTypes.BOOLEAN(),
            allowNull: true,
        },
        openingTime:{
            type: DataTypes.DATE,
            allowNull: true,
        },
        closingTime:{
            type: DataTypes.DATE,
            allowNull: true,
        },
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        approxDeliveryTime:{
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        deliveryFeeFixed:{
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
        minOrderAmount:{
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
        certificateCode:{
            type: DataTypes.STRING(),
            allowNull: true,
        },
        packingFee:{
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
        },
        deliveryRadius:{
            type: DataTypes.FLOAT(5,2),
            allowNull: true,
        },
        isPureVeg:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        isFeatured:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        comission:{
            type: DataTypes.FLOAT(5,2),
            allowNull: true,
        },
        pricesIncludeVAT:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        VATpercent:{
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        isRushMode:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        rushModeTime:{
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        isOpen:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        
    });
    restaurant.associate = (models)=>{
        restaurant.hasMany(models.R_MCLink);
        models.R_MCLink.belongsTo(restaurant);
        //
        restaurant.hasMany(models.R_CLink);
        models.R_CLink.belongsTo(restaurant);
        // EACH RESTUARANT HAS ONE DELIVERY FEE OF DYNAMIC TYPE
        restaurant.hasOne(models.deliveryFee);
        models.deliveryFee.belongsTo(restaurant);
        // Each restuarnat can have many orders
        restaurant.hasMany(models.order);
        models.order.belongsTo(restaurant);
        // Each restuarnat can have ratings
        restaurant.hasMany(models.restaurantRating);
        models.restaurantRating.belongsTo(restaurant);
        // Each restuarnat can have ratings
        restaurant.hasMany(models.wallet);
        models.wallet.belongsTo(restaurant);
        // Each restuarnat can have payouts
        restaurant.hasMany(models.payout);
        models.payout.belongsTo(restaurant);   
        restaurant.hasMany(models.tableBooking);
        models.tableBooking.belongsTo(restaurant);  
        models.payout.belongsTo(restaurant);  
        
        
        restaurant.hasMany(models.restaurant_cultery);
        models.restaurant_cultery.belongsTo(restaurant);  
        restaurant.hasOne(models.restaurantEarning);
        models.restaurantEarning.belongsTo(restaurant);  
        
                
        restaurant.hasOne(models.restaurantDriver);
        models.restaurantDriver.belongsTo(restaurant); 
        
        restaurant.hasMany(models.addOnCategory);
        models.addOnCategory.belongsTo(restaurant); 
        
        restaurant.hasMany(models.time);
        models.time.belongsTo(restaurant); 
        
        restaurant.hasOne(models.zoneRestaurants);
        models.zoneRestaurants.belongsTo(restaurant); 
        
        restaurant.hasMany(models.addOnCategory);
        models.addOnCategory.belongsTo(restaurant); 
        
        restaurant.hasMany(models.productStock);
        models.productStock.belongsTo(restaurant); 
        
        restaurant.hasMany(models.collection);
        models.collection.belongsTo(restaurant);
        
        restaurant.hasMany(models.addOn);
        models.addOn.belongsTo(restaurant); 
        
        restaurant.hasOne(models.favouriteRestaurant);
        models.favouriteRestaurant.belongsTo(restaurant); 
        
    
        
    };
    return restaurant;
};
