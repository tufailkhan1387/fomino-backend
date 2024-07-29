module.exports = (sequelize, DataTypes) =>{
    const rolePermissions = sequelize.define('rolePermissions', {
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    rolePermissions.associate = (models)=>{

       
    };
    
    return rolePermissions;
};