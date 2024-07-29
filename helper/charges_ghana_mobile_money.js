require('dotenv').config();
const Flutterwave = require('flutterwave-node-v3');

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

module.exports = async function charges_ghana_mobile_money(phone_number, type, amount, currency, network, email, tx_ref) {

    const payload = {
        phone_number: phone_number,
        type: type,
        amount: amount,
        currency: currency,
        network: network,
        email: email,
        tx_ref: tx_ref,
        redirect_url : "https://google.com"
    }
    const return_data = await flw.MobileMoney.ghana(payload);
    return typeof(return_data) == "string" ? "Flutter Wave Error, Please try again":return_data ;
}