require("dotenv").config();
//importing Models
const {
  user,
  userType,
  role,
  addressType,
  menuCategory,
  cuisine,
  paymentMethod,
  deliveryType,
  deliveryFeeType,
  unit,
  restaurant,
  deliveryFee,
  addOnCategory,
  addOn,
  product,
  R_PLink,
  P_AOLink,
  R_CLink,
  voucher,
  R_MCLink,
  vehicleType,
  wallet,
  order,
  orderStatus,
  driverDetails,
  serviceType,
  vehicleDetails,
  vehicleImages,
  driverRating,
  P_A_ACLink,
  orderApplication,
  orderMode,
  address,
  orderCharge,
  orderHistory,
  orderItems,
  orderAddOns,
  restaurantRating,
  payout,
  tableBooking,
} = require("../models");
// Importing Custom exception
const CustomException = require("../middlewares/errorObject");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const redis_Client = require("../routes/redis_connect");
const { sign } = require("jsonwebtoken");
const sendNotification = require("../helper/notifications");
const orderPlaceTransaction = require("../helper/orderPlaceTransaction");
const paymentTransaction = require("../helper/paymentTransaction");

const uuid = require("uuid");
const ApiResponse = require("../helper/ApiResponse");
const { response } = require("../routes/user");

//Module 1 - Auth
/*
        1. Sign Up
*/
async function restSignUp(req, res) {
  const { personalData, restData } = req.body;

  // check if user with same eamil and phoneNum exists
  const userExist = await user.findOne({
    where: {
      [Op.or]: [
        { email: personalData.email },
        {
          [Op.and]: [
            { countryCode: personalData.countryCode },
            { phonenum: personalData.phoneNum },
          ],
        },
      ],
    },
  });
  if (userExist) {
    if (personalData.email === userExist.email){
      const response = ApiResponse("0","Users exists","The email you entered is already taken",{});
      return res.json(response);
    }
    else{
      const response = ApiResponse("0","Users exists","The phone number you entered is already taken",{});
      return res.json(response);
    }
     
  }

  const store = new user();
  store.firstName = req.body.personalData.firstName;
  store.lastName = req.body.personalData.lastName;
  store.hashedPassword = await bcrypt.hash(personalData.password, 10);
  store.password = await bcrypt.hash(personalData.password, 10);
  store.email = req.body.personalData.email;
  store.countryCode = req.body.personalData.countryCode;
  store.phoneNum = req.body.personalData.phoneNum;
  store.deviceToken = req.body.personalData.deviceToken;

  store.status = false;
  store.userTypeId = req.body.personalData.userTypeId;
  store.save().then((data) => {
    restData.userId = data.id;
    restData.status = false;
    restData.name = `${data.firstName} ${data.lastName}`;
    restData.email = req.body.personalData.email;
    restData.businessType = req.body.personalData.businessTypeId;
    restaurant.create(restData);
    const response = ApiResponse("1","Store created . Waiting for admin to aprrove it","",{});
    return res.json(response);
  });

  // personalData.status = false;
  // personalData.userTypeId = userTypeId ;
  // let hashedPassword = await bcrypt.hash(personalData.password,10);
  // personalData.password = hashedPassword;
  // user.create(personalData)
  // .then(data=>{
  //     restData.userId = data.id;
  //     restData.status = false;
  //     restData.name = `${data.firstName} ${data.lastName}`;
  //     restData.email = data.email;
  //     restData.businessType = userTypeId;
  //     restaurant.create(restData);
  //     return res.json({
  //         status: '1',
  //         message: 'Store created. Waiting for admin to approve it',
  //         data: {},
  //         error: ''
  //     })

  // })
}
/*
        2. Sign In
*/
async function restSignIn(req, res) {
  const { email, password, deviceToken } = req.body;
  // Finding the user

  // new user add kia
  const userExist = await user.findOne({
    where: {
      email: email,
      userTypeId: {
        [Op.in]: [5, 6],
      },
    },
    include: [{ model: restaurant }],
  });
  if (!userExist){
    const response = ApiResponse("0","No user exist","Trying to sign up",{});
    return res.json(response);
  }
  let match = await bcrypt.compare(password, userExist.password);
  if (!match){
    const response = ApiResponse("0","password mismatch","Wrong credentials",{});
    return res.json(response)
  }
  if (!userExist.status)
  {
    const response = ApiResponse("0","Waiting for approval by admin",'In case of query . Contact Admin',{});
    return res.json(response);
  }
  user.update({ deviceToken: deviceToken }, { where: { id: userExist.id } });
  const accessToken = sign(
    { id: userExist.id, email: userExist.email, deviceToken: deviceToken },
    process.env.JWT_ACCESS_SECRET
  );

  redis_Client.hSet(`${userExist.id}`, deviceToken, accessToken);
  const data = {
    id: userExist.id,
    name: `${userExist.firstName} ${userExist.lastName}`,
    accessToken,
    userExist,
  };
  const response = ApiResponse("1","Store created . Waiting for admin to aprrove it","",data);
  return res.json(response);
}

