module.exports = (sequelize, DataTypes) =>{
    const variants = sequelize.define('variants', {
        name: {
            type: DataTypes.STRING(),
            allowNull: true,
        },
        price: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
    
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        
    });
    variants.associate = (models)=>{
       
    };
    
    return variants;
};