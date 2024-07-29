module.exports = (sequelize, DataTypes) =>{
    const setting = sequelize.define('setting', {
        content: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        value: {
            type: DataTypes.STRING(10),
            allowNull: true,
        }
    });
    return setting;
};