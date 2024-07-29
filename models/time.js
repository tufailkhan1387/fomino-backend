module.exports = (sequelize, DataTypes) =>{
    const time = sequelize.define('time', {
        day: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        startAt: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        endAt: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        }
    });
    return time;
};