require("dotenv").config();
const Flutterwave = require("flutterwave-node-v3");

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

module.exports = async function create_new_charges_flutterwave(
  amount,
  card_number,
  exp_month,
  exp_year,
  cvc,
  email,
  tx_ref
) {
  const payload = {
    card_number: card_number,
    cvv: cvc,
    expiry_month: exp_month,
    expiry_year: exp_year,
    currency: "USD",
    amount: amount,
    email: email,
    // fullname: req.body.card_name,
    // Generate a unique transaction reference
    tx_ref: tx_ref,
    redirect_url: process.env.APP_BASE_URL + "/pay/redirect",
    enckey: process.env.FLW_ENCRYPTION_KEY,
  };
  const response = await flw.Charge.card(payload);
  console.log(response);
  return response;
};