async function session(req, res) {
  const userId = req.user.id;
  const userData = await user.findOne({
    where: { id: userId },
    include: [{ model: restaurant }],
  });
  if (!userData.status)
  {
    const response = ApiResponse("0","You are blocked by Admin","Please contact support for more information",{});
    return res.json(response);
  }
   
  const acccessToken = req.header("accessToken");
  const data= {
    // userId: `${userData.id}`,
    // firstName: `${userData.firstName}`,
    // lastName: `${userData.lastName}`,
    // email: `${userData.email}`,
    id: userData.id,
    name: `${userData.firstName} ${userData.lastName}`,
    accessToken: acccessToken,
    userExist: userData,
  }
  const response = ApiResponse("1","Login Successfull","",data);
  return res.json(response);
}

//Module 2 Stores

/*
        1. Get all restaurants by a user
*/
async function getAllRest(req, res) {
  const userId = req.params.id;
  const restList = await restaurant.findAll({
    where: { userId: userId },
    attributes: ["id", "businessName", "address", "status", "logo"],
  });
  const response = ApiResponse("1","Login successfull","",restList);
  return res.json(response);
}
/*
        3. Get all prodcuts by a restaurant
*/
async function getAllProdByRest(req, res) {
  const restId = req.params.restid;
  const productsData = await R_MCLink.findAll({
    where: { restaurantId: restId },
    include: [
      {
        model: R_PLink,
        attributes: [
          "id",
          "name",
          "description",
          "image",
          "status",
          "discountPrice",
        ],
      },
      { model: menuCategory, attributes: ["id", "name"] },
    ],
  });
  const restaurantData = await restaurant.findByPk(restId, {
    include: { model: unit, as: "currencyUnitID", attributes: ["symbol"] },
    attributes: ["id"],
  });
  let data={ productsData, unit: restaurantData.currencyUnitID.symbol };
  const response = ApiResponse("1","All Products by restaurant","",data);
  return res.json(response);
}

