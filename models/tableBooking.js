module.exports = (sequelize, DataTypes) =>{
    const tableBooking = sequelize.define('tableBooking', {
        noOfMembers: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        message: {
            type: DataTypes.TEXT('long'),
            allowNull: true,
        },
        date: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        time: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    
    return tableBooking;
};