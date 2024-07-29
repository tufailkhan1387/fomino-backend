module.exports = (sequelize, DataTypes) =>{
    const appLink = sequelize.define('appLink', {
        app: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        link: {
            type: DataTypes.STRING(72),
            allowNull: true,
        },
        logo: {
            type: DataTypes.STRING(72),
            allowNull: true,
        },
        title: {
            type: DataTypes.STRING(72),
            allowNull: true,
        }
    });
    return appLink;
};