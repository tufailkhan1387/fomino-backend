module.exports = (sequelize, DataTypes) =>{
    const address = sequelize.define('address', {
        title: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        building: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        streetAddress: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        nameOnDoor: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        floor: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        entrance: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        
        deliveryLocation: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        state: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        zipCode: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        lat: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        lng: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        otherType: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        locationType: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        AddressType: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        saveAddress: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    address.associate = (models)=>{
        // Each address can create many orders
        address.hasMany(models.order,{
            onDelete: 'cascade', foreignKey: 'pickUpId' 
        });
        models.order.belongsTo(address,{as: 'pickUpID',foreignKey: 'pickUpId' });
        // Each driver can accept many orders
        address.hasMany(models.order,{
            onDelete: 'cascade', foreignKey: 'dropOffId' 
        });
        models.order.belongsTo(address,{as: 'dropOffID',foreignKey: 'dropOffId' });
        

    };
    return address;
};