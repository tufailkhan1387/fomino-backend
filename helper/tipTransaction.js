require('dotenv').config();
//importing Models
const { wallet } = require('../models');

// For paymentByCard = true
// food = true --> Driver is paying and rest is receiving

// Send zero in case you need that variable

module.exports = 
async function TipTransaction(tipAmount, orderId, driverId) {
    let date = Date.now();
    let entryData = [
        { paymentType: 'Admin Received Tip', amount: tipAmount, at: date, orderId: orderId, userId: 1 },
        { paymentType: 'Driver Earned Tip', amount: -1 * tipAmount, at: date, orderId: orderId, userId: driverId },
    ]
    let dat = await wallet.bulkCreate(entryData)
    return dat;
}