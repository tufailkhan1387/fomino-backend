module.exports = (sequelize, DataTypes) =>{
    const cuisine = sequelize.define('cuisine', {
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
    cuisine.associate = (models)=>{
        cuisine.hasMany(models.R_CLink);
        models.R_CLink.belongsTo(cuisine);
    };
    
    return cuisine;
};