async function getAllCuisineByRest(req, res) {
  const restId = req.params.restid;
  const cuisinesData = await R_CLink.findAll({
    where: { restaurantId: restId },
    include: [{ model: cuisine, attributes: ["id", "name"] }],
  });
  const response = ApiResponse("1","All cuisines by restaurant","",{cuisinesData});
  return res.json(response);
}
/*
        3. Get all orders by a restaurant
*/
async function getAllOrdersByRest(req, res) {
  const restId = req.params.restid;
  const orderData = await order.findAll({
    where: { restaurantId: restId },
    include: [
      { model: paymentMethod, attributes: ["name"] },
      { model: orderStatus, attributes: ["name"] },
      { model: deliveryType, attributes: ["name"] },
    ],
    attributes: ["id", "orderNum", "scheduleDate", "total"],
  });
  const restaurantData = await restaurant.findByPk(restId, {
    include: { model: unit, as: "currencyUnitID", attributes: ["symbol"] },
    attributes: ["id"],
  });
  const data = {
    orderData, unit: restaurantData.currencyUnitID.symbol
  };
  const response = ApiResponse("1","All Orders by a restaurant","",data);
  return res.json(response);
}
/*
        3. Get ratings of a restaurant
*/
async function getRatingByRest(req, res) {
  const restId = req.params.restid;
  let feedbackData = await restaurantRating.findAll({
    where: { restaurantId: restId },
    include: [
      { model: user, attributes: ["firstName", "lastName"] },
      { model: order, attributes: ["orderNum"] },
    ],
  });
  //return res.json(feedbackData);
  let feedbackArr = [];
  let restAvgRate = 0;
  feedbackData.map((fb, idx) => {
    restAvgRate = restAvgRate + fb.value;
    if (fb.comment !== "") {
      let outObj = {
        text: fb.comment,
        userName: `${fb.user.firstName} ${fb.user.lastName}`,
        at: fb.at,
        orderNum: fb.order.orderNum,
      };
      feedbackArr.push(outObj);
    }
  });

  let avgRate =
    restAvgRate === 0 ? "No rating yet" : restAvgRate / feedbackData.length;
  avgRate = avgRate !== "No rating yet" ? avgRate.toFixed(2) : avgRate;
  let data = {
    avgRate: avgRate,
      feedBacks: feedbackArr,
  }
  const response = ApiResponse("1","Ratins","",data);
  return res.json(response);
}

