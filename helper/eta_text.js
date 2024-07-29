const axios = require('axios');
const directions = require('./directions');

require('dotenv').config();

module.exports = async function eta_text(fromlat, fromlng, tolat, tolng) {
   let data = await directions(fromlat, fromlng, tolat, tolng);
   let eta_data;
    if(data.status == "OK"){
        eta_data = data.routes[0].legs[0].duration.text;
    }
    else{
        eta_data = "";
    }
    return eta_data;
}