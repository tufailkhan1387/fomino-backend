const axios = require("axios");
const {
  user,
  restaurant,
  order,
  orderCharge,
  orderStatus,
  orderHistory,
  address,
  charge,
  vehicleType,
} = require("../models");
const { Op, where } = require("sequelize");
const { orderDetails } = require("../controllers/user");
require("dotenv").config();

module.exports = async function getFare(
  pickUpId,
  dropOffId,
  vehicleTypeId,
  orderId
) {
  const orderdata = await order.findOne({
    where: { id: orderId },
    attributes: [
      "id",
      "orderNum",
      "total",
      "driverId",
      "pickUpId",
      "dropOffId",
      "vehicleTypeId",
      "userId",
      "orderApplicationId",
    ],
    include: [
      { model: orderCharge, attributes: ["driverEarnings"] },
      {
        model: restaurant,
        attributes: [
          "lat",
          "lng",
          "businessName",
          "countryCode",
          "phoneNum",
          "address",
          "city",
          "zipCode",
        ],
        include: { model: user },
      },
      {
        model: user,
        as: "customerId",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "countryCode",
          "phoneNum",
          "deviceToken",
        ],
      },
    ],
  });
  const addresses = await address.findAll({
    where: {
      id: {
        [Op.or]: [pickUpId, dropOffId],
      },
    },
    attributes: ["id", "lat", "lng"],
  });
  const charges = await charge.findAll({
    where: {
      title: {
        [Op.or]: ["baseFareTaxi", "perMinChargeTaxi", "baseDistTaxi"],
      },
    },
    attributes: ["id", "title", "amount"],
  });
  const vehicleCharge = await vehicleType.findOne({
    where: { id: vehicleTypeId },
    attributes: ["id", "baseRate", "perUnitRate"],
  });
  const pickUpAddress = addresses.find((ele) => ele.id == pickUpId);
  const dropOffAddress = addresses.find((ele) => ele.id == dropOffId);
  const baseFare = charges.find((ele) => ele.title === "baseFareTaxi");
  const perMinCharge = charges.find((ele) => ele.title === "perMinChargeTaxi");
  const baseDist = charges.find((ele) => ele.title === "baseDistTaxi");
  // Getting distance and estimated time of ride
  let resp = "";
  let pickupLat = "";
  let pickupLng = "";
  if (orderdata.orderApplicationId == 2) {
    pickupLat = pickUpAddress.lat;
    pickupLng = pickUpAddress.lng;
  } else {
    pickupLat = orderdata.restaurant.lat;
    pickupLng = orderdata.restaurant.lng;
  }
  resp = await axios.get(
    `${process.env.MAPS_URL}&origin=${pickupLat},${pickupLng}&destination=${dropOffAddress.lat},${dropOffAddress.lng}&key=AIzaSyDoVmHrVkO68EObrVfhWrzgbAHHPQ9McMM`
  );
  //Coverting distance into float
  let distanceinKm = resp.data.routes[0].legs[0].distance.value / 1000;
  // splited = distanceinKm.split(" ");
  // distanceinKm = parseFloat(splited[0]);
  distanceInMiles = distanceinKm * 0.621371;
  //Calculating fare due to distance
  let distFare = 0;
  if (distanceInMiles < parseFloat(baseDist.amount))
    distFare = parseFloat(vehicleCharge.baseRate);
  else {
    let extraDist = distanceInMiles - parseFloat(baseDist.amount);
    distFare =
      parseFloat(vehicleCharge.baseRate) +
      extraDist * parseFloat(vehicleCharge.perUnitRate);
  }
  const order_accepted_on = await orderHistory.findOne({
    where: { orderId, orderStatusId: 2 },
  });
  const order_end_on = await orderHistory.findOne({
    where: { orderId, orderStatusId: 10 },
    order: [["id", "DESC"]],
  });
  // let eTime = resp.data.routes[0].legs[0].duration.value / 60;
  let eTime =
    (order_end_on.createdAt - order_accepted_on.createdAt) / 1000 / 60;
  // tsplited = eTime.split(" ");
  // eTime = parseFloat(tsplited[0])
  let timeFare = eTime * parseFloat(perMinCharge.amount);
  //console.log(parseFloat(baseFare.amount), distFare, timeFare )
  let estdFare = parseFloat(baseFare.amount) + distFare + timeFare;
  estdFare = estdFare.toFixed(2);
  distanceInMiles = distanceInMiles.toFixed(2);
  timeFare = timeFare.toFixed(2);
  //console.log('Dist in mi', distanceInMiles, 'E-TIME', eTime, 'baseFareTaxi', baseFare.amount, 'timeCharges', perMinCharge.amount)
  const ordercharges_update = await orderCharge.update(
    {
      distFare,
      timeFare,
      baseFare: baseFare.amount,
    },
    {
      where: { orderId },
    }
  );
  const ordercharges = await orderCharge.findOne({ where: { orderId } });
  return ordercharges;
  // return {
  //     status: '1',
  //     message: 'Fare of ride',
  //     data: {
  //         baseFare: baseFare.amount,
  //         distanceFare: `${distFare}`,
  //         timeFare: `${timeFare}`,
  //         totalFare: `${estdFare}`,
  //         distance: `${distanceInMiles}`,
  //     },
  //     error: ''
  // };
};