// Module 3 - Order management
/*
        1.  Get new orders of all restaurants of a user
*/
async function getNewOrders(req, res) {
  let userId = req.params.userid;
  let status = req.params.status;
  if (status === "1") {
    status = [14];
  }
  const allRestaurants = await restaurant.findAll({
    where: { userId: userId },
    attributes: ["id"],
  });
  let restArr = allRestaurants.map((ele) => {
    return ele.id;
  });
  let allNewOrders = await order.findAll({
    where: {
      [Op.and]: [
        { restaurantId: { [Op.or]: restArr } },
        { orderApplicationId: 1 },
        { orderStatusId: status },
      ],
    },
    include: [
      {
        model: restaurant,
        include: { model: unit, as: "currencyUnitID", attributes: ["symbol"] },
        attributes: ["businessName"],
      },
      { model: deliveryType, attributes: ["name"] },
    ],
    attributes: ["id", "orderNum", "scheduleDate", "total"],
  });
  const response = ApiResponse("1","All new orders","",allNewOrders);
  return res.json(response);
}
/*
        2. Get statuses
*/
async function getStatus(req, res) {
  let status = ["Accepted", "Preparing", "Ready for delivery"];
  const allStatusesRaw = await orderStatus.findAll({
    where: { name: { [Op.or]: status } },
    attributes: ["id", "name"],
  });
  const response = ApiResponse("1","All New Orders","",allStatusesRaw);
  return res.json(response);
}
async function resturantcharge(req, res) {
  const userId = req.params.id;
  restaurant.findOne({ where: { userId } }).then((restData) => {
    const response = ApiResponse("1","Restaurant Data","",restData);
    return res.json(response);
  });
}
async function updateresturantcharge(req, res) {
  const userId = req.params.id;
  const deliveryCharge = req.body.deliveryCharge;
  restaurant.findOne({ where: { userId } }).then((restData) => {
    restData.update({ deliveryCharge }, { where: { userId } }).then((Data) => {
        const response = ApiResponse("Restaurant Data updated","",Data);
        return res.json(response);
    });
  });
}
/*
        3. Change Order status
*/
async function changerOrderStatus(req, res) {
  const { orderStatus, orderId, userId } = req.body;
  // new query
  const dd = await order.findOne({ where: { id: orderId } });
  dd.orderStatusId = orderStatus;
  dd.paymentRecieved = true;
  const result = await dd.save();

  // *******************************************
  // old query
  // const orderUpdated = await order.update([{ orderStatusId: orderStatus },{paymentRecieved:true}], { where: { id: orderId } });
  // console.log(orderUpdated);
  // return res.json(orderUpdated)
  if (result) {
    if (orderStatus === "12")
      orderHistory.create({
        time: new Date(),
        orderId,
        orderStatusId: orderStatus,
        cancelledBy: userId,
      });
    else
      orderHistory.create({
        time: new Date(),
        orderId,
        orderStatusId: orderStatus,
      });
    let orderData = await order.findByPk(orderId, {
      include: [
        { model: user, as: "customerId", attributes: ["deviceToken"] },
        { model: user, as: "DriverId", attributes: ["deviceToken"] },
        { model: orderCharge },
        { model: restaurant, attributes: ["id"] },
      ],
    });

    // Restaurant accepts order
    //     1. Create an entry in wallet with all the earnings
    //     2. Send notification to customer
    //     3. Capture payment if is is by card
    //     4. Create entry that card payment is captured
    if (orderStatus === "2") {
      // When order is accepted --> Create entry in wallet Table with all the earnings
      /*
            orderRideSharing, deliveryType, orderId, adminEarning, driverEarning, 
                userCharge, restaurantEarning, driverId, userId, restId 
            */
      orderPlaceTransaction(
        false,
        orderData.deliveryTypeId,
        orderId,
        orderData.orderCharge.adminEarnings,
        orderData.orderCharge.driverEarnings,
        orderData.total,
        orderData.orderCharge.restaurantEarnings,
        orderData.driverId,
        orderData.userId,
        orderData.restaurantId,
        orderData.currencyUnitId
      );

      if (orderData.deliveryTypeId === 1) {
        let to = [`${orderData.DriverId.deviceToken}`];
        let notification = {
          title: "Order accepted by restaurant",
          body: "Your order will be prepared soon",
        };
        sendNotification(to, notification);
        to = [`${orderData.customerId.deviceToken}`];
        notification = {
          title: "Order accepted by restaurant",
          body: "Your order will be prepared soon",
        };
        let data = {
          deliveryTime: "20-30",
        };
        sendNotification(to, notification, data);
      } else {
        let to = [`${orderData.customerId.deviceToken}`];
        let notification = {
          title: "Order accepted by restaurant",
          body: "Your order will be prepared soon",
        };
        let data = {
          deliveryTime: "20-30",
        };
        sendNotification(to, notification, data);
      }
      // Initiate payment if payment method is online; create an entry with admin recieved and user paid.
      /*
            paymentByCard, adminReceived, UserPaid, 
                driverPaid, restReceived, driverReceived, food, orderId, userId, driverId, restId, deliveryMode
            */
      // if (orderData.paymentMethodId === 1) {
      paymentTransaction(
        true,
        orderData.total,
        orderData.total,
        0,
        0,
        0,
        false,
        orderId,
        orderData.userId,
        0,
        0,
        "",
        orderData.currencyUnitId
      );
      // }
    }
    //Send notification to customer when food is being prepared
    if (orderStatus === "3") {
      let to = [`${orderData.customerId.deviceToken}`];
      let notification = {
        title: "Order is preparing",
        body: "Your food is being prepared",
      };
      sendNotification(to, notification);

      if (orderData.deliveryTypeId === 1) {
        let to = [`${orderData.DriverId.deviceToken}`];
        let notification = {
          title: "Order is preparing",
          body: "Food is being prepared",
        };
        sendNotification(to, notification);
        to = [`${orderData.customerId.deviceToken}`];
        notification = {
          title: "Order is preparing",
          body: "Your food is being prepared",
        };
        sendNotification(to, notification);
      } else {
        let to = [`${orderData.customerId.deviceToken}`];
        let notification = {
          title: "Order is preparing",
          body: "Your food is being prepared",
        };
        sendNotification(to, notification);
      }
    }
    //Send notification to driver when food is prepared
    if (orderStatus === "4") {
      //in Case of delivery send notification to driver
      if (orderData.deliveryTypeId === 1) {
        let to = [`${orderData.DriverId.deviceToken}`];
        let notification = {
          title: "Order prepared",
          body: "Pick up your food",
        };
        sendNotification(to, notification);
      } else {
        let to = [`${orderData.customerId.deviceToken}`];
        let notification = {
          title: "Order prepared",
          body: "Pick up your food",
        };
        sendNotification(to, notification);
      }
    }
    // Commit transaction that user paid and resturant received in case of self pickup from restaurant
    // & payment mode is COD
    /*
    
            paymentByCard, adminReceived, UserPaid, 
                driverPaid, restReceived, driverReceived, food, orderId, userId, driverId, restId, deliveryMode
        */
    // if (orderStatus === '7' && orderData.paymentMethodId === 2) {
    //     paymentTransaction(false, 0, orderData.orderCharge.total,
    //         0, orderData.orderCharge.total, 0, false, orderId, orderData.userId, 0, orderData.restaurant.id, ''
    //     )
    // }
    // send notification to both in case of cancel
    if (orderStatus === "12") {
      let to = [
        `${orderData.DriverId.deviceToken}`,
        `${orderData.customerId.deviceToken}`,
      ];
      let notification = {
        title: "Order cancelled",
        body: "Restaurant is unable to process your order. Please try later",
      };
      sendNotification(to, notification);
    }
    const response = ApiResponse("1","Order Status changed","",orderData);
    return res.json(response);
  } else {
    const response = ApiResponse("0","Something went wrong","Error",{});
    return res.json(response);
  }
  // 12 is for cancelled
}

