module.exports = (sequelize, DataTypes) =>{
    const banner = sequelize.define('banner', {
        title: {
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
    banner.associate = (models)=>{
        
    };
    return banner;
};
