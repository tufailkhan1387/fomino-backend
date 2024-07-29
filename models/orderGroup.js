module.exports = (sequelize, DataTypes) =>{
    const orderGroup = sequelize.define('orderGroup', {
       groupName: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
       participantName: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
       icon: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
       hostedById: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
       subTotal: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    });

    orderGroup.associate = (models)=>{
       
        orderGroup.hasMany(models.orderGroup_Items);
        models.orderGroup_Items.belongsTo(orderGroup);
    
       
    };
    return orderGroup;
};