//Module 4 - Products
/*
        1. Assign Menu Category to Restaurant
*/
async function assignMCToRest(req, res) {
  const { restId, mcId } = req.body;
  const exist = await R_MCLink.findOne({
    where: { menuCategoryId: mcId, restaurantId: restId },
  });
  if (exist)
    throw new CustomException(
      "This menu category for the following restaurant already exists",
      "Please try again"
    );
  R_MCLink.create({ menuCategoryId: mcId, restaurantId: restId })
    .then((data) => {
        const response = ApiResponse("1","Menu Category Added to restaurant","",{});
        return res.json(response);
    })
    .catch((err) => {
        const response = ApiResponse("1","Failed to Menu Category to restaurant","",{});
        return res.json(response);
    });
}

async function assignCuisineToRest(req, res) {
  const { restId, cuisineId } = req.body;
  const exist = await R_CLink.findOne({
    where: { cuisineId: cuisineId, restaurantId: restId },
  });
  if (exist)
  {
    const response = ApiResponse("0","This cuisine for the following restaurant already exists","Please try again",{});
    return res.json(response);
  }

  R_CLink.create({ cuisineId: cuisineId, restaurantId: restId })
    .then((data) => {
        const response = ApiResponse('1','Cuisine Added to restaurant','',{});
        return res.json(response);
    })
    .catch((err) => {
        const response = ApiResponse('1','Failed to cuisine to restaurant','',{});
        return res.json(response);
    });
}

//Module 4 - Earnings
/*
        1. Restaurant Earning by ID
*/
async function restaunarntEarning(req, res) {
  const restId = req.params.id;
  const earningData = await order.findAll({
    where: { restaurantId: restId, orderStatusId: 7 },
    include: [
      { model: orderCharge, attributes: ["restaurantEarnings"] },
      { model: wallet },
    ],
    attributes: ["id", "total"],
  });
  const walletData = await wallet.findAll({
    where: { restaurantId: restId },
    attributes: ["amount"],
  });
  const restaurantData = await restaurant.findByPk(restId, {
    include: { model: unit, as: "currencyUnitID", attributes: ["symbol"] },
    attributes: ["id"],
  });
  //return res.json(walletData);
  let totalSales = earningData.reduce(
    (pVal, cVal) => pVal + parseFloat(cVal.total),
    0
  );
  let totalSalesAfterCommission = earningData.reduce(
    (pVal, cVal) => pVal + parseFloat(cVal.orderCharge.restaurantEarnings),
    0
  );
  // The negative balance indicates --> has to receive , +ve indicates has to pay
  let balance = walletData.reduce((pVal, cVal) => pVal + cVal.amount, 0);
    let  data = {
        totalSales: totalSales.toFixed(2),
        totalSalesAfterCommission: totalSalesAfterCommission.toFixed(2),
        // reversing the symbol as +ve shows --> has to received & vice versa
        balance: -1 * balance.toFixed(2),
        unit: restaurantData.currencyUnitID.symbol,
      };
    const response = ApiResponse("1","Earnings Data","",data);
    return res.json(response);
}

