require('dotenv').config();
const { user } = require('../models');
const stripe = require('stripe')(process.env.STRIPE_KEY);

module.exports = async function create_old_charges_stripe(amount, pmId, userId) {

    let userdetail = await user.findOne({where: {id:userId}});
    let customer_id = userdetail.stripeCustomerId;

    let charge = await stripe.paymentIntents.create({
        'amount' : amount * 100,
        'currency' : 'USD',
        'customer' : customer_id,
        'payment_method' : pmId,
        'payment_method_types' : ['card'],
        'capture_method' : 'manual'
    });      
        await stripe.paymentIntents.confirm(charge.id);  
        let ch = await stripe.paymentIntents.capture(
              charge.id,
              []
            );
        return ch;
}