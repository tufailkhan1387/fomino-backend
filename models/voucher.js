module.exports = (sequelize, DataTypes) =>{
    const voucher = sequelize.define('voucher', {
        code: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        value: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        type: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        storeApplicable: {
            type: DataTypes.TEXT('long'),
            allowNull: true,
        },
        from: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        to: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        conditionalAmount: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        
    });
    voucher.associate = (models)=>{
        voucher.hasMany(models.order);
        models.order.belongsTo(voucher);
    };
    
    return voucher;
};