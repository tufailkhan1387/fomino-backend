module.exports = (sequelize, DataTypes) =>{
    const socialLink = sequelize.define('socialLink', {
        social: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        link: {
            type: DataTypes.STRING(10),
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
    return socialLink;
};