/*
        2. Request for payout
*/
async function requestPayout(req, res) {
  const { amount, message, restId } = req.body;
  const restaurantData = await restaurant.findByPk(restId, {
    include: {
      model: unit,
      as: "currencyUnitID",
      attributes: ["id", "symbol"],
    },
    attributes: ["currencyUnitId"],
  });
  // TODO Change the minimum payout to dynamic value
  if (amount < 150)
  {
    const response = ApiResponse("0","Request cannot be processed",`Minimum payout amount is ${restaurantData.currencyUnitID.symbol}150`,{});
    return res.json(response);
  }

  let transactionId = uuid.v1();
  payout
    .create({
      amount,
      status: "pending",
      transactionId,
      message: message ? message : null,
      restaurantId: restId,
      unitId: restaurantData.currencyUnitId,
    })
    .then((data) => {
        const response = ApiResponse("1","Payout request generated","",{});
        return res.json(response);
    });
}
/*
        3. get all payout requests
*/
async function getAllPayoutsByRestId(req, res) {
  const restId = req.params.id;
  const allPayouts = await payout.findAll({
    where: { restaurantId: restId },
    include: { model: unit, attributes: ["symbol"] },
    attributes: [
      "id",
      "amount",
      "status",
      "transactionId",
      "message",
      "createdAt",
    ],
  });
  const response = ApiResponse("1","Payout request generated","",allPayouts);
  return res.json(response);
}

