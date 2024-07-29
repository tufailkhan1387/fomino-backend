module.exports = (sequelize, DataTypes) =>{
    const charge = sequelize.define('charge', {
        title: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        txt: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        value: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        amount: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        
    });
    return charge;
};