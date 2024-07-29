module.exports = (sequelize, DataTypes) =>{
    const driverDetails = sequelize.define('driverDetails', {
        profilePhoto: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        licIssueDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        licExpiryDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        licNum: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        licFrontPhoto: {
            type: DataTypes.STRING(),
            allowNull: true,
        }, 
        licBackPhoto: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        accountTitle: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        accountNumber: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        bankName: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        routingNumber: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    
    // driverDetails.associate = (models)=>{
    //     // Each driverDetails can have one email verification code
    //     driverDetails.hasOne(models.emailVerification);
    //     models.emailVerification.belongsTo(driverDetails);
    // };
    return driverDetails;
};