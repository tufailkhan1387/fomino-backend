module.exports = (sequelize, DataTypes) =>{
    const Credit = sequelize.define('Credit', {
        point: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        referalCode: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
       
       
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    Credit.associate = (models)=>{
        
    };
    return Credit;
};
