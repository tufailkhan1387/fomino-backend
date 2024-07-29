module.exports = (sequelize, DataTypes) =>{
    const R_MCLink = sequelize.define('R_MCLink', {
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    R_MCLink.associate = (models)=>{
        R_MCLink.hasMany(models.R_PLink);
        models.R_PLink.belongsTo(R_MCLink);
    };
    return R_MCLink;
};