//Module 5 - DashBoard
/*
    1. Dash Board stats & bar graph
*/
async function dashBoardStats(req, res) {
  const userId = req.params.id;
  const allData = await restaurant.findAll({
    where: { userId },
    include: [
      { model: order, attributes: ["id", "status", "total", "orderStatusId"] },
      { model: unit, as: "currencyUnitID", attributes: ["symbol"] },
    ],
    attributes: ["id"],
  });
  let allEarnings = 0,
    completedOrders = 0,
    allOrders = 0,
    onGoingOrders = 0,
    cancelledOrders = 0;
  allData.map((ele) => {
    //All Earnings
    let tempOrders = ele.orders.filter((order) => order.orderStatusId !== 12);
    let restEarnings = tempOrders.reduce(
      (pVal, cVal) => pVal + parseFloat(cVal.total),
      0
    );
    allEarnings = allEarnings + restEarnings;
    //
    let restCompletedOrders = ele.orders.filter(
      (order) => order.orderStatusId === 7
    );
    completedOrders = completedOrders + restCompletedOrders.length;

    allOrders = allOrders + ele.orders.length;

    let restonGoingOrders = ele.orders.filter(
      (order) => order.orderStatusId !== 7 && order.orderStatusId !== 12
    );
    //console.log(restonGoingOrders)
    onGoingOrders = onGoingOrders + restonGoingOrders.length;

    let restcancelledOrders = ele.orders.filter(
      (order) => order.orderStatusId === 12
    );
    cancelledOrders = cancelledOrders + restcancelledOrders.length;
  });

  const data = {
    allEarnings: allEarnings.toFixed(2),
    completedOrders,
    allOrders,
    onGoingOrders,
    cancelledOrders,
    stores: allData.length,
    unit: allData[0].currencyUnitID
      ? allData[0].currencyUnitID.symbol
      : "N/A",
  }
  const response = ApiResponse("1","Dashboard Status","",data);
  return res.json(response);
}
async function tablebookings(req, res) {
  const userId = req.params.id;
  restaurant.findOne({ where: { userId } }).then((restdata) => {
    const restaurantId = restdata.id;
    tableBooking.findAll({ where: { restaurantId } }).then((data) => {
      const response = ApiResponse("1","Table Booking for the Restaurant","",data);
      return res.json(response);
  
    });
  });
}
async function accepttablebooking(req, res) {
  const id = req.params.id;
  tableBooking
    .update(
      { status: true },
      {
        where: { id },
      }
    )
    .then((data) => {
      const response = ApiResponse("1","Table Booing for the Restaurant","",data);
      return res.json(response);
    });
}
async function rejecttablebooking(req, res) {
  const id = req.params.id;
  tableBooking
    .update(
      { status: false },
      {
        where: { id },
      }
    )
    .then((data) => {
      const response = ApiResponse("1","Table Booking for the Restaurant","",data);
      return res.json(response);
    });
}
/*
    2. Dash Board previous year earnings
*/
async function dashBoardYearlyEarn(req, res) {
  const userId = req.params.id;
  let monthArr = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const allData = await restaurant.findAll({
    where: { userId },
    include: [
      {
        model: order,
        where: { orderStatusId: 7 },
        attributes: ["id", "scheduleDate", "total", "orderStatusId"],
      },
      { model: unit, as: "currencyUnitID", attributes: ["symbol"] },
    ],
    attributes: ["id"],
  });
  let months = [],
    earnWithMonths = [],
    outMonths = [];
  let cDate = new Date();
  // Running a loop to get eranings for past 11 months
  for (let i = 0; i <= 11; i++) {
    let oneMonthStart = new Date(cDate.getFullYear(), cDate.getMonth() - i, 0);
    let oneMonthEnd = new Date(cDate.getFullYear(), cDate.getMonth() - i, 0);
    oneMonthStart.setDate(1);
    oneMonthStart.setHours(0, 0, 1);
    oneMonthEnd.setHours(23, 59, 0);
    let mStart = oneMonthStart.toString();
    let mEnd = oneMonthEnd.toString();
    let totalEarnings = 0;
    allData.map((ele) => {
      let oneMonthData = ele.orders.filter(
        (b) =>
          Date.parse(oneMonthStart) < Date.parse(b.scheduleDate) &&
          Date.parse(b.scheduleDate) < Date.parse(oneMonthEnd)
      );
      let restWiseEarnings = oneMonthData.reduce(
        (pVal, cVal) => pVal + parseFloat(cVal.total),
        0
      );
      //console.log('rest wiese' , restWiseEarnings);
      totalEarnings = totalEarnings + restWiseEarnings;
    });
    //console.log(oneMonthStart.getMonth())
    let tmpObj = totalEarnings.toFixed(2);
    earnWithMonths.push(tmpObj);
    outMonths.push(
      `${monthArr[oneMonthStart.getMonth()]} ${oneMonthStart.getFullYear()}`
    );
    //console.log('Month Start', mStart, 'Month End',mEnd )
  }
  // get earnings of current month
  let date = new Date(cDate);
  let currentDate = date.getDate();
  let startOfCurrentMonth = new Date(
    cDate.getTime() - (currentDate - 1) * 24 * 60 * 60 * 1000
  );
  //console.log(startOfCurrentMonth.toString())
  let currtotalEarnings = 0;
  allData.map((ele) => {
    let oneMonthData = ele.orders.filter(
      (b) =>
        Date.parse(startOfCurrentMonth) < Date.parse(b.scheduleDate) &&
        Date.parse(b.scheduleDate) < Date.parse(date)
    );
    let restWiseEarnings = oneMonthData.reduce(
      (pVal, cVal) => pVal + parseFloat(cVal.total),
      0
    );
    currtotalEarnings = currtotalEarnings + restWiseEarnings;
  });
  let tmpObj = currtotalEarnings.toFixed(2);
  earnWithMonths.unshift(tmpObj);
  outMonths.unshift(`${monthArr[date.getMonth()]} ${date.getFullYear()}`);
  const data = { earnWithMonths, outMonths, unit: allData };
  const response = ApiResponse("1","Earning of previous years","",data);
  return res.json(response);
}

module.exports = {
  restSignUp,
  restSignIn,
  getAllRest,
  getAllProdByRest,
  getAllOrdersByRest,
  getRatingByRest,
  getNewOrders,
  getStatus,
  changerOrderStatus,
  assignMCToRest,
  restaunarntEarning,
  requestPayout,
  getAllPayoutsByRestId,
  dashBoardStats,
  dashBoardYearlyEarn,
  tablebookings,
  accepttablebooking,
  rejecttablebooking,
  resturantcharge,
  updateresturantcharge,
  assignCuisineToRest,
  getAllCuisineByRest,
  session,
};
