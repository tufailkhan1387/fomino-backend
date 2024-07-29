module.exports = (sequelize, DataTypes) =>{
    const permissions = sequelize.define('permissions', {
        title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    permissions.associate = (models)=>{

        permissions.hasMany(models.rolePermissions);
        models.rolePermissions.belongsTo(permissions);
    };
    
    return permissions;
};