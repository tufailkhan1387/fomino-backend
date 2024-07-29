require("dotenv").config();
const { user } = require("../models");
const stripe = require("stripe")(process.env.STRIPE_KEY);

module.exports = async function create_new_charges_stripe(
  amount,
  card_number,
  exp_month,
  exp_year,
  cvc,
  userId,
  check
) {
  const user_data = await user.findOne({ where: { id: userId } });
  let cards;
  let pm;
  let attach;

  const token = await stripe.tokens.create({
    card: {
      number: card_number,
      exp_month: exp_month,
      exp_year: exp_year,
      cvc: cvc,
    },
  });

  const data = await stripe.charges.create({
    amount: amount * 100,
    currency: "USD",
    source: token.id,
    capture: true,
  });

  if (check === true) {
    flag = 0;
    cards = await stripe.paymentMethods.list({
      customer: user_data.stripeCustomerId,
      type: "card",
    });
    if (cards.data.length < 1) {
      flag = 1;
    }
    pm = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: card_number,
        exp_month: exp_month,
        exp_year: exp_year,
        cvc: cvc,
      },
    });

    attach = await stripe.paymentMethods.attach(pm["id"], {
      customer: user_data.stripeCustomerId,
    });

    if (flag == 1) {
      result = await stripe.customers.update(user_data.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: pm["id"],
        },
      });
    }
  }

  return data;
};
