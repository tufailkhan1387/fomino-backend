module.exports = (sequelize, DataTypes) =>{
    const addressType = sequelize.define('addressType', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    addressType.associate = (models)=>{
        addressType.hasMany(models.address);
        models.address.belongsTo(addressType);
    };
    
    return addressType;
};