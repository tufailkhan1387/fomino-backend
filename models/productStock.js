module.exports = (sequelize, DataTypes) =>{
    const productStock = sequelize.define('productStock', {
        currentStock:{
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        stock:{
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        date:{
            type: DataTypes.DATE,
            allowNull: true,
        },
        status:{
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
       
   
      
    });
    productStock.associate = (models)=>{
        
    };
    return productStock;
};