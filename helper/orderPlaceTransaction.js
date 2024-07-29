require('dotenv').config();
//importing Models
const { wallet } = require('../models');
// For orderRideSharing = true --> it implies the order is of taxi side
// deliveryType = 1 --> indicates it belongs to delivery
// deliveryType = 2 --> indicates it belongs to self pickup
// Send zero in case you need that variable
// TODO Handle discount scenario and add another entry which handles discount
module.exports = 
async function orderPlaceTrans(orderRideSharing, deliveryType,orderId, adminEarning, driverEarning, 
    userCharge, restaurantEarning, driverId, userId, restId, currencyUnitId) {
    let date = Date.now();
    if(orderRideSharing){
        let entryData = [
            {paymentType: 'Admin Earning', amount: -1*adminEarning, at: date, orderId: orderId, userId: 1, currencyUnitId},
            {paymentType: 'Driver Earning', amount: -1*driverEarning, at: date, orderId: orderId, userId: driverId, currencyUnitId},
            {paymentType: 'Charged to User', amount: userCharge, at: date, orderId: orderId, userId: userId, currencyUnitId },
        ]
        let dat = await wallet.bulkCreate(entryData)
        return dat;
    }
    else{
        // Delivery
        if(deliveryType === 1){
            let entryData = [
                {paymentType: 'Admin Earning', amount: -1*adminEarning, at: date, orderId: orderId, userId: 1,currencyUnitId},
                {paymentType: 'Driver Earning', amount: -1*driverEarning, at: date, orderId: orderId, userId: driverId,currencyUnitId},
                {paymentType: 'Charged to User', amount: userCharge, at: date, orderId: orderId, userId: userId, currencyUnitId },
                {paymentType: 'Restaurant Earning', amount: -1*restaurantEarning, at: date, orderId: orderId, restaurantId: restId, currencyUnitId },
            ]
            let data = await wallet.bulkCreate(entryData)
            return data;
        }
        else {
            let entryData = [
                {paymentType: 'Admin Earning', amount: -1*adminEarning, at: date, orderId: orderId, userId: 1, currencyUnitId},
                {paymentType: 'Charged to User', amount: userCharge, at: date, orderId: orderId, userId: userId, currencyUnitId },
                {paymentType: 'Restaurant Earning', amount: -1*restaurantEarning, at: date, orderId: orderId, restaurantId: restId, currencyUnitId },
            ]
            let dat = await wallet.bulkCreate(entryData)
            return true;
        } 
    }
}