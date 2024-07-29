module.exports = (sequelize, DataTypes) =>{
    const menuCategory = sequelize.define('menuCategory', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        businessType: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        image: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    menuCategory.associate = (models)=>{
        menuCategory.hasMany(models.R_MCLink);
        models.R_MCLink.belongsTo(menuCategory);
    };
    
    return menuCategory;
};