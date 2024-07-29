module.exports = (sequelize, DataTypes) =>{
    const appPage = sequelize.define('appPage', {
        page: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT('long'),
            allowNull: true,
        }
    });
    return appPage;
};