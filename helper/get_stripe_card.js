require('dotenv').config();
const { user } = require('../models');
const stripe = require('stripe')(process.env.STRIPE_KEY);

module.exports = async function get_stripe_card(userId) {
    const user_data = await user.findOne({where: {'id':userId}});
    let cards;

        cards = await stripe.paymentMethods.list({
            'customer' : user_data.stripeCustomerId,
            'type' : 'card',
        });
    
      return cards;
}