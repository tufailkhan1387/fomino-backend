require('dotenv').config();
//importing Models
const { wallet } = require('../models');

// For paymentByCard = true
// food = true --> Driver is paying and rest is receiving

// Send zero in case you need that variable
// TODO I guess something is wrong with self pickup scenario 
module.exports = 
async function paymentTransaction(paymentByCard, adminReceived, UserPaid, 
    driverPaid, restReceived, driverReceived, food, orderId, userId, driverId, restId, deliveryMode, currencyUnitId
){
    let date = Date.now();
    if(paymentByCard){
        let entryData = [
            {paymentType: 'Received by Admin', amount: adminReceived, at: date, orderId: orderId, userId: 1, currencyUnitId},
            {paymentType: 'Paid by User', amount: -1*UserPaid, at: date, orderId: orderId, userId: userId, currencyUnitId},
        ]
        let dat = await wallet.bulkCreate(entryData)
        return dat;
    }
    else{
        if(food){
            let entryData = [
                {paymentType: 'Received by Restaurant', amount: restReceived, at: date, orderId: orderId, restaurantId: restId, currencyUnitId},
                {paymentType: 'Paid by Driver', amount: -1*driverPaid, at: date, orderId: orderId, userId: driverId, currencyUnitId},
            ]
            let dat = await wallet.bulkCreate(entryData)
            return dat;  
        }
        //
        else{
            let dat;
            // If mode of recieveing food is delivery
            if(deliveryMode === 'delivery'){
                let entryData = [
                    {paymentType: 'Received by Driver', amount: driverReceived, at: date, orderId: orderId, userId: driverId, currencyUnitId },
                    {paymentType: 'Paid by User', amount: -1*UserPaid, at: date, orderId: orderId, userId: userId, currencyUnitId},
                ]
                 dat = await wallet.bulkCreate(entryData)
            } // mode is self pickup
            else{
                let entryData = [
                    {paymentType: 'Received by Restaurant', amount: restReceived, at: date, orderId: orderId, restaurantId: restId, currencyUnitId },
                    {paymentType: 'Paid by User', amount: -1*UserPaid, at: date, orderId: orderId, userId: userId, currencyUnitId},
                ]
                 dat = await wallet.bulkCreate(entryData)
            }
            return dat;
        }
    }
    
}