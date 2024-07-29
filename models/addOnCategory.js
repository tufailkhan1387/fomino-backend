module.exports = (sequelize, DataTypes) =>{
    const addOnCategory = sequelize.define('addOnCategory', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        orderApplicationName: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    addOnCategory.associate = (models)=>{

        addOnCategory.hasMany(models.P_AOLink);
        models.P_AOLink.belongsTo(addOnCategory);
        
    };
    
    return addOnCategory;
};
