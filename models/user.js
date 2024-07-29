module.exports = (sequelize, DataTypes) =>{
    const user = sequelize.define('user', {
        userName: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        firstName: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        lastName: {
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
        password: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        deviceToken: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        stripeCustomerId: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        userTypeId: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        driverType: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        signedFrom: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        referalCode: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        usedReferalCode: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        ip: {
            type: DataTypes.TEXT('long'),
            allowNull: true,
        },
    });
    
    user.associate = (models)=>{
        // Each user can have one email verification code
        user.hasOne(models.emailVerification);
        models.emailVerification.belongsTo(user);
        // Each user can have one email verification code
        user.hasMany(models.forgetPassword);
        models.forgetPassword.belongsTo(user);
        // Each user can have many addresses
        user.hasMany(models.address);
        models.address.belongsTo(user);

        user.hasMany(models.orderGroup_Items);
        models.orderGroup_Items.belongsTo(user);
        
        user.hasOne(models.driverEarning);
        models.driverEarning.belongsTo(user);
        
        user.hasOne(models.Credit);
        models.Credit.belongsTo(user);
        user.hasOne(models.driverZone);
        models.driverZone.belongsTo(user);
        
        
        //  user.hasMany(models.Credit,{
        //     onDelete: 'cascade', foreignKey: 'GivenById' 
        // });
        // models.Credit.belongsTo(user,{as: 'GivenBy',foreignKey: 'GivenById' });
        
        
        // Each user can create many orders
        user.hasMany(models.order,{
            onDelete: 'cascade', foreignKey: 'userId' 
        });
        models.order.belongsTo(user);
        // Participant in group order
        user.hasMany(models.orderGroup,{
            onDelete: 'cascade', foreignKey: 'participantId' 
        });
        models.orderGroup.belongsTo(user, {as: 'participant',foreignKey: 'participantId' });
        // Each driver can accept many orders
        user.hasMany(models.order,{
            onDelete: 'cascade', foreignKey: 'driverId' 
        });
        models.order.belongsTo(user,{as: 'DriverId',foreignKey: 'driverId' });
        
        //Each user has many driver ratings
        user.hasMany(models.driverRating,{
            onDelete: 'cascade', foreignKey: 'userId' 
        });
        models.driverRating.belongsTo(user,{as: 'userID',foreignKey: 'userId' });
        // Each driver can accept many orders
        user.hasMany(models.driverRating,{
            onDelete: 'cascade', foreignKey: 'driverId' 
        });
        models.driverRating.belongsTo(user,{as: 'driverID',foreignKey: 'driverId' });
        //Each user has many restaurant ratings
        user.hasMany(models.restaurantRating);
        models.restaurantRating.belongsTo(user);
        //Each user has many wallet entries
        user.hasMany(models.wallet);
        models.wallet.belongsTo(user);
        //Each user can have many driver details
        user.hasMany(models.driverDetails);
        models.driverDetails.belongsTo(user);
        // Each user can cancel many order
        user.hasMany(models.orderHistory, {foreignKey: 'cancelledBy'});
        models.orderHistory.belongsTo(user, {as: 'cancelledBY', foreignKey: 'cancelledBy'});
        // Each user can have many vehicle details
        user.hasMany(models.vehicleDetails);
        models.vehicleDetails.belongsTo(user);
        user.hasMany(models.restaurant);
        models.restaurant.belongsTo(user);
        user.hasMany(models.tableBooking);
        models.tableBooking.belongsTo(user);
        models.restaurant.belongsTo(user);
        
        user.hasOne(models.restaurantDriver);
        models.restaurantDriver.belongsTo(user);
        
        user.hasOne(models.orderItems);
        models.orderItems.belongsTo(user);
        
        user.hasMany(models.wishList);
        models.wishList.belongsTo(user);
        
        user.hasMany(models.favouriteRestaurant);
        models.favouriteRestaurant.belongsTo(user);

        
    };
    return user;
};