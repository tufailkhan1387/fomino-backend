module.exports = (sequelize, DataTypes) =>{
    const wishList = sequelize.define('wishList', {
      
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
         
    });
    return wishList;
};