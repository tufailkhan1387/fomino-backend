module.exports = (sequelize, DataTypes) =>{
    const productCollections = sequelize.define('productCollections', {
        
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
       
    });
    productCollections.associate = (models)=>{
        
    };
    return productCollections;
};
