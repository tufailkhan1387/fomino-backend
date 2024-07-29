const axios = require('axios');

require('dotenv').config();

module.exports = async function getDirections(fromlat, fromlng, tolat, tolng) {
   let data = await axios.get(process.env.MAPS_URL+"&origin="+fromlat+","+fromlng+"&destination="+tolat+","+tolng+"&key="+process.env.MAPS_KEY);
    return data.data;
}