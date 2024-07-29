module.exports = (sequelize, DataTypes) =>{
    const product = sequelize.define('product', {
        
    });
    product.associate = (models)=>{
        // Product has many Restaurant-Product Link
        product.hasMany(models.R_PLink);
        models.R_PLink.belongsTo(product);
    };
    return product;
};