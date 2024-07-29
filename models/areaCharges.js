module.exports = (sequelize, DataTypes) =>{
    const areaCharges = sequelize.define('areaCharges', {
        amount: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    });
    areaCharges.associate = (models)=>{
        
        
    };
    return areaCharges;
};
