module.exports = (sequelize, DataTypes) =>{
    const role = sequelize.define('role', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    role.associate = (models)=>{
        role.hasMany(models.user);
        models.user.belongsTo(role);

        role.hasMany(models.user);
        models.user.belongsTo(role);

        role.hasMany(models.rolePermissions);
        models.rolePermissions.belongsTo(role);
    };
    

    return role;
};