module.exports = (sequelize, DataTypes) =>{
    const defaultValues = sequelize.define('defaultValues', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        value: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    defaultValues.associate = (models)=>{
       
    };
    
    return defaultValues;
};