require("dotenv").config();
//importing Models
const {
  user,
  productStock,
  userType,
  role,
  collection,
  collectionAddons,
  productCollections,
  addressType,
  menuCategory,
  zoneRestaurants,
  defaultValues,
  zone,
  zoneDetails,
  country,
  city,
  cuisine,
  time,
  paymentMethod,
  deliveryType,
  tableBooking,
  restaurantDriver,
  driverZone,
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
  orderType,
  RP_Link,
  orderStatus,
  driverDetails,
  serviceType,
  vehicleDetails,
  restaurantEarning,
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
} = require("../models");
const { sendEvent } = require("../socket");
// Importing Custom exception
const CustomException = require("../middlewares/errorObject");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const sequelize = require("sequelize");
const redis_Client = require("../routes/redis_connect");
const { sign } = require("jsonwebtoken");
const sendNotification = require("../helper/notifications");
const orderPlaceTransaction = require("../helper/orderPlaceTransaction");
const paymentTransaction = require("../helper/paymentTransaction");
const eta_text = require("../helper/eta_text");
const axios = require("axios");
const uuid = require("uuid");
const ApiResponse = require("../helper/ApiResponse");
const { response } = require("../routes/user");
const notifications = require("../helper/notifications");
const singleNotification = require("../helper/singleNotification");
const fs = require("fs").promises;
//Module 1 - Auth
/*
        1. Sign Up
*/
async function restSignUp(req, res) {
  try {
    const {
      firstName,
      lastName,
      deliveryTime,
      email,
      CountryCode,
      phoneNum,
      password,
      confirmPassword,
      logo,
      coverImage,
      businessType,
      businessName,
      businessEmail,
      code,
      businessPhone,
      description,
      address,
      city,
      zipCode,
      deviceToken,
      lat,
      lng,
      zoneId,
    } = req.body;
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "CountryCode",
      "phoneNum",
      "password",
      "confirmPassword",
      "businessType",
      "businessName",
      "businessEmail",
      "businessPhone",
      "address",
      "city",
      "zipCode",
      "deviceToken",
      "lat",
      "lng",
      "zoneId",
    ];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        const response = ApiResponse(
          "0",
          `${field} is required`,
          `Please provide a value for ${field}`,
          {}
        );
        return res.json(response);
      }
    }
    const userExist = await user.findOne({
      where: {
        [Op.or]: [
          {
            email: email,
          },
          {
            [Op.and]: [
              {
                countryCode: CountryCode,
              },
              {
                phoneNum: phoneNum,
              },
            ],
          },
        ],
      },
    });
    if (userExist) {
      if (email === userExist.email) {
        const response = ApiResponse(
          "0",
          "Users exists",
          "The email you entered is already taken",
          {}
        );
        return res.json(response);
      } else {
        const response = ApiResponse(
          "0",
          "Users exists",
          "The phone number you entered is already taken",
          {}
        );
        return res.json(response);
      }
    }
    const type = await userType.findOne({
      where: {
        name: "Retailer",
      },
    });
    const businessTypeId = await orderApplication.findOne({
      where: {
        name: businessType,
      },
    });
    const newUser = new user();
    newUser.firstName = firstName;
    newUser.lastName = lastName;
    newUser.password = await bcrypt.hash(password, 10);
    newUser.email = email;
    newUser.countryCode = CountryCode;
    newUser.phoneNum = phoneNum;
    newUser.deviceToken = deviceToken;
    newUser.status = true;
    newUser.userTypeId = type.id;
    newUser
      .save()
      .then(async (data) => {
        let logoPathTemp = req.files.logo[0].path;
        let logoPath = logoPathTemp.replace(/\\/g, "/");
        let imagePathTemp = req.files.coverImage[0].path;
        let imagePath = imagePathTemp.replace(/\\/g, "/");

        const defaultDistanceUnitId = await defaultValues.findOne({
          where: {
            name: "distanceUnitId",
          },
        });
        const paymentMethodId = await defaultValues.findOne({
          where: {
            name: "paymentMethodId",
          },
        });
        //   return res.json()
        const currencyUnitId = await defaultValues.findOne({
          where: {
            name: "currencyUnitId",
          },
        });
        const comission = await defaultValues.findOne({
          where: {
            name: "comission",
          },
        });
        const deliveryCharge = await defaultValues.findOne({
          where: {
            name: "deliveryCharge",
          },
        });
        const deliveryTypeId = await defaultValues.findOne({
          where: {
            name: "deliveryTypeId",
          },
        });
        const deliveryRadius = await defaultValues.findOne({
          where: {
            name: "deliveryRadius",
          },
        });
        const serviceCharge = await defaultValues.findOne({
          where: {
            name: "serviceCharge",
          },
        });
        const deliveryFeeTypeId = await defaultValues.findOne({
          where: {
            name: "deliveryFeeTypeId",
          },
        });
        const packingFee = await defaultValues.findOne({
          where: {
            name: "packingFee",
          },
        });
        const deliveryFeeFixed = await defaultValues.findOne({
          where: {
            name: "deliveryFeeFixed",
          },
        });
        const approxDeliveryTime = await defaultValues.findOne({
          where: {
            name: "approxDeliveryTime",
          },
        });
        const VATpercent = await defaultValues.findOne({
          where: {
            name: "VATpercent",
          },
        });
        const serviceChargesType = await defaultValues.findOne({
          where: {
            name: "serviceChargesType",
          },
        });

        const newRest = new restaurant();
        (newRest.businessName = businessName),
          (newRest.businessEmail = businessEmail),
          (newRest.countryCode = code),
          (newRest.name = `${firstName} ${lastName}`);
        newRest.email = email;
        (newRest.phoneNum = businessPhone),
          (newRest.description = description),
          (newRest.city = city),
          (newRest.zipCode = zipCode),
          (newRest.lat = lat),
          (newRest.approxDeliveryTime = deliveryTime),
          (newRest.deliveryFeeFixed = deliveryFeeFixed.value),
          (newRest.minOrderAmount = 10),
          (newRest.packingFee = packingFee.value),
          (newRest.deliveryFeeTypeId = deliveryFeeTypeId.value),
          (newRest.deliveryTypeId = deliveryTypeId.value),
          (newRest.deliveryCharge = deliveryCharge.value),
          (newRest.serviceCharges = serviceCharge.value),
          (newRest.serviceChargesType = serviceChargesType.value),
          (newRest.deliveryRadius = deliveryRadius.value),
          (newRest.unitId = 1),
          (newRest.isPureVeg = 0),
          (newRest.businessType = businessTypeId.id),
          (newRest.comission = comission.value),
          (newRest.isFeatured = 1),
          (newRest.VATpercent = VATpercent.value),
          (newRest.paymentMethodId = paymentMethodId.value),
          (newRest.address = address),
          (newRest.lng = lng),
          (newRest.userId = data.id);
        newRest.distanceUnitId = defaultDistanceUnitId.value;
        newRest.currencyUnitId = currencyUnitId.value;
        newRest.status = true;
        newRest.logo = logoPath;
        newRest.image = imagePath;
        newRest
          .save()
          .then(async (dat) => {
            const restEarning = new restaurantEarning();
            restEarning.totalEarning = 0;
            restEarning.availableBalance = 0;
            restEarning.restaurantId = dat.id;
            await restEarning.save();

            const check = await zoneRestaurants.findOne({
              where: [
                {
                  zoneId: zoneId,
                },
                {
                  restaurantId: dat.id,
                },
              ],
            });
            if (check) {
              check.status = true;
              await check.save();
            } else {
              const zoneRest = new zoneRestaurants();
              zoneRest.restaurantId = dat.id;
              zoneRest.zoneId = zoneId;
              zoneRest.status = true;
              await zoneRest.save();
            }

            const timeData = [
              {
                name: "sunday",
                startAt: "12:00 AM",
                endAt: "5:00 PM",
                day: "0",
              },
              {
                name: "friday",
                startAt: "4:00 AM",
                endAt: "5:00 PM",
                day: "5",
              },
              {
                name: "wednesday",
                startAt: "4:00 AM",
                endAt: "5:00 PM",
                day: "3",
              },
              {
                name: "monday",
                startAt: "12:00 AM",
                endAt: "5:00 PM",
                day: "1",
              },
              {
                name: "tuesday",
                startAt: "4:00 AM",
                endAt: "5:00 PM",
                day: "2",
              },
              {
                name: "thursday",
                startAt: "4:00 AM",
                endAt: "5:00 PM",
                day: "4",
              },
              {
                name: "saturday",
                startAt: "4:00 AM",
                endAt: "5:00 PM",
                day: "6",
              },
            ];
            timeData.map(async (data) => {
              const newTime = new time();
              newTime.name = data.name;
              newTime.startAt = data.startAt;
              newTime.endAt = data.endAt;
              newTime.restaurantId = newRest.id;
              newTime.status = true;
              newTime.day = data.day;
              await newTime.save();
            });
            const userData = {
              id: data.id,
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phoneNum: data.phoneNum,
              accessToken: "",
            };
            const response = ApiResponse(
              "1",
              "Signup successfully!",
              "",
              userData
            );
            return res.json(response);
          })
          .catch((error) => {
            const response = ApiResponse("0", error.message, "Error", {});
            return res.json(response);
          });
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
      });
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

let loginData = (userData, accessToken) => {
  return {
    status: "1",
    message: "Login successful",
    data: {
      userId: `${userData.id}`,
      userName: `${userData.userName}`,
      firstName: `${userData.firstName}`,
      lastName: `${userData.lastName}`,
      email: `${userData.email}`,
      accessToken: `${accessToken}`,
    },
    error: "",
  };
};
/*
        2. Sign In
*/
async function restSignIn(req, res) {
  const { email, password, deviceToken } = req.body;
  const requiredFields = ["email", "password", "deviceToken"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      const response = ApiResponse(
        "0",
        `${field.toUpperCase()} is required`,
        `Please provide a value for ${field.toUpperCase()}`,
        {}
      );
      return res.json(response);
    }
  }
  const retailerType = await userType.findOne({
    where: {
      name: "Retailer",
    },
  });
  const storeType = await userType.findOne({
    where: {
      name: "Store owner",
    },
  });

  // new user add kia
  const userExist = await user.findOne({
    where: {
      email: email,
      [Op.or]: [
        {
          userTypeId: retailerType.id,
        },
        {
          userTypeId: storeType.id,
        },
      ],
    },
    include: [
      {
        model: restaurant,
      },
    ],
  });
  if (!userExist) {
    const response = ApiResponse(
      "0",
      "No user exist",
      "Trying to sign up",
      "",
      {}
    );
    return res.json(response);
  }
  if (userExist.restaurants.length == 0) {
    const response = ApiResponse(
      "2",
      "Sorry No Restaurant registered against this email address",
      "",
      {}
    );
    return res.json(response);
  }

  let match = await bcrypt.compare(password, userExist.password);
  if (!match) {
    const response = ApiResponse(
      "0",
      "password mismatch",
      "Wrong credentials",
      {}
    );
    return res.json(response);
  }
  if (!userExist.status) {
    const response = ApiResponse(
      "0",
      "Waiting for approval by admin",
      "In case of query . Contact Admin",
      {}
    );
    return res.json(response);
  }
  //   return res.json(userExist.restaurants)
  user.update(
    {
      deviceToken: deviceToken,
    },
    {
      where: {
        id: userExist.id,
      },
    }
  );
  const accessToken = sign(
    {
      id: userExist.id,
      email: userExist.email,
      deviceToken: deviceToken,
    },
    process.env.JWT_ACCESS_SECRET
  );
  await redis_Client.hSet(`fom${userExist.id}`, deviceToken, accessToken);

  const output = loginData(userExist, accessToken);
  const data = {
    userId: `${userExist.id}`,
    //   userName: `${userExist.userName}`,
    firstName: `${userExist.firstName}`,
    lastName: `${userExist.lastName}`,
    email: `${userExist.email}`,
    accessToken: `${accessToken}`,
    logo: userExist.restaurants[0]?.logo,
    image: userExist.restaurants[0]?.image,
    restaurantId: userExist.restaurants[0]?.id,
    businessName: userExist.restaurants[0]?.businessName,
    businessEmail: userExist.restaurants[0]?.businessEmail,
    businessType: userExist.restaurants[0]?.businessType,
    businessCountryCode: userExist.restaurants[0]?.countryCode,
    businessPhone: userExist.restaurants[0]?.phoneNum,
    city: userExist.restaurants[0]?.city,
    lat: userExist.restaurants[0]?.lat,
    lng: userExist.restaurants[0]?.lng,
    zipCode: userExist.restaurants[0]?.zipCode,
    address: userExist.restaurants[0]?.address,
    description: userExist.restaurants[0]?.description,
  };
  const response = ApiResponse("1", "Login Successfully!", "", data);
  return res.json(response);
}
/*
        2. Get distance between two locations in km
*/
function getDistance(userLat, userLng, orderLat, orderLng) {
  let earth_radius = 6371;
  let dLat = (Math.PI / 180) * (orderLat - userLat);
  let dLon = (Math.PI / 180) * (orderLng - userLng);
  let a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((Math.PI / 180) * orderLat) *
      Math.cos((Math.PI / 180) * orderLat) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  let c = 2 * Math.asin(Math.sqrt(a));
  let d = earth_radius * c;
  return d;
}
async function home(req, res) {
  const userData = await user.findOne({
    where: {
      id: req.user.id,
    },
    include: {
      model: restaurant,
      include: {
        model: zoneRestaurants,
      },
    },
  });

  const fireBase = await axios.get(process.env.FIREBASE_URL);

  const zoneDrivers = await driverZone.findAll({
    where: {
      zoneId: userData.restaurants[0]?.zoneRestaurant?.zoneId,
    },
  });
  let distanceList = [];
  let timeList = [];
  if (fireBase?.data) {
    if (zoneDrivers.length > 0) {
      await Promise.all(
        zoneDrivers.map(async (driver) => {
          let checkDriver = fireBase.data[driver.userId];
          if (checkDriver) {
            const distance = getDistance(
              userData.restaurants[0].lat,
              userData.restaurants[0].lng,
              checkDriver.lat,
              checkDriver.lng
            );
            let etaTime = await eta_text(
              userData.restaurants[0].lat,
              userData.restaurants[0].lng,
              checkDriver.lat,
              checkDriver.lng
            );
            distanceList.push(distance);
            timeList.push(etaTime);
          }
        })
      );
    }
  }
  const smallestNumber = Math.min(...distanceList);
  const index = distanceList.indexOf(smallestNumber);

  const restaurantId = userData.restaurants[0].id;

  const mode = await orderMode.findOne({
    where: {
      name: "Scheduled",
    },
  });
  const ordertype = await orderType.findOne({
    where: {
      type: "Normal",
    },
  });
  const standardMode = await orderMode.findOne({
    where: {
      name: "Standard",
    },
  });
  const incommingStatus = await orderStatus.findOne({
    where: {
      name: "Placed",
    },
  });
  const acceptStatus = await orderStatus.findOne({
    where: {
      name: "Accepted",
    },
  });
  const outgoingStatus = await orderStatus.findOne({
    where: {
      name: "Preparing",
    },
  });
  const readyStatus = await orderStatus.findOne({
    where: {
      name: "Ready for delivery",
    },
  });

  const scheduleOrders = await order.findAll({
    where: [
      {
        orderTypeId: ordertype.id,
      },
      {
        restaurantId: restaurantId,
      },
      {
        orderModeId: mode.id,
      },
      {
        orderStatusId: acceptStatus.id,
      },
    ],
    include: [
      {
        model: user,
        attributes: [
          "id",
          "userName",
          "firstName",
          "lastName",
          "email",
          "countryCode",
          "phoneNum",
        ],
      },
      {
        model: orderMode,
      },

      {
        model: orderItems,
        include: [
          {
            model: R_PLink,
          },
          {
            model: orderAddOns,

            include: {
              model: addOn,
              attributes: ["id", "name"],
            },
          },
        ],
      },
    ],
  });
  const incomming_orders = await order.findAll({
    where: [
      {
        restaurantId: restaurantId,
      },
      {
        orderStatusId: incommingStatus.id,
      },
    ],
    include: [
      {
        model: orderItems,
      },
      {
        model: orderStatus,
      },
      {
        model: orderMode,
      },
      {
        model: user,
        attributes: [
          "id",
          "userName",
          "firstName",
          "lastName",
          "email",
          "countryCode",
          "phoneNum",
        ],
      },
      {
        model: orderItems,
        include: [
          {
            model: R_PLink,
          },
          {
            model: orderAddOns,

            include: {
              model: addOn,
              attributes: ["id", "name"],
            },
          },
        ],
      },
    ],
  });

  const outgoing_orders = await order.findAll({
    order: [["updatedAt", "ASC"]],
    where: {
      //   orderTypeId : ordertype.id,
      restaurantId: restaurantId,
      orderStatusId: outgoingStatus.id,
      [sequelize.Op.or]: [
        {
          orderModeId: mode.id,
        },
        {
          orderModeId: standardMode.id,
        },
      ],
    },
    include: [
      {
        model: orderHistory,
        where: {
          orderStatusId: acceptStatus.id,
        },
        include: {
          model: orderStatus,
          attributes: ["name"],
        },
      },
      {
        model: user,
        attributes: [
          "id",
          "userName",
          "firstName",
          "lastName",
          "email",
          "countryCode",
          "phoneNum",
        ],
      },
      {
        model: orderMode,
      },
      {
        model: orderItems,
        include: [
          {
            model: R_PLink,
          },
          {
            model: orderAddOns,

            include: {
              model: addOn,
              attributes: ["id", "name"],
            },
          },
        ],
      },
    ],
  });
  const ready_orders = await order.findAll({
    //   order:[['createdAt','DESC']],
    where: [
      // {orderTypeId : ordertype.id},
      {
        restaurantId: restaurantId,
      },
      {
        orderStatusId: readyStatus.id,
      },
    ],
    include: [
      {
        model: orderMode,
      },
      {
        model: restaurant,
        attributes: ["id", "lat", "lng"],
      },
      {
        model: user,
        attributes: [
          "id",
          "userName",
          "firstName",
          "lastName",
          "email",
          "countryCode",
          "phoneNum",
        ],
      },
      {
        model: orderItems,
        include: [
          {
            model: R_PLink,
          },
          {
            model: orderAddOns,

            include: {
              model: addOn,
              attributes: ["id", "name"],
            },
          },
        ],
      },
    ],
  });
  const tableBookingsPlaced = await tableBooking.findAll({
    where: [
      {
        restaurantId: restaurantId,
      },
      {
        orderStatusId: incommingStatus.id,
      },
    ],
    include: [
      {
        model: user,
        attributes: [
          "id",
          "userName",
          "countryCode",
          "phoneNum",
          "email",
          "firstName",
          "lastName",
        ],
      },
    ],
  });
  const tableBookingsAccepted = await tableBooking.findAll({
    where: [
      {
        restaurantId: restaurantId,
      },
      {
        orderStatusId: acceptStatus.id,
      },
    ],
    include: [
      {
        model: user,
        attributes: [
          "id",
          "userName",
          "countryCode",
          "phoneNum",
          "email",
          "firstName",
          "lastName",
        ],
      },
    ],
  });

  let list = [];
  let firebaseData = await axios.get(process.env.FIREBASE_URL);
  //   return res.json(firebaseData.data[9])
  if (ready_orders.length > 0) {
    for (var i = 0; i < ready_orders.length; i++) {
      let driverLatLng = firebaseData?.data[ready_orders[i]?.driverId];
      // return res.json(ready_orders[i].restaurant.lng)
      let distance = await eta_text(
        ready_orders[i]?.restaurant?.lat,
        ready_orders[i]?.restaurant?.lng,
        driverLatLng?.lat,
        driverLatLng?.lng
      );
      let obj = {
        est_time: distance == "" ? "0 mints" : distance,
        order: ready_orders[i],
      };
      list.push(obj);
    }
  }
  const data = {
    incomming_orders,
    ready_orders: list,
    scheduleOrders: scheduleOrders,
    outgoing_orders,
    nearest_pickup_time:
      timeList.length > 0
        ? timeList[index] === ""
          ? "0"
          : timeList[index]
        : "5 minutes",

    isRushMode:
      userData.restaurants[0]?.isRushMode == null ||
      userData.restaurants[0]?.isRushMode == false
        ? false
        : true,
    isOpen:
      userData?.restaurants[0]?.isOpen == null
        ? false
        : userData?.restaurants[0]?.isOpen,

    tableBookingsPlaced,
    tableBookingsAccepted,
  };
  const response = ApiResponse("1", "Get Data", "", data);
  return res.json(response);
}
async function homeData(restId) {
  try {
    let restData = await restaurant.findOne({
      where: { id: restId },
      include: { model: user },
    });

    const userData = await user.findOne({
      where: {
        id: restData.user.id,
      },
      include: {
        model: restaurant,
        include: {
          model: zoneRestaurants,
        },
      },
    });

    const fireBase = await axios.get(process.env.FIREBASE_URL);

    const zoneDrivers = await driverZone.findAll({
      where: {
        zoneId: userData.restaurants[0]?.zoneRestaurant?.zoneId,
      },
    });
    let distanceList = [];
    let timeList = [];
    if (fireBase?.data) {
      if (zoneDrivers.length > 0) {
        await Promise.all(
          zoneDrivers.map(async (driver) => {
            let checkDriver = fireBase.data[driver.userId];
            if (checkDriver) {
              const distance = getDistance(
                userData.restaurants[0].lat,
                userData.restaurants[0].lng,
                checkDriver.lat,
                checkDriver.lng
              );
              let etaTime = await eta_text(
                userData.restaurants[0].lat,
                userData.restaurants[0].lng,
                checkDriver.lat,
                checkDriver.lng
              );
              distanceList.push(distance);
              timeList.push(etaTime);
            }
          })
        );
      }
    }
    const smallestNumber = Math.min(...distanceList);
    const index = distanceList.indexOf(smallestNumber);

    const restaurantId = restId;

    const mode = await orderMode.findOne({
      where: {
        name: "Scheduled",
      },
    });
    const ordertype = await orderType.findOne({
      where: {
        type: "Normal",
      },
    });
    const standardMode = await orderMode.findOne({
      where: {
        name: "Standard",
      },
    });
    const incommingStatus = await orderStatus.findOne({
      where: {
        name: "Placed",
      },
    });
    const acceptStatus = await orderStatus.findOne({
      where: {
        name: "Accepted",
      },
    });
    const outgoingStatus = await orderStatus.findOne({
      where: {
        name: "Preparing",
      },
    });
    const readyStatus = await orderStatus.findOne({
      where: {
        name: "Ready for delivery",
      },
    });

    const scheduleOrders = await order.findAll({
      where: [
        {
          orderTypeId: ordertype.id,
        },
        {
          restaurantId: restaurantId,
        },
        {
          orderModeId: mode.id,
        },
        {
          orderStatusId: acceptStatus.id,
        },
      ],
      include: [
        {
          model: user,
          attributes: [
            "id",
            "userName",
            "firstName",
            "lastName",
            "email",
            "countryCode",
            "phoneNum",
          ],
        },
        {
          model: orderMode,
        },

        {
          model: orderItems,
          include: [
            {
              model: R_PLink,
            },
            {
              model: orderAddOns,

              include: {
                model: addOn,
                attributes: ["id", "name"],
              },
            },
          ],
        },
      ],
    });
    const incomming_orders = await order.findAll({
      order: [["updatedAt", "DESC"]],
      where: [
        {
          restaurantId: restaurantId,
        },
        {
          orderStatusId: incommingStatus.id,
        },
      ],
      include: [
        {
          model: orderItems,
        },
        {
          model: orderStatus,
        },
        {
          model: orderMode,
        },
        {
          model: user,
          attributes: [
            "id",
            "userName",
            "firstName",
            "lastName",
            "email",
            "countryCode",
            "phoneNum",
          ],
        },
        {
          model: orderItems,
          include: [
            {
              model: R_PLink,
            },
            {
              model: orderAddOns,

              include: {
                model: addOn,
                attributes: ["id", "name"],
              },
            },
          ],
        },
      ],
    });

    const outgoing_orders = await order.findAll({
      order: [["updatedAt", "ASC"]],
      where: {
        //   orderTypeId : ordertype.id,
        restaurantId: restaurantId,
        orderStatusId: outgoingStatus.id,
        [sequelize.Op.or]: [
          {
            orderModeId: mode.id,
          },
          {
            orderModeId: standardMode.id,
          },
        ],
      },
      include: [
        {
          model: orderHistory,
          where: {
            orderStatusId: acceptStatus.id,
          },
          include: {
            model: orderStatus,
            attributes: ["name"],
          },
        },
        {
          model: user,
          attributes: [
            "id",
            "userName",
            "firstName",
            "lastName",
            "email",
            "countryCode",
            "phoneNum",
          ],
        },
        {
          model: orderMode,
        },
        {
          model: orderItems,
          include: [
            {
              model: R_PLink,
            },
            {
              model: orderAddOns,

              include: {
                model: addOn,
                attributes: ["id", "name"],
              },
            },
          ],
        },
      ],
    });
    const ready_orders = await order.findAll({
      //   order:[['createdAt','DESC']],
      where: [
        // {orderTypeId : ordertype.id},
        {
          restaurantId: restaurantId,
        },
        {
          orderStatusId: readyStatus.id,
        },
      ],
      include: [
        {
          model: orderMode,
        },
        {
          model: restaurant,
          attributes: ["id", "lat", "lng"],
        },
        {
          model: user,
          attributes: [
            "id",
            "userName",
            "firstName",
            "lastName",
            "email",
            "countryCode",
            "phoneNum",
          ],
        },
        {
          model: orderItems,
          include: [
            {
              model: R_PLink,
            },
            {
              model: orderAddOns,

              include: {
                model: addOn,
                attributes: ["id", "name"],
              },
            },
          ],
        },
      ],
    });
    const tableBookingsPlaced = await tableBooking.findAll({
      where: [
        {
          restaurantId: restaurantId,
        },
        {
          orderStatusId: incommingStatus.id,
        },
      ],
      include: [
        {
          model: user,
          attributes: [
            "id",
            "userName",
            "countryCode",
            "phoneNum",
            "email",
            "firstName",
            "lastName",
          ],
        },
      ],
    });
    const tableBookingsAccepted = await tableBooking.findAll({
      where: [
        {
          restaurantId: restaurantId,
        },
        {
          orderStatusId: acceptStatus.id,
        },
      ],
      include: [
        {
          model: user,
          attributes: [
            "id",
            "userName",
            "countryCode",
            "phoneNum",
            "email",
            "firstName",
            "lastName",
          ],
        },
      ],
    });

    let list = [];
    let firebaseData = await axios.get(process.env.FIREBASE_URL);
    //   return res.json(firebaseData.data[9])
    if (ready_orders.length > 0) {
      for (var i = 0; i < ready_orders.length; i++) {
        let driverLatLng = firebaseData?.data[ready_orders[i]?.driverId];
        // return res.json(ready_orders[i].restaurant.lng)
        let distance = await eta_text(
          ready_orders[i]?.restaurant?.lat,
          ready_orders[i]?.restaurant?.lng,
          driverLatLng?.lat,
          driverLatLng?.lng
        );
        let obj = {
          est_time: distance == "" ? "0 mints" : distance,
          order: ready_orders[i],
        };
        list.push(obj);
      }
    }
    const data = {
      incomming_orders,
      ready_orders: list,
      scheduleOrders: scheduleOrders,
      outgoing_orders,
      nearest_pickup_time:
        timeList.length > 0
          ? timeList[index] === ""
            ? "0"
            : timeList[index]
          : "5 minutes",

      isRushMode:
        userData.restaurants[0]?.isRushMode == null ||
        userData.restaurants[0]?.isRushMode == false
          ? false
          : true,
      isOpen:
        userData?.restaurants[0]?.isOpen == null
          ? false
          : userData?.restaurants[0]?.isOpen,

      tableBookingsPlaced,
      tableBookingsAccepted,
    };
    return data;
    //   const response = ApiResponse("1", "Get Data", "", data);
    //   return res.json(response);
  } catch (error) {
    return {};
  }
}

async function scheduleOrder_to_Outgoing(req, res) {
  const { orderId } = req.body;
  if (!orderId) {
    const response = ApiResponse(
      "0",
      `Order ID is required`,
      `Please provide a value for Order ID`,
      {}
    );
    return res.json(response);
  }
  // const ordertype = await orderType.findOne({where:{type:"Normal"}});
  const orderData = await order.findOne({
    where: {
      id: orderId,
    },
  });
  if (orderData) {
    const mode = await orderMode.findOne({
      where: {
        name: "Scheduled",
      },
    });
    //   if(orderData.orderModeId == mode.id){
    //     const apiDate = orderData.scheduleDate;
    //     const apiDateTime = new Date(apiDate);
    //     const currentDateTime = new Date();
    //     // if (currentDateTime < apiDateTime){
    //     //     const response = ApiResponse("0","Sorry you cannot start preparing before schedule Date&Time","",{});
    //     //     return res.json(response);
    //     // }
    //   }

    const status = await orderStatus.findOne({
      where: {
        name: "Preparing",
      },
    });
    orderData.orderStatusId = status.id;
    orderData
      .save()
      .then(async (dat) => {
        let time = Date.now();
        orderHistory.create({
          time,
          orderId: orderData.id,
          orderStatusId: status.id,
        });
        const response = ApiResponse(
          "1",
          `Schedule Order ID : ${orderId} has been set for outgoing`,
          "",
          {}
        );
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
      });
  } else {
    const response = ApiResponse("0", "Sorry order not found!", "Error", {});
    return res.json(response);
  }
}

async function acceptOrder(req, res) {
  const { orderId, restaurantId, customTime } = req.body;
  const requiredFields = ["orderId", "restaurantId", "customTime"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      const response = ApiResponse(
        "0",
        `${field.toUpperCase()} is required`,
        `Please provide a value for ${field.toUpperCase()}`,
        {}
      );
      return res.json(response);
    }
  }
  const dd = await order.findOne({
    where: {
      id: orderId,
    },
    include: [
      {
        model: address,
        as: "dropOffID",
      },
      {
        model: restaurant,
      },
      {
        model: user,
        attributes: ["id", "deviceToken", "ip"],
      },
    ],
  });
  if (dd) {
    const restData = await restaurant.findOne({
      where: {
        id: restaurantId,
      },
      include: { model: user, attributes: ["ip"] },
      attributes: ["approxDeliveryTime", "lat", "lng"],
    });
    let etaText = await eta_text(
      restData.lat,
      restData.lng,
      dd.dropOffID?.lat,
      dd.dropOffID?.lng
    );

    const status = await orderStatus.findOne({
      where: {
        name: "Preparing",
      },
    });
    const acceptedStatus = await orderStatus.findOne({
      where: {
        name: "Accepted",
      },
    });
    const mode = await orderMode.findOne({
      where: {
        name: "Scheduled",
      },
    });

    if (dd.orderStatusId == acceptedStatus.id) {
      const response = ApiResponse(
        "0",
        "Order Already accepted by restaurant",
        "",
        {}
      );
      return res.json(response);
    }
    if (dd.orderModeId == mode.id) {
      dd.orderStatusId = acceptedStatus.id;
    } else {
      dd.orderStatusId = status.id;
    }

    dd.customTime = customTime;
    dd.save()
      .then(async (dat) => {
        let retailerHomeData = await homeData(restaurantId);
        let time = Date.now();
        orderHistory.create({
          time,
          orderId: dd.id,
          orderStatusId: acceptedStatus.id,
        });
        orderHistory.create({
          time,
          orderId: dd.id,
          orderStatusId: status.id,
        });

        let data = {
          eta_text: parseInt(customTime) + parseInt(etaText),
          orderId: dd.id,
        };
       
        const eventData = {
          type: "acceptOrder",
          data: { data: data },
        };
        const eventDataForRetailer = {
          type: "acceptOrder",
          data: {
            status: "1",
            message: "data",
            error: "",
            data: retailerHomeData,
          },
        };
       
        sendEvent(dd?.user?.ip, eventData);
        sendEvent(restData?.user?.ip, eventDataForRetailer);
        singleNotification(
          dd.user.deviceToken,
          "Order Accepted",
          `Your Order ID : ${orderId} has accepted by Restaurant`,
          data
        );
        const response = ApiResponse(
          "1",
          "Order Accepted by Restaurant",
          "",
          {}
        );
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
      });
  }
  else{
    let response = ApiResponse("0","Order not found","",{});
    return res.json(response)
  }
}
async function acceptOrderForSocket(orderId, restaurantId, customTime) {
  try {
    const dd = await order.findOne({
      where: {
        id: orderId,
      },
      include: [
        {
          model: address,
          as: "dropOffID",
        },
        {
          model: restaurant,
        },
        {
          model: user,
          attributes: ["id", "deviceToken"],
        },
      ],
    });
    if (dd) {
      const restData = await restaurant.findOne({
        where: {
          id: restaurantId,
        },
        attributes: ["approxDeliveryTime", "lat", "lng"],
      });
      let etaText = await eta_text(
        restData.lat,
        restData.lng,
        dd.dropOffID?.lat,
        dd.dropOffID?.lng
      );
      let data = {
        eta_text: parseInt(customTime) + parseInt(etaText),
        orderId: orderId,
      };
      let response = ApiResponse("1", "Data", "", data);
      return response;
    } else {
      let response = ApiResponse("0", "Order not found", "", {});
      return response;
    }
  } catch (error) {
    let response = ApiResponse("0", error.message, "", {});
    return response;
  }
}

async function rejectOrder(req, res) {
  const { orderId, cancelledBy, comment, title } = req.body;
  const requiredFields = ["orderId", "cancelledBy", "comment", "title"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      const response = ApiResponse(
        "0",
        `${field.toUpperCase()} is required`,
        `Please provide a value for ${field.toUpperCase()}`,
        {}
      );
      return res.json(response);
    }
  }
  const status = await orderStatus.findOne({
    where: {
      name: "Cancelled",
    },
  });
  const orderData = await order.findOne({
    where: {
      id: orderId,
    },
    include: {
      model: user,
      attributes: ["id", "deviceToken"],
    },
  });
  //   return res.json(orderData)
  if (orderData) {
    orderData.orderStatusId = status.id;
    orderData
      .save()
      .then((dd) => {
        const history = new orderHistory();
        history.time = new Date();
        history.orderId = dd.id;
        history.orderStatusId = status.id;
        history.reason = comment;
        history.cancelledBy = req.user.id;
        history
          .save()
          .then((his) => {
            // send notification to customer that your order has been rejected
            let notiBody = {
              comment: comment,
              title: title,
            };
            console.log(notiBody);
            singleNotification(
              orderData?.user?.deviceToken,
              "Order Rejected",
              `Your Order ID : ${orderId} has rejected due to ${title}`,
              notiBody
            );
            const response = ApiResponse("1", "Order Cancelled", "", {});
            return res.json(response);
          })
          .catch((error) => {
            const response = ApiResponse("0", error.message, "", {});
            return res.json(response);
          });
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "", {});
        return res.json(response);
      });
  } else {
    const response = ApiResponse("0", "No order found", "", {});
    return res.json(response);
  }
}

async function delivered(req, res) {
  const { orderId } = req.body;
  const status = await orderStatus.findOne({
    where: {
      name: "Delivered",
    },
  });
  order
    .update(
      {
        orderStatusId: status.id,
      },
      {
        where: {
          id: orderId,
        },
      }
    ) // onTheWay
    .then(async (data) => {
      orderHistory.create({
        time: Date.now(),
        orderId,
        orderStatusId: status.id,
      });
      order
        .findOne({
          where: {
            id: orderId,
          },
          attributes: [
            "id",
            "orderNum",
            "total",
            "driverId",
            "userId",
            "paymentMethodId",
            "restaurantId",
            "currencyUnitId",
          ],
          include: [
            {
              model: orderCharge,
            },
            {
              model: restaurant,
              include: {
                model: user,
              },
            },
            {
              model: user,

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
        })
        .then(async (orderData) => {
          let to = [
            orderData.user.deviceToken,
            orderData?.restaurant?.user?.deviceToken,
          ];
          const restEarn = await restaurantEarning.findOne({
            where: {
              restaurantId: orderData.restaurantId,
            },
          });
          if (restEarn) {
            restEarn.totalEarning =
              parseFloat(restEarn.totalEarning) +
              parseFloat(orderData?.orderCharge?.restaurantEarnings);
            restEarn.availableBalance =
              parseFloat(restEarn.availableBalance) +
              parseFloat(orderData?.orderCharge?.restaurantEarnings);
            await restEarn.save();
          } else {
            const newRestEarning = new restaurantEarning();
            newRestEarning.totalEarning = parseFloat(
              orderData?.orderCharge?.restaurantEarnings
            );
            newRestEarning.availableBalance = parseFloat(
              orderData?.orderCharge?.restaurantEarnings
            );
            newRestEarning.restaurantId = orderData.restaurantId;
            await newRestEarning.save();
          }

          let notification = {
            title: "Order Delivered",
            body: `Order Number ${orderData.orderNum} has been delivered`,
          };
          let data = {
            testData: "12354",
          };
          sendNotification(to, notification, data).then((dat) => {
            const response = ApiResponse("1", "Food Delivered", "", orderData);
            return res.json(response);
          });
        });
    });
}

async function restaurantDrivers(req, res) {
  const { orderId } = req.body;
  const orderData = await order.findOne({
    where: {
      id: orderId,
    },
  });
  const drivers = await restaurantDriver.findAll({
    where: [
      {
        restaurantId: req.params.restaurantId,
      },
      {
        status: true,
      },
    ],
    include: {
      model: user,
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "deviceToken",
        "countryCode",
        "phoneNum",
        "status",
      ],
      include: {
        model: driverDetails,
        attributes: ["profilePhoto"],
      },
    },
  });
  let list = [];
  // return res.json(drivers)
  if (drivers.length > 0) {
    drivers.forEach((driver) => {
      let obj = {
        id: driver?.user?.id,
        phoneNum: driver?.user?.phoneNum,
        countryCode: driver?.user?.countryCode,
        firstName: driver?.user?.firstName,
        lastName: driver?.user?.lastName,
        email: driver?.user?.email,
        deviceToken: driver?.user?.deviceToken,
        status: driver?.user?.status,
        driverDetails: driver?.user?.driverDetails[0],
        isAssigned: driver?.user?.id == orderData?.driverId ? true : false,
      };
      list.push(obj);
    });
  }

  const response = ApiResponse("1", "Restaurant Drivers", "", list);
  return res.json(response);
}

async function assignDriver(req, res) {
  const { driverId, orderId } = req.body;
  const requiredFields = ["driverId", "orderId"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      const response = ApiResponse(
        "0",
        `${field.toUpperCase()} is required`,
        `Please provide a value for ${field.toUpperCase()}`,
        {}
      );
      return res.json(response);
    }
  }
  const orderData = await order.findOne({
    where: {
      id: orderId,
    },
    include: [
      { model: orderCharge },
      {
        model: address,
        as: "dropOffID",
      },
      {
        model: restaurant,
      },
      {
        model: user,
        attributes: ["id", "deviceToken", "ip"],
      },
    ],
  });
  if (orderData.driverId != null) {
    const response = ApiResponse(
      "0",
      "Already driver is assigned to this order",
      "",
      {}
    );
    return res.json(response);
  }
  const driverData = await user.findOne({
    where: {
      id: driverId,
    },
    attributes: ["id", "deviceToken", "firstName", "lastName", "ip"],
  });

  if (!driverData) {
    const response = ApiResponse(
      "0",
      `Sorry! No Driver exists against ID : ${driverId}`,
      "",
      {}
    );
    return res.json(response);
  }
  if (orderData) {
    // orderData.driverId = driverId;
    orderData
      .save()
      .then(async (dat) => {
        const estTime = await eta_text(
          orderData.restaurant.lat,
          orderData.restaurant.lng,
          orderData.dropOffID.lat,
          orderData.dropOffID.lng
        );
        let notiDAta = {
          orderId: orderData.id,
          restaurantName: orderData.restaurant.businessName,
          estEarning: orderData?.orderCharge?.driverEarnings,
          dropOffAddress: orderData.dropOffID.streetAddress,
          pickUpAddress: orderData.restaurant.address,
          orderApplication: orderData.businessType,
          estTime: estTime,
          distance: orderData.distance,
          orderNum: orderData.orderNum,
          orderType: orderData.deliveryTypeId,
        };

        const eventData = {
          type: "assignDriver",
          data: { data: notiDAta },
        };
        // sendEvent(orderData?.user?.ip, eventData);
        sendEvent(driverData?.ip, eventData);

        // send notification to driver
        singleNotification(
          driverData?.deviceToken,
          "Driver Assigned",
          `You have been assigned to Order ID : ${orderId}`,
          notiDAta
        );
        // send notification fot customer
        // singleNotification(
        //   orderData.user.deviceToken,
        //   "Driver Assign",
        //   `${driverData.firstName} ${driverData.lastName} has been assigned for your order`
        // );

        const response = ApiResponse("1", "Driver Assign to Order", "", {});
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
      });
  }
}
async function assignDriverForSocket(driverId, orderId) {
  const orderData = await order.findOne({
    where: {
      id: orderId,
    },
    include: [
      { model: orderCharge },
      {
        model: address,
        as: "dropOffID",
      },
      {
        model: restaurant,
      },
      {
        model: user,
        attributes: ["id", "deviceToken"],
      },
    ],
  });

  if (orderData.driverId != null) {
    let response = {
      status: "0",
      message: "Driver Already assigned!",
      error: "",
      data: {},
    };
    return response;
  }
  const driverData = await user.findOne({
    where: {
      id: driverId,
    },
    attributes: ["id", "deviceToken", "firstName", "lastName"],
  });

  if (!driverData) {
    let response = {
      status: "0",
      message: `Sorry! No Driver exists against ID : ${driverId}`,
      error: "",
      data: {},
    };
    return response;
  }
  if (orderData) {
    const estTime = await eta_text(
      orderData.restaurant.lat,
      orderData.restaurant.lng,
      orderData.dropOffID.lat,
      orderData.dropOffID.lng
    );
    let notiDAta = {
      orderId: orderData.id,
      restaurantId: orderData.restaurantId,
      userId: orderData.userId,
      restaurantName: orderData.restaurant.businessName,
      estEarning: orderData?.orderCharge?.driverEarnings,
      dropOffAddress: orderData.dropOffID.streetAddress,
      pickUpAddress: orderData.restaurant.address,
      orderApplication: orderData.businessType,
      estTime: estTime,
      distance: orderData.distance,
      orderNum: orderData.orderNum,
      orderType: orderData.deliveryTypeId,
    };

    let response = {
      status: "1",
      message: "Data",
      error: "",
      data: notiDAta,
    };
    return response;
  } else {
    let response = {
      status: "0",
      message: "Sorry order not found!",
      error: "",
      data: {},
    };
    return response;
  }
}

async function getRestaurantDrivers(req, res) {
  const { restaurantId } = req.params;
  const drivers = await restaurantDriver.findAll({
    where: [
      {
        status: true,
      },
      {
        restaurantId: restaurantId,
      },
    ],
    include: {
      model: user,
      attributes: [
        "id",
        "userName",
        "firstName",
        "lastName",
        "phoneNum",
        "countryCode",
        "email",
        "status",
        "verifiedAt",
      ],
    },
  });
  let driverList = [];
  if (drivers.length > 0) {
    drivers.map((driver) => {
      let obj = {
        id: driver?.user?.id,
        userName: driver?.user?.userName,
        email: driver?.user?.email,
        firstName: driver?.user?.firstName,
        lastName: driver?.user?.lastName,
        phoneNum: driver?.user?.phoneNum,
        countryCode: driver?.user?.countryCode,
        status: driver?.user?.status,
        active: driver?.user?.verifiedAt == null ? 0 : 1,
      };
      driverList.push(obj);
    });
  }
  const response = ApiResponse("1", "Restaurant Drivers", "", driverList);
  return res.json(response);
}

async function storeTime(req, res) {
  let timing = await time.findAll({
    where: {
      restaurantId: req.params.restaurantId,
    },
    attributes: ["id", "day", "name", "startAt", "endAt", "status"],
  });
  const response = ApiResponse("1", "Store Timing", "", timing);
  return res.json(response);
}

async function updateStoreTime(req, res) {
  const { restaurantId, data } = req.body;
  data.map(async (dat) => {
    const timeTable = await time.findOne({
      where: [
        {
          restaurantId: restaurantId,
        },
        {
          day: dat.day,
        },
      ],
    });
    if (timeTable) {
      timeTable.startAt = dat.startAt;
      timeTable.endAt = dat.endAt;
      timeTable.status = dat.flag === 1 ? true : false;
      await timeTable.save();
    } else {
      const newTime = new time();
      newTime.startAt = dat.startAt;
      newTime.endAt = dat.endAt;
      newTime.status = dat.flag === 1 ? true : false;
      newTime.restaurantId = restaurantId;
      newTime.day = dat.day;
      newTime.name =
        dat.day == "0"
          ? "sunday"
          : dat.day == "1"
          ? "monday"
          : dat.day == "2"
          ? "tuesday"
          : dat.day == "3"
          ? "wednesday"
          : dat.day == "4"
          ? "thursday"
          : dat.day == "5"
          ? "friday"
          : dat.day == "6"
          ? "saturday"
          : "";
      await newTime.save();
    }
  });
  const response = ApiResponse("1", "Store Time updated successfully", "", {});
  return res.json(response);
}

async function session(req, res) {
  const userId = req.user.id;
  const userExist = await user.findOne({
    where: {
      id: userId,
    },
    include: [
      {
        model: restaurant,
      },
    ],
  });
  if (!userExist.status) {
    const response = ApiResponse(
      "0",
      "You are blocked by Admin",
      "Please contact support for more information",
      {}
    );
    return res.json(response);
  }
  const acccessToken = req.header("accessToken");
  const data = {
    userId: `${userExist.id}`,
    //   userName: `${userExist.userName}`,
    firstName: `${userExist.firstName}`,
    lastName: `${userExist.lastName}`,
    email: `${userExist.email}`,
    accessToken: `${acccessToken}`,
    logo: userExist.restaurants[0].logo,
    image: userExist.restaurants[0].image,
    restaurantId: userExist.restaurants[0].id,
    businessName: userExist.restaurants[0]?.businessName,
    businessEmail: userExist.restaurants[0]?.businessEmail,
    businessType: userExist.restaurants[0]?.businessType,
    businessCountryCode: userExist.restaurants[0]?.countryCode,
    businessPhone: userExist.restaurants[0]?.phoneNum,
    city: userExist.restaurants[0]?.city,
    lat: userExist.restaurants[0]?.lat,
    lng: userExist.restaurants[0]?.lng,
    zipCode: userExist.restaurants[0]?.zipCode,
    address: userExist.restaurants[0]?.address,
    description: userExist.restaurants[0]?.description,
  };
  const response = ApiResponse("1", "Login Successfull", "", data);
  return res.json(response);
}

async function orderDetails(req, res) {
  const { orderId } = req.body;
  const orderData = await order.findOne({
    where: {
      id: orderId,
    },
    include: [
      {
        model: restaurant,
        include: {
          model: unit,
          as: "currencyUnitID",
        },
      },
      {
        model: orderStatus,
      },
      {
        model: address,
        as: "dropOffID",
      },
      {
        model: orderItems,
        include: [
          {
            model: R_PLink,
            include: {
              model: R_MCLink,
              attributes: ["id"],
              include: {
                model: menuCategory,
                attributes: ["id", "name", "image"],
              },
            },
          },
          {
            model: orderAddOns,
            include: {
              model: P_A_ACLink,
              include: {
                model: addOn,
              },
            },
          },
        ],
      },
      {
        model: orderCharge,
      },
      {
        model: paymentMethod,
      },
      {
        model: deliveryType,
      },
      {
        model: user,
        as: "DriverId",
        include: {
          model: driverDetails,
        },
      },
      {
        model: user,
        attributes: [
          "id",
          "userName",
          "firstName",
          "lastName",
          "email",
          "countryCode",
          "phoneNum",
        ],
      },
    ],
  });
  // return res.json(orderData)
  if (!orderData) {
    const response = ApiResponse("0", "Sorry no order exist", "Error", {});
    return res.json(response);
  }
  const apiDate = orderData.scheduleDate;

  // Parse the date string from the API response
  const parsedDate = new Date(apiDate);

  // Define options for formatting
  const options = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false, // Use 12-hour clock
    timeZone: "UTC", // Display timezone abbreviation
  };

  // Format the date according to the options
  const schDate = parsedDate.toLocaleString("en-US", options);

  let itemArr = [];

  orderData.orderItems.map((oi, idx) => {
    let itemPrice = parseFloat(oi.total);
    let addOnArr = [];

    //manipulating addons
    oi.orderAddOns.map((oao, ind) => {
      itemPrice = itemPrice + parseFloat(oao.total);
      let addOnObj = {
        name: oao.P_A_ACLink.addOn.name,
        price: oao.total,
      };
      addOnArr.push(addOnObj);
    });
    let itemObj = {
      itemName: oi.R_PLink.name,
      menuCategory: oi?.R_PLink?.R_MCLink?.menuCategory,
      quantity: oi.quantity,
      itemPrice: itemPrice,
      addOns: addOnArr,
    };
    itemArr.push(itemObj);
  });
  // return res.json(itemArr)
  let driver_lat = "";
  let driver_lng = "";
  const firebase_data = await axios.get(process.env.FIREBASE_URL);
  if (firebase_data.data) {
    const driverLatLng = firebase_data?.data[orderData.driverId];
  }

  let outObj = {
    id: orderData.id,
    restaurantId: orderData.restaurant ? orderData.restaurant.id : "",
    restaurantName: orderData.restaurant
      ? orderData.restaurant.businessName
      : "",
    restaurantPhoto: orderData.restaurant ? orderData.restaurant.logo : "",
    restaurantLat: orderData.restaurant.lat,
    restaurantLng: orderData.restaurant.lng,
    orderNum: orderData.orderNum,
    scheduleDate: schDate,
    OrderStatusId: orderData.orderStatus.id,
    OrderStatus: orderData.orderStatus?.name,
    address: `${orderData.dropOffID?.building} ${orderData.dropOffID?.streetAddress}`,
    dropOffLat: orderData.dropOffID?.lat,
    dropOffLng: orderData.dropOffID?.lng,
    items: itemArr,
    subTotal: orderData.orderCharge.basketTotal,
    deliveryFee: orderData.orderCharge.deliveryFees,
    VAT: orderData.orderCharge.VAT,
    discount: orderData.orderCharge.discount
      ? orderData.orderCharge.discount
      : 0,
    serviceCharges: orderData.orderCharge.serviceCharges,
    total: orderData.orderCharge.total,
    note: orderData.note,
    paymentMethod: orderData.paymentMethod?.name ?? "",
    deliveryType: orderData.deliveryType.name,
    driverDetails: orderData.driverId
      ? {
          name: `${orderData.DriverId.firstName} ${orderData.DriverId.lastName}`,
          image: orderData.DriverId.driverDetails[0]?.profilePhoto,
          phoneNum: `${orderData.DriverId.countryCode} ${orderData.DriverId.phoneNum}`,
        }
      : null,
    user: orderData?.user,
    currency: orderData.restaurant.currencyUnitID?.symbol,
  };
  const response = ApiResponse("1", "Order Details", "", outObj);
  return res.json(response);
}

async function activeOrders(req, res) {
  const { restaurantId } = req.params;
  const Accepted = await orderStatus.findOne({
    where: {
      name: "Accepted",
    },
  });
  const Preparing = await orderStatus.findOne({
    where: {
      name: "Preparing",
    },
  });
  const readyForDelivery = await orderStatus.findOne({
    where: {
      name: "Ready for delivery",
    },
  });
  const way = await orderStatus.findOne({
    where: {
      name: "On the way",
    },
  });
  const pickup = await orderStatus.findOne({
    where: {
      name: "Food Pickedup",
    },
  });
  const AcceptedByDriver = await orderStatus.findOne({
    where: {
      name: "Accepted by Driver",
    },
  });
  let status_list = [
    Accepted.id,
    Preparing.id,
    readyForDelivery.id,
    way.id,
    pickup.id,
    AcceptedByDriver.id,
  ];
  return res.json(status_list);
  const orderData = await order.findAll({
    where: {
      restaurantId: restaurantId,
      orderStatusId: {
        [sequelize.Op.in]: [3, 4, 5, 6, 7],
      },
    },
  });
  const response = ApiResponse("1", "Active Orders", "", orderData);
  return res.json(response);
}

async function completedOrders(req, res) {
  const { restaurantId } = req.params;
  const status = await orderStatus.findOne({
    where: {
      name: "Delivered",
    },
  });
  const orderData = await order.findAll({
    include: {
      model: orderCharge,
    },
    where: [
      {
        restaurantId: restaurantId,
      },
      {
        orderStatusId: status.id,
      },
    ],
  });
  const response = ApiResponse("1", "completed Orders", "", orderData);
  return res.json(response);
}

async function readyForPickup(req, res) {
  const { orderId } = req.body;
  const status = await orderStatus.findOne({
    where: {
      name: "Ready for delivery",
    },
  });
  const orderData = await order.findOne({
    where: {
      id: orderId,
    },
    include: [
      {
        model: restaurant,
      },
      {
        model: deliveryType,
      },
      {
        model: address,
        as: "dropOffID",
      },
      {
        model: user,
      },
      {
        model: user,
        as: "DriverId",
        attributes: [
          "id",
          "firstName",
          "deviceToken",
          "lastName",
          "email",
          "countryCode",
          "phoneNum",
          "ip",
        ],
      },
    ],
  });

  const rejectStatus = await orderStatus.findOne({
    where: {
      name: "Cancelled",
    },
  });

  if (orderData) {
    if (orderData.orderStatusId == rejectStatus.id) {
      const response = ApiResponse(
        "0",
        `This order ID ${orderId} is already rejected by Driver`,
        "",
        {}
      );
      return res.json(response);
    }
    if (orderData?.deliveryType?.name == "Delivery") {
      if (orderData.driverId == null) {
        const response = ApiResponse(
          "0",
          `Please assign driver to Order for Delivery`,
          "",
          {}
        );
        return res.json(response);
      }
    }

    orderData.orderStatusId = status.id;
    orderData
      .save()
      .then(async (dat) => {
        const history = new orderHistory();
        history.time = Date.now();
        history.orderId = orderId;
        history.orderStatusId = status.id;
        history
          .save()
          .then(async (dd) => {
            let lat = "";
            let lng = "";
            if (orderData.deliveryTypeId == "2") {
              const estTime = await eta_text(
                orderData.restaurant.lat,
                orderData.restaurant.lng,

                orderData.dropOffID.lat,
                orderData.dropOffID.lng
              );
              let data = {
                estTime,
                orderStatus: "Ready for delivery",
              };
              let eventData = {
                type: "readyForPickup",
                data: data,
              };
              sentEvent(orderData?.DriverId?.ip, eventData);
              sentEvent(orderData?.user?.ip, eventData);

              singleNotification(
                orderData?.user?.deviceToken,
                "Ready for Pickup",
                `Your Order ID ${orderId} is ready for Pickup`,
                data
              );
              const response = ApiResponse(
                "1",
                "Order is ready for Pickup",
                "",
                data
              );
              return res.json(response);
            } else {
              const fireBase = await axios.get(process.env.FIREBASE_URL);
              if (fireBase?.data) {
                if (fireBase.data[orderData.driverId]) {
                  lat = fireBase.data[orderData.driverId].lat;
                  lng = fireBase.data[orderData.driverId].lng;
                }
              }
              const estTime = await eta_text(
                orderData.restaurant.lat,
                orderData.restaurant.lng,

                lat,
                lng
              );
              const data = {
                estTime,
                orderStatus: "Ready for delivery",
              };

              // send notification ot customer that your order is ready for pickup
              singleNotification(
                orderData?.user?.deviceToken,
                "Ready for Pickup",
                `Your Order ID ${orderId} is ready for Pickup`,
                data
              );
              singleNotification(
                orderData?.DriverId?.deviceToken,
                "Ready for Pickup",
                `Your Order ID ${orderId} is ready for Pickup`,
                data
              );
            }
            const data = {
              estTime: "10 mints",
              orderStatus: "Ready for delivery",
            };
            const response = ApiResponse(
              "1",
              "Order is ready for Pickup",
              "",
              data
            );
            return res.json(response);
          })
          .catch((error) => {
            const response = ApiResponse("0", error.message, "Error", {});
            return res.json(response);
          });
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
      });
  }
}

async function updateRestaurant(req, res) {
  const {
    restaurantId,
    businessName,
    countryCode,
    phoneNum,
    city,
    description,
    zipCode,
    address,
    lat,
    lng,
    zoneId,
  } = req.body;
  //   const requiredFields = [
  //     'restaurantId', 'businessName', 'countryCode', 'phoneNum', 'city',
  //     'description', 'zipCode', 'address', 'lat', 'lng', 'zoneId'
  //   ];

  //   for (const field of
  //       requiredFields) {
  //     if (!req.body[field]) {
  //       const response = ApiResponse(
  //         "0", `${field.toUpperCase()} is required`,
  //         `Please provide a value for ${field.toUpperCase()}`, {}
  //       );
  //       return res.json(response);
  //     }
  //   }
  const restData = await restaurant.findOne({
    where: {
      id: restaurantId,
    },
  });

  if (restData) {
    restData.businessName = businessName;
    restData.countryCode = countryCode;
    restData.address = address;
    restData.zipCode = zipCode;
    restData.phoneNum = phoneNum;
    restData.lat = lat;
    restData.lng = lng;
    restData.description = description;
    if (city) {
      restData.city = city;
    }

    const imageToBeRemoved = restData?.image;
    const imagelogo = restData?.logo;
    // 3. Delete the image file from the server
    if (imageToBeRemoved) {
      try {
        await fs.unlink(imageToBeRemoved);
      } catch (error) {}
    }
    if (imagelogo) {
      try {
        await fs.unlink(imagelogo);
      } catch (error) {}
    }

    if (req?.files?.logo?.length > 0) {
      let logoPathTemp = req.files.logo[0].path;
      let logoPath = logoPathTemp.replace(/\\/g, "/");
      restData.logo = logoPath;
    }
    if (req?.files?.coverImage?.length > 0) {
      let imagePathTemp = req.files.coverImage[0].path;
      let imagePath = imagePathTemp.replace(/\\/g, "/");
      restData.image = imagePath;
    }

    restData
      .save()
      .then(async (dat) => {
        const restZone = await zoneRestaurants.findOne({
          where: {
            restaurantId: restaurantId,
          },
        });
        if (restZone) {
          restZone.zoneId = zoneId;
          await restZone.save();
        }

        const response = ApiResponse("1", "Restaurant Updated", "", {});
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
      });
  } else {
    let response = ApiResponse("0", "Sorry! restaurant not found", "", {});
    return res.json(response);
  }
}

async function updatePassword(req, res) {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const requiredFields = ["currentPassword", "newPassword", "confirmPassword"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      const response = ApiResponse(
        "0",
        `${field.toUpperCase()} is required`,
        `Please provide a value for ${field.toUpperCase()}`,
        {}
      );
      return res.json(response);
    }
  }

  // Additional validation for password matching
  if (newPassword !== confirmPassword) {
    const response = ApiResponse(
      "0",
      "Password mismatch",
      "New password and confirm password do not match",
      {}
    );
    return res.json(response);
  }
  if (newPassword === confirmPassword) {
    const userData = await user.findOne({
      where: {
        id: req.user.id,
      },
    });
    if (userData) {
      let match = await bcrypt.compare(currentPassword, userData.password);
      if (!match) {
        const response = ApiResponse(
          "0",
          "Current Password mismatch",
          "Error",
          {}
        );
        return res.json(response);
      }
      userData.password = await bcrypt.hash(newPassword, 10);
      userData
        .save()
        .then((dat) => {
          const response = ApiResponse(
            "1",
            "Password updated successfully",
            "",
            {}
          );
          return res.json(response);
        })
        .catch((error) => {
          const response = ApiResponse("0", error.message, "Error", {});
          return res.json(response);
        });
    }
  } else {
    const response = ApiResponse("0", "Confirm Password mismatch", "Error", {});
    return res.json(response);
  }
}

async function enableRushMode(req, res) {
  const { restaurantId, time } = req.body;
  const rest = await restaurant.findOne({
    where: {
      id: restaurantId,
    },
  });
  if (rest) {
    if (rest.isRushMode) {
      rest.isRushMode = false;
      rest.rushModeTime = 0;
      rest
        .save()
        .then((dat) => {
          const response = ApiResponse("1", "Rush Mode Disable", "", {});
          return res.json(response);
        })
        .catch((error) => {
          const response = ApiResponse("0", error.message, "Error", {});
          return res.json(response);
        });
    } else {
      rest.isRushMode = true;
      rest.rushModeTime = time;
      rest
        .save()
        .then((dat) => {
          const response = ApiResponse("1", "Rush Mode Enable", "", {});
          return res.json(response);
        })
        .catch((error) => {
          const response = ApiResponse("0", error.message, "Error", {});
          return res.json(response);
        });
    }
  } else {
    const response = ApiResponse("0", "No Restaurant found", "Error", {});
    return res.json(response);
  }
}

// async function addProduct(req, res) {
//   const {
//     productName,
//     price,
//     description,
//     RMCLinkId,
//     collections,
//     deliveryPrice,
//     pickupPrice,
//     isAvailable,
//   } = req.body;
//   // return res.json(JSON.parse(collections))
//   const pro = new product();
//   pro
//     .save()
//     .then(async (prd) => {
//       let tmpPath = req.file.path;
//       let path = tmpPath.replace(
//         /\\/g, "/");

//       const productData =
//         new R_PLink();
//       productData.name =
//         productName;
//       productData.description =
//         description;
//       productData.image = path;
//       productData.originalPrice =
//         price;
//       productData.deliveryPrice =
//         deliveryPrice;
//       if (isAvailable) {
//         productData.isAvailable =
//           isAvailable;
//       }

//       productData.pickupPrice =
//         pickupPrice;
//       productData.discountPrice =
//         price;
//       productData.discountValue =
//         0;
//       productData.isNew = 1;
//       productData.isRecommended =
//         1;
//       productData.productId = prd
//         .id;
//       productData.status = 1;
//       productData.RMCLinkId =
//         RMCLinkId;
//       productData
//         .save()
//         .then(async (dd) => {
//           //   collections?.map(async (coll) => {
//           //     const pao = new P_AOLink();
//           //     pao.minAllowed = 1;
//           //     pao.maxAllowed = 5;
//           //     pao.status = true;
//           //     pao.RPLinkId = dd.id;
//           //     pao.addOnCategoryId = coll;
//           //     await pao.save();
//           //   });

//           const response =
//             ApiResponse(
//               "1", "Product Added successfully", "", {}
//             );
//           return res.json(
//             response);
//         })
//         .catch((error) => {
//           const response =
//             ApiResponse("0", error.message, "Error", {});
//           return res.json(
//             response);
//         });
//     })
//     .catch((error) => {
//       const response = ApiResponse(
//         "0", error.message, "Error", {});
//       return res.json(response);
//     });
// }
async function addProduct(req, res) {
  const {
    productName,
    price,
    description,
    RMCLinkId,
    collections,
    deliveryPrice,
    pickupPrice,
    isAvailable,
    addonList,
    collectionId,
    countryOfOrigin,
    ingredients,
    allergies,
    nutrients,
  } = req.body;

  let check = await R_PLink.findOne({
    where: [
      {
        name: productName,
      },
      {
        RMCLinkId: RMCLinkId,
      },
    ],
  });
  if (check) {
    let response = ApiResponse(
      "1",
      "Product already exist with this name",
      "Error",
      {}
    );
    return res.json(response);
  }

  const pro = new product();
  pro
    .save()
    .then(async (prd) => {
      let tmpPath = req.file.path;
      let path = tmpPath.replace(/\\/g, "/");

      const productData = new R_PLink();
      productData.name = productName;
      productData.description = description;
      productData.image = path;
      productData.originalPrice = price;
      productData.deliveryPrice = deliveryPrice;
      if (isAvailable) {
        productData.isAvailable = isAvailable;
      }

      productData.pickupPrice = pickupPrice;
      productData.discountPrice = price;
      productData.discountValue = 0;
      productData.isNew = 1;
      productData.isRecommended = 1;
      productData.productId = prd.id;
      productData.status = 1;
      productData.RMCLinkId = RMCLinkId;
      productData.countryOfOrigin = countryOfOrigin;
      productData.ingredients = ingredients;
      productData.allergies = allergies;
      productData.nutrients = nutrients;
      productData
        .save()
        .then(async (dd) => {
          let collectionDataArray = JSON.parse(addonList);
          if (collectionDataArray.length > 0) {
            for (const collectionData of collectionDataArray) {
              const keys = Object.keys(collectionData);
              let collId = keys[0];
              // return res.json(collId);
              for (const add of collectionData[collId]) {
                let check = await collectionAddons.findOne({
                  where: [
                    {
                      collectionId: collId,
                    },
                    {
                      addOnId: add.id,
                    },
                  ],
                });
                // let check = await collectionAddons.findOne({where:[{collectionId :3},{addOnId : 8}]});
                // return res.json(check)

                if (check) {
                  check.minAllowed = 1;
                  check.maxAllowed = 5;
                  check.isPaid = add.isPaid;
                  check.isAvaiable = add.isAvailable;
                  check.price = add.price;
                  check.status = true;
                  // check.addOnId = add.id;
                  // check.collectionId = collId;
                  await check.save();
                } else {
                  let newCol = new collectionAddons();
                  newCol.minAllowed = 1;
                  newCol.maxAllowed = 5;
                  newCol.isPaid = add.isPaid;
                  newCol.isAvaiable = add.isAvailable;
                  newCol.price = add.price;
                  newCol.status = true;
                  newCol.addOnId = add.id;
                  newCol.collectionId = collId;
                  await newCol.save();
                }
              }
              let proCollection = new productCollections();
              proCollection.RPLinkId = dd.id;
              proCollection.collectionId = collId;
              proCollection.status = true;
              await proCollection.save();
            }
          }

          const response = ApiResponse(
            "1",
            "Product Added successfully",
            "",
            {}
          );
          return res.json(response);
        })
        .catch((error) => {
          const response = ApiResponse("0", error.message, "Error", {});
          return res.json(response);
        });
    })
    .catch((error) => {
      const response = ApiResponse("0", error.message, "Error", {});
      return res.json(response);
    });
}
async function editProduct(req, res) {
  const {
    productId,
    productName,
    price,
    description,
    RMCLinkId,
    collections,
    deliveryPrice,
    pickupPrice,
    isAvailable,
    addonList,
    nutrients,
    allergies,
    ingredients,
    countryOfOrigin,
  } = req.body;
  // return res.json(req.body)
  const productData = await R_PLink.findOne({
    where: {
      id: productId,
    },
  });
  productData.name = productName;
  productData.countryOfOrigin = countryOfOrigin;
  productData.ingredients = ingredients;
  productData.nutrients = nutrients;
  productData.allergies = allergies;
  productData.description = description;
  productData.originalPrice = price;
  productData.deliveryPrice = deliveryPrice;

  productData.isAvailable = isAvailable;

  productData.pickupPrice = pickupPrice;
  productData.discountPrice = price;
  productData.discountValue = 0;
  productData.isNew = 1;
  productData.isRecommended = 1;
  productData.status = 1;
  productData.RMCLinkId = RMCLinkId;

  if (req.file) {
    const imageToBeRemoved = productData.image;
    // 3. Delete the image file from the server
    if (imageToBeRemoved) {
      await fs.unlink(imageToBeRemoved);
    }

    let tmpPath = req.file.path;
    let path = tmpPath.replace(/\\/g, "/");
    productData.image = path;
  }

  productData
    .save()
    .then(async (dd) => {
      let collectionDataArray = JSON.parse(addonList);
      if (collectionDataArray.length > 0) {
        for (const collectionData of collectionDataArray) {
          const keys = Object.keys(collectionData);
          let collId = keys[0];
          // return res.json(collId);
          for (const add of collectionData[collId]) {
            let check = await collectionAddons.findOne({
              where: [
                {
                  collectionId: collId,
                },
                {
                  addOnId: add.id,
                },
              ],
            });
            // let check = await collectionAddons.findOne({where:[{collectionId :3},{addOnId : 8}]});
            // return res.json(check)

            if (check) {
              check.minAllowed = 1;
              check.maxAllowed = 5;
              check.isPaid = add.isPaid;
              check.isAvaiable = add.isAvailable;
              check.price = add.price;
              check.status = true;
              // check.addOnId = add.id;
              // check.collectionId = collId;
              await check.save();
            } else {
              let newCol = new collectionAddons();
              newCol.minAllowed = 1;
              newCol.maxAllowed = 5;
              newCol.isPaid = add.isPaid;
              newCol.isAvaiable = add.isAvailable;
              newCol.price = add.price;
              newCol.status = true;
              newCol.addOnId = add.id;
              newCol.collectionId = collId;
              await newCol.save();
            }
            let checkColl = await productCollections.findOne({
              where: [
                {
                  RPLinkId: dd.id,
                },
                {
                  collectionId: collId,
                },
              ],
            });
            if (!checkColl) {
              let proCollection = new productCollections();
              proCollection.RPLinkId = dd.id;
              proCollection.collectionId = collId;
              proCollection.status = true;
              await proCollection.save();
            }
          }
        }
      }

      const response = ApiResponse("1", "Product Updated successfully", "", {});
      return res.json(response);
    })
    .catch((error) => {
      const response = ApiResponse("0", error.message, "Error", {});
      return res.json(response);
    });
}

async function getProducts(req, res) {
  const { restaurantId } = req.params;
  const rmc = await R_MCLink.findAll({
    where: [
      {},
      {
        restaurantId: restaurantId,
      },
    ],
    include: [
      {
        model: menuCategory,
        where: {
          status: true,
        },
        attributes: ["id", "name", "image"],
      },
      {
        model: R_PLink,
        include: [
          {
            model: productCollections,
            attributes: ["id"],
            include: {
              model: collection,
              attributes: ["id", "title", "minAllowed", "maxAllowed"],
              include: {
                model: collectionAddons,
                attributes: [
                  "id",
                  "maxAllowed",
                  "minAllowed",
                  "isPaid",
                  "isAvaiable",
                  "price",
                ],
                include: {
                  model: addOn,
                  attributes: ["id", "name"],
                },
              },
            },
          },
        ],
      },
    ],
  });
  const response = ApiResponse("1", "Products", "", rmc);
  return res.json(response);
}

async function addCategory(req, res) {
  const { name, businessType, restaurantId } = req.body;
  const requiredFields = ["name", "restaurantId", "businessType"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      const response = ApiResponse(
        "0",
        `${field.toUpperCase()} is required`,
        `Please provide a value for ${field.toUpperCase()}`,
        {}
      );
      return res.json(response);
    }
  }
  const check_cat = await menuCategory.findOne({
    where: [
      {
        name: name,
      },
      {
        businessType: businessType,
      },
    ],
  });
  if (check_cat) {
    const rmc = await R_MCLink.findOne({
      where: [
        {
          status: true,
        },
        {
          menuCategoryId: check_cat.id,
        },
        {
          restaurantId: restaurantId,
        },
      ],
    });

    if (rmc) {
      const response = ApiResponse(
        "0",
        "Category with same name already exists",
        "",
        {}
      );
      return res.json(response);
    } else {
      let tmpPath = req.file.path;
      let path = tmpPath.replace(/\\/g, "/");

      let type = await orderApplication.findOne({
        where: {
          name: businessType,
        },
      });
      const category = new menuCategory();
      category.name = name;
      category.status = true;
      category.businessType = type?.id;
      // category.restaurantId = restaurantId;
      category.image = path;
      category.status = 1;
      category
        .save()
        .then(async (dat) => {
          const rmc = new R_MCLink();
          rmc.restaurantId = restaurantId;
          rmc.status = true;
          rmc.menuCategoryId = dat.id;
          await rmc.save();

          const response = ApiResponse(
            "1",
            "Category added successfully",
            "",
            {}
          );
          return res.json(response);
        })
        .catch((error) => {
          const response = ApiResponse("0", error.message, "", {});
          return res.json(response);
        });
    }
  } else {
    let tmpPath = req.file.path;
    let path = tmpPath.replace(/\\/g, "/");

    const category = new menuCategory();
    category.name = name;
    category.status = true;
    category.businessType = businessType;
    // category.restaurantId = restaurantId;
    category.image = path;
    category.status = 1;
    category
      .save()
      .then(async (dat) => {
        const rmc = new R_MCLink();
        rmc.restaurantId = restaurantId;
        rmc.status = true;
        rmc.menuCategoryId = dat.id;
        await rmc.save();

        const response = ApiResponse(
          "1",
          "Category added successfully",
          "",
          {}
        );
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "", {});
        return res.json(response);
      });
  }
}

async function getAllCategory(req, res) {
  const cats = await R_MCLink.findAll({
    where: [
      {
        restaurantId: req.params.restaurantId,
      },
    ],
    include: {
      model: menuCategory,
      where: {
        status: true,
      },
    },
  });
  let list = [];
  if (cats.length > 0) {
    cats.map((categ) => {
      if (categ?.menuCategory) {
        let obj = {
          id: categ.id,
          cateId: categ?.menuCategory?.id,
          name: categ.menuCategory.name,
          businessType: categ.menuCategory.businessType,
          image: categ.menuCategory.image,
          status: categ.menuCategory.status,
          createdAt: categ.menuCategory.createdAt,
          updatedAt: categ.menuCategory.updatedAt,
        };
        list.push(obj);
      }
    });
  }
  const response = ApiResponse("1", "All Categories", "", {
    categories: list,
  });
  return res.json(response);
}

async function removeCategory(req, res) {
  const { id } = req.body;

  const restId = await user.findOne({
    where: {
      id: req.user.id,
    },
    include: {
      model: restaurant,
    },
  });
  const menu = await menuCategory.findOne({
    where: {
      id: id,
    },
  });
  if (menu) {
    menu.status = false;
    menu
      .save()
      .then(async (Dat) => {
        const rmc = await R_MCLink.findOne({
          where: [
            {
              menuCategoryId: menu.id,
            },
            {
              restaurantId: restId.restaurants[0].id,
            },
          ],
        });
        // return res.json(rmc)
        if (rmc) {
          rmc.status = false;
          await rmc.save();
          const response = ApiResponse(
            "1",
            "Category removed successfully",
            "",
            {}
          );
          return res.json(response);
        }
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "", {});
        return res.json(response);
      });
  } else {
    const response = ApiResponse("0", "Category not found!", "", {});
    return res.json(response);
  }
}

async function editCategory(req, res) {
  const { categoryId, name } = req.body;
  const requiredFields = ["categoryId", "name"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      const response = ApiResponse(
        "0",
        `${field.toUpperCase()} is required`,
        `Please provide a value for ${field.toUpperCase()}`,
        {}
      );
      return res.json(response);
    }
  }
  const category = await menuCategory.findOne({
    where: {
      id: categoryId,
    },
  });
  if (category) {
    category.name = name;
    if (req.file) {
      const imagePath = category.image;

      // 3. Delete the image file from the server
      if (imagePath) {
        await fs.unlink(imagePath);
      }
      let tmpPath = req.file.path;
      let path = tmpPath.replace(/\\/g, "/");
      category.image = path;
    }

    category
      .save()
      .then((dat) => {
        const response = ApiResponse(
          "1",
          "Category updated successfully",
          "",
          {}
        );
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "", {});
        return res.json(response);
      });
  } else {
    const response = ApiResponse("0", "Category not found", "", {});
    return res.json(response);
  }
}

async function addCollection(req, res) {
  const { name } = req.body;
  const requiredFields = ["name"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      const response = ApiResponse(
        "0",
        `${field} is required`,
        `Please provide a value for ${field.toUpperCase()}`,
        {}
      );
      return res.json(response);
    }
  }
  const restData = await restaurant.findOne({
    where: {
      userId: req.user.id,
    },
  });
  const check = await collection.findOne({
    where: [
      {
        title: name,
      },
      {
        status: true,
      },
      {
        restaurantId: restData.id,
      },
    ],
  });

  if (check) {
    const response = ApiResponse("0", "Already exists", "", {});
    return res.json(response);
  } else {
    const coll = new collection();
    coll.title = name;
    coll.maxAllowed = 5;
    coll.minAllowed = 1;
    coll.restaurantId = restData.id;

    coll.status = true;
    coll
      .save()
      .then(async (dat) => {
        const response = ApiResponse("1", "Added successfully", "", {});
        return res.json(response);

        // const paoLink = new P_AOLink();
        // paoLink.maxAllowed = max;
        // paoLink.minAllowed = min;
        // paoLink.status = true;
        // paoLink.RPLinkId = rpLinkId;
        // paoLink.addOnCategoryId = dat.id;
        // paoLink
        //   .save()
        //   .then((dd) => {
        //     const response = ApiResponse("1", "Added successfully", "", {});
        //     return res.json(response);
        //   })
        //   .catch((error) => {
        //     const response = ApiResponse("0", error.message, "", {});
        //     return res.json(response);
        //   });
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "", {});
        return res.json(response);
      });
  }
}

async function getRPLinkIds(req, res) {
  const rmc = await R_MCLink.findAll({
    where: {
      restaurantId: req.params.restaurantId,
    },
    include: {
      model: R_PLink,
    },
  });
  var list = [];
  if (rmc.length > 0) {
    rmc.map((dd) => {
      dd.R_PLinks.map((data) => {
        let obj = {
          name: data.name,
          rplinkId: data.id,
        };
        list.push(obj);
      });
    });
  }
  const response = ApiResponse("1", "List of Rplinks", "", list);
  return res.json(response);
}

async function addAddOns(req, res) {
  const {
    name,
    collectionId,
    price,
    isPaid,
    isAvaiable,
    minAllowed,
    maxAllowed,
    addOnCategoryId,
    restaurantId,
  } = req.body;
  const requiredFields = ["name", "addOnCategoryId", "restaurantId"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      const response = ApiResponse(
        "0",
        `${field} is required`,
        `Please provide a value for ${field.toUpperCase()}`,
        {}
      );
      return res.json(response);
    }
  }

  // Additional validation if minAllowed should be less than or equal to maxAllowed
  if (minAllowed > maxAllowed) {
    const response = ApiResponse(
      "0",
      "Invalid range",
      "Minimum allowed value should be less than or equal to Maximum allowed value",
      {}
    );
    return res.json(response);
  }
  //   const check = await addOn.findOne({ where: { name: name } });
  //   if (check) {
  //     const response = ApiResponse("0", "Already exists", "", {});
  //     return res.json(response);
  //   } else
  {
    const newAddon = new addOn();
    newAddon.name = name;
    newAddon.isPaid = isPaid;
    newAddon.isAvaiable = isAvaiable;
    newAddon.minAllowed = 1;
    newAddon.maxAllowed = 5;
    newAddon.price = price;
    newAddon.orderApplicationName = 1;
    newAddon.restaurantId = restaurantId;
    newAddon.status = 1;
    newAddon
      .save()
      .then(async (dat) => {
        let collAdd = new collectionAddons();
        collAdd.isPaid = isPaid;
        collAdd.isAvaiable = isAvaiable;
        collAdd.minAllowed = minAllowed;
        collAdd.maxAllowed = maxAllowed;
        collAdd.price = price;
        collAdd.addOnId = dat.id;
        collAdd.collectionId = addOnCategoryId;
        collAdd
          .save()
          .then((dd) => {
            let response = ApiResponse("1", "Added successfully", "", {});
            return res.json(response);
          })
          .catch((error) => {
            const response = ApiResponse("0", error.message, "", {});
            return res.json(response);
          });
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "", {});
        return res.json(response);
      });
  }
}

async function updateAddOns(req, res) {
  const {
    id,
    name,
    isPaid,
    isAvaiable,
    minAllowed,
    maxAllowed,
    price,
    collectionId,
  } = req.body;
  //   const requiredFields = ['id', 'name',  'price', 'collectionId'
  //   ];

  //   for (const field of
  //       requiredFields) {
  //     if (!req.body[field]) {
  //       const response = ApiResponse(
  //         "0", `${field.toUpperCase()} is required`,
  //         `Please provide a value for ${field.toUpperCase()}`, {}
  //       );
  //       return res.json(response);
  //     }
  //   }

  // Additional validation if minAllowed should be less than or equal to maxAllowed
  if (minAllowed > maxAllowed) {
    const response = ApiResponse(
      "0",
      "Invalid range",
      "Minimum allowed value should be less than or equal to Maximum allowed value",
      {}
    );
    return res.json(response);
  }
  const check = await addOn.findOne({
    where: {
      id: id,
    },
  });
  if (check) {
    check.name = name;
    check.price = price;
    check.isPaid = isPaid;
    check.maxAllowed = maxAllowed;
    check.minAllowed = minAllowed;
    check.isAvaiable = isAvaiable;
    check
      .save()
      .then(async (dd) => {
        let col = await collectionAddons.findOne({
          where: [
            {
              addOnId: dd.id,
            },
            {
              price: price,
            },
            {
              isAvaiable: isAvaiable,
            },
            {
              isPaid: isPaid,
            },
          ],
        });
        if (col) {
          col.collectionId = collectionId;
          col.price = price;
          col.isPaid = isPaid;
          col.isAvaiable = isAvaiable;
          await col.save();
        }

        const response = ApiResponse("1", "Updated successfully", "", {});
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "", {});
        return res.json(response);
      });
  } else {
    let response = ApiResponse("0", "Addon not found!", "", {});
    return res.json(response);
  }
}

async function getAllAddOnCategories(req, res) {
  const dd = await collection.findAll({
    where: [
      {
        status: true,
      },
      {
        restaurantId: req.params.restaurantId,
      },
    ],
  });
  // return res.json(dd)
  var list = [];
  for (var i = 0; i < dd.length; i++) {
    let obj = {
      //   paoLink: dd[i]?.P_AOLinks[0]?.id,
      addonCategory: {
        id: dd[i]?.id,
        name: dd[i]?.title,
      },
      minAllowed: "1",
      maxAllowed: "2",
    };
    list.push(obj);
  }
  // const data = await R_MCLink.findAll({where:[{restaurantId:req.params.restaurantId}],include:{model:R_PLink,include:{model:P_AOLink,include:{model:addOnCategory,attributes:['id','name']}}}});
  // var cat_list = [];
  // if(data.length > 0){
  //     data.forEach((dd)=>{
  //         if(dd.R_PLinks.length > 0){
  //             dd.R_PLinks.forEach((rplink)=>{

  //               rplink.P_AOLinks.forEach((dat)=>{
  //                       let obj = {
  //                           paoLink:dat.id,
  //                           addonCategory:dat.addOnCategory,
  //                           minAllowed:dat.minAllowed,
  //                           maxAllowed:dat.maxAllowed
  //                       }
  //                   cat_list.push(obj);
  //               })
  //             })
  //         }
  //     })
  // }
  const response = ApiResponse("1", "Add On Cateogry list", "", list);
  return res.json(response);
}

async function deleteAddonCategory(req, res) {
  const { id } = req.body;
  const cat = await addOnCategory.findOne({
    where: {
      id: id,
    },
  });
  if (cat) {
    cat.status = false;
    cat
      .save()
      .then((Dat) => {
        const response = ApiResponse("1", "Removed successfully", "", {});
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "", {});
        return res.json(response);
      });
  } else {
    const response = ApiResponse("0", "Cannot found Category", "", {});
    return res.json(response);
  }
}
async function getAllAddOns(req, res) {
  let add = await collection.findAll({
    where: [
      {
        restaurantId: req.params.restaurantId,
      },
      {
        status: true,
      },
    ],
    include: {
      model: collectionAddons,
      attributes: [
        "id",
        "minAllowed",
        "maxAllowed",
        "isPaid",
        "isAvaiable",
        "price",
      ],
      include: {
        model: addOn,
        attributes: ["id", "name"],
      },
    },
  });
  // let add = await addOn.findAll({where:[{restaurantId : req.params.restaurantId},{status:true}],include:{model:collectionAddons,attributes:['collectionId'],include:{model:collection,attributes:['title']}}});

  let ress = ApiResponse("1", "Restaurant Addons", "", add);
  return res.json(ress);
  const data = await R_MCLink.findAll({
    where: [
      {
        restaurantId: req.params.restaurantId,
      },
    ],
    include: {
      model: R_PLink,
      include: {
        model: P_AOLink,
        include: [
          {
            model: addOnCategory,
          },
          {
            model: P_A_ACLink,
            include: {
              model: addOn,
            },
          },
        ],
      },
    },
  });
  //   const mobileApiResponse = data.map(event => {
  //     return {
  //         eventId: event.id,
  //         eventCreatedAt: event.createdAt,
  //         products: event.R_PLinks.map(product => {
  //             return {
  //                 productId: product.id,
  //                 productName: product.name,
  //                 addOns: product.P_AOLinks.map(addOn => {
  //                     return {
  //                         addOnCategoryId: addOn.addOnCategory.id,
  //                         addOnCategoryName: addOn.addOnCategory.name,
  //                         addons: addOn.P_A_ACLinks.map(addon => {
  //                             return {
  //                                 addonId: addon.addOn.id,
  //                                 addonName: addon.addOn.name,
  //                                 addonPrice: addon.price,
  //                                 // Add more details if needed
  //                             };
  //                         }),
  //                     };
  //                 }),
  //             };
  //         }),
  //     };
  // });
  // mobileApiResponse.forEach(event => {
  //     event.products.forEach(product => {
  //         const addonsByCategory = {};
  //         product.addOns.forEach(addon => {
  //             const categoryId = addon.addOnCategoryId;
  //             if (!addonsByCategory[categoryId]) {
  //                 addonsByCategory[categoryId] = {
  //                     addOnCategoryName: addon.addOnCategoryName,
  //                     addons: addon.addons
  //                 };
  //             } else {
  //                 addonsByCategory[categoryId].addons.push(...addon.addons);
  //             }
  //         });
  //         product.addOns = Object.keys(addonsByCategory).map(categoryId => ({
  //             addOnCategoryId: categoryId,
  //             addOnCategoryName: addonsByCategory[categoryId].addOnCategoryName,
  //             addons: addonsByCategory[categoryId].addons
  //         }));
  //     });
  // });

  //  return res.json(mobileApiResponse);
  var list = [];
  for (var k = 0; k < data.length; k++) {
    for (var l = 0; l < data[k].R_PLinks.length; l++) {
      for (m = 0; m < data[k].R_PLinks[l].P_AOLinks.length; m++) {
        for (
          n = 0;
          n < data[k].R_PLinks[l].P_AOLinks[m].P_A_ACLinks.length;
          n++
        ) {
          let obj = {
            addOn: data[k].R_PLinks[l].P_AOLinks[m].P_A_ACLinks[n].addOn,
            price: data[k].R_PLinks[l].P_AOLinks[m].P_A_ACLinks[n].price,
            maxAllowed:
              data[k].R_PLinks[l].P_AOLinks[m].P_A_ACLinks[n].addOn?.maxAllowed,
            minAllowed:
              data[k].R_PLinks[l].P_AOLinks[m].P_A_ACLinks[n].addOn?.minAllowed,
            PAOLinkId: data[k].R_PLinks[l].P_AOLinks[m].id,
            addOnCategory: data[k].R_PLinks[l].P_AOLinks[m]?.addOnCategory ?? {
              id: 1,
              name: "",
              orderApplicationName: "1",
              status: true,
              createdAt: "",
              updatedAt: "",
            },
          };
          list.push(obj);
        }
      }
    }
  }
  const response = ApiResponse("1", "All Addons", "", list);
  return res.json(response);
}

async function getRestaurantProfile(req, res) {
  const id = req.user.id;
  const userData = await user.findOne({
    where: {
      id: id,
    },
    attributes: [
      "id",
      "firstName",
      "lastName",
      "email",
      "countryCode",
      "phoneNum",
    ],
    include: {
      model: restaurant,
      include: {
        model: zoneRestaurants,
        attributes: ["zoneId"],
        include: {
          model: zone,
          attributes: ["name"],
        },
      },
    },
  });

  let obj = {
    id: userData.id,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    countryCode: userData.countryCode,
    phoneNum: userData.phoneNum,
  };
  const data = {
    user: obj,
    restaurant: userData.restaurants[0],
  };
  const response = ApiResponse("1", "Profile", "", data);
  return res.json(response);
}
//Module 2 Stores

/*
        1. Get all restaurants by a user
*/
async function getAllRest(req, res) {
  const userId = req.params.id;
  const restList = await restaurant.findAll({
    where: {
      userId: userId,
    },
    attributes: ["id", "businessName", "address", "status", "logo"],
  });
  const response = ApiResponse("1", "Login successfull", "", restList);
  return res.json(response);
}
/*
        3. Get all prodcuts by a restaurant
*/
async function getAllProdByRest(req, res) {
  const restId = req.params.restid;
  const productsData = await R_MCLink.findAll({
    where: {
      restaurantId: restId,
    },
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
      {
        model: menuCategory,
        attributes: ["id", "name"],
      },
    ],
  });
  const restaurantData = await restaurant.findByPk(restId, {
    include: {
      model: unit,
      as: "currencyUnitID",
      attributes: ["symbol"],
    },
    attributes: ["id"],
  });
  let data = {
    productsData,
    unit: restaurantData.currencyUnitID.symbol,
  };
  const response = ApiResponse("1", "All Products by restaurant", "", data);
  return res.json(response);
}

async function getAllCuisineByRest(req, res) {
  const restId = req.params.restid;
  const cuisinesData = await R_CLink.findAll({
    where: {
      restaurantId: restId,
    },
    include: [
      {
        model: cuisine,
        attributes: ["id", "name"],
      },
    ],
  });
  const response = ApiResponse("1", "All cuisines by restaurant", "", {
    cuisinesData,
  });
  return res.json(response);
}
/*
        3. Get all orders by a restaurant
*/
async function getAllOrdersByRest(req, res) {
  const restId = req.params.restid;
  const orderData = await order.findAll({
    where: {
      restaurantId: restId,
    },
    include: [
      {
        model: paymentMethod,
        attributes: ["name"],
      },
      {
        model: orderStatus,
        attributes: ["name"],
      },
      {
        model: deliveryType,
        attributes: ["name"],
      },
    ],
    attributes: ["id", "orderNum", "scheduleDate", "total"],
  });
  const restaurantData = await restaurant.findByPk(restId, {
    include: {
      model: unit,
      as: "currencyUnitID",
      attributes: ["symbol"],
    },
    attributes: ["id"],
  });
  const data = {
    orderData,
    unit: restaurantData.currencyUnitID.symbol,
  };
  const response = ApiResponse("1", "All Orders by a restaurant", "", data);
  return res.json(response);
}
/*
        3. Get ratings of a restaurant
*/
async function getRatingByRest(req, res) {
  const restId = req.params.restid;
  let feedbackData = await restaurantRating.findAll({
    where: {
      restaurantId: restId,
    },
    include: [
      {
        model: user,
        attributes: ["firstName", "lastName"],
      },
      {
        model: order,
        attributes: ["orderNum"],
      },
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

        userName: `${fb.user?.firstName} ${fb.user?.lastName}`,
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
  };
  const response = ApiResponse("1", "Ratins", "", data);
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
    where: {
      userId: userId,
    },
    attributes: ["id"],
  });
  let restArr = allRestaurants.map((ele) => {
    return ele.id;
  });
  let allNewOrders = await order.findAll({
    where: {
      [Op.and]: [
        {
          restaurantId: {
            [Op.or]: restArr,
          },
        },
        {
          orderApplicationId: 1,
        },
        {
          orderStatusId: status,
        },
      ],
    },
    include: [
      {
        model: restaurant,
        include: {
          model: unit,
          as: "currencyUnitID",
          attributes: ["symbol"],
        },
        attributes: ["businessName"],
      },
      {
        model: deliveryType,
        attributes: ["name"],
      },
    ],
    attributes: ["id", "orderNum", "scheduleDate", "total"],
  });
  const response = ApiResponse("1", "All new orders", "", allNewOrders);
  return res.json(response);
}
/*
        2. Get statuses
*/
async function getStatus(req, res) {
  let status = ["Accepted", "Preparing", "Ready for delivery"];
  const allStatusesRaw = await orderStatus.findAll({
    where: {
      name: {
        [Op.or]: status,
      },
    },
    attributes: ["id", "name"],
  });
  const response = ApiResponse("1", "All New Orders", "", allStatusesRaw);
  return res.json(response);
}
async function resturantcharge(req, res) {
  const userId = req.params.id;
  restaurant
    .findOne({
      where: {
        userId,
      },
    })
    .then((restData) => {
      const response = ApiResponse("1", "Restaurant Data", "", restData);
      return res.json(response);
    });
}
async function updateresturantcharge(req, res) {
  const userId = req.params.id;
  const deliveryCharge = req.body.deliveryCharge;
  restaurant
    .findOne({
      where: {
        userId,
      },
    })
    .then((restData) => {
      restData
        .update(
          {
            deliveryCharge,
          },
          {
            where: {
              userId,
            },
          }
        )
        .then((Data) => {
          const response = ApiResponse("Restaurant Data updated", "", Data);
          return res.json(response);
        });
    });
}
/*
        3. Change Order status
*/
async function changerOrderStatus(req, res) {
  const { orderStatus, orderId, userId } = req.body;
  const requiredFields = ["orderStatus", "orderId", "userId"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      const response = ApiResponse(
        "0",
        `${field.toUpperCase()} is required`,
        `Please provide a value for ${field.toUpperCase()}`,
        {}
      );
      return res.json(response);
    }
  }
  // new query
  const dd = await order.findOne({
    where: {
      id: orderId,
    },
  });
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
        {
          model: user,
          as: "customerId",
          attributes: ["deviceToken"],
        },
        {
          model: user,
          as: "DriverId",
          attributes: ["deviceToken"],
        },
        {
          model: orderCharge,
        },
        {
          model: restaurant,
          attributes: ["id"],
        },
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
    const response = ApiResponse("1", "Order Status changed", "", orderData);
    return res.json(response);
  } else {
    const response = ApiResponse("0", "Something went wrong", "Error", {});
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
  const requiredFields = ["restId", "mcId"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      const response = ApiResponse(
        "0",
        `${field.toUpperCase()} is required`,
        `Please provide a value for ${field.toUpperCase()}`,
        {}
      );
      return res.json(response);
    }
  }
  const exist = await R_MCLink.findOne({
    where: {
      menuCategoryId: mcId,
      restaurantId: restId,
    },
  });
  if (exist)
    throw new CustomException(
      "This menu category for the following restaurant already exists",
      "Please try again"
    );
  R_MCLink.create({
    menuCategoryId: mcId,
    restaurantId: restId,
  })
    .then((data) => {
      const response = ApiResponse(
        "1",
        "Menu Category Added to restaurant",
        "",
        {}
      );
      return res.json(response);
    })
    .catch((err) => {
      const response = ApiResponse(
        "1",
        "Failed to Menu Category to restaurant",
        "",
        {}
      );
      return res.json(response);
    });
}

async function assignCuisineToRest(req, res) {
  const { restId, cuisineId } = req.body;
  const requiredFields = ["restId", "cuisineId"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      const response = ApiResponse(
        "0",
        `${field.toUpperCase()} is required`,
        `Please provide a value for ${field.toUpperCase()}`,
        {}
      );
      return res.json(response);
    }
  }
  const exist = await R_CLink.findOne({
    where: {
      cuisineId: cuisineId,
      restaurantId: restId,
    },
  });
  if (exist) {
    const response = ApiResponse(
      "0",
      "This cuisine for the following restaurant already exists",
      "Please try again",
      {}
    );
    return res.json(response);
  }

  R_CLink.create({
    cuisineId: cuisineId,
    restaurantId: restId,
  })
    .then((data) => {
      const response = ApiResponse("1", "Cuisine Added to restaurant", "", {});
      return res.json(response);
    })
    .catch((err) => {
      const response = ApiResponse(
        "1",
        "Failed to cuisine to restaurant",
        "",
        {}
      );
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
    where: {
      restaurantId: restId,
      orderStatusId: 7,
    },
    include: [
      {
        model: orderCharge,
        attributes: ["restaurantEarnings"],
      },
      {
        model: wallet,
      },
    ],
    attributes: ["id", "total"],
  });
  const walletData = await wallet.findAll({
    where: {
      restaurantId: restId,
    },
    attributes: ["amount"],
  });
  const restaurantData = await restaurant.findByPk(restId, {
    include: {
      model: unit,
      as: "currencyUnitID",
      attributes: ["symbol"],
    },
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
  let data = {
    totalSales: totalSales.toFixed(2),
    totalSalesAfterCommission: totalSalesAfterCommission.toFixed(2),
    // reversing the symbol as +ve shows --> has to received & vice versa
    balance: -1 * balance.toFixed(2),
    unit: restaurantData.currencyUnitID.symbol,
  };
  const response = ApiResponse("1", "Earnings Data", "", data);
  return res.json(response);
}

/*
        2. Request for payout
*/
async function requestPayout(req, res) {
  const { amount, message, restId } = req.body;
  const requiredFields = ["amount", "message", "restId"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      const response = ApiResponse(
        "0",
        `${field.toUpperCase()} is required`,
        `Please provide a value for ${field.toUpperCase()}`,
        {}
      );
      return res.json(response);
    }
  }
  const restaurantData = await restaurant.findByPk(restId, {
    include: {
      model: unit,
      as: "currencyUnitID",
      attributes: ["id", "symbol"],
    },
    attributes: ["currencyUnitId"],
  });
  // TODO Change the minimum payout to dynamic value
  if (amount < 150) {
    const response = ApiResponse(
      "0",
      "Request cannot be processed",
      `Minimum payout amount is ${restaurantData.currencyUnitID.symbol}150`,
      {}
    );
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
      const response = ApiResponse("1", "Payout request generated", "", {});
      return res.json(response);
    });
}
/*
        3. get all payout requests
*/
async function getAllPayoutsByRestId(req, res) {
  const restId = req.params.id;
  const allPayouts = await payout.findAll({
    where: {
      restaurantId: restId,
    },
    include: {
      model: unit,
      attributes: ["symbol"],
    },
    attributes: [
      "id",
      "amount",
      "status",
      "transactionId",
      "message",
      "createdAt",
    ],
  });
  const response = ApiResponse("1", "Payout request generated", "", allPayouts);
  return res.json(response);
}

//Module 5 - DashBoard
/*
    1. Dash Board stats & bar graph
*/
async function dashBoardStats(req, res) {
  const userId = req.params.id;
  const allData = await restaurant.findAll({
    where: {
      userId,
    },
    include: [
      {
        model: order,
        attributes: ["id", "status", "total", "orderStatusId"],
      },
      {
        model: unit,
        as: "currencyUnitID",
        attributes: ["symbol"],
      },
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
    unit: allData[0].currencyUnitID ? allData[0].currencyUnitID.symbol : "N/A",
  };
  const response = ApiResponse("1", "Dashboard Status", "", data);
  return res.json(response);
}
async function tablebookings(req, res) {
  const userId = req.params.id;
  restaurant
    .findOne({
      where: {
        userId,
      },
    })
    .then((restdata) => {
      const restaurantId = restdata.id;
      tableBooking
        .findAll({
          where: {
            restaurantId,
          },
        })
        .then((data) => {
          const response = ApiResponse(
            "1",
            "Table Booking for the Restaurant",
            "",
            data
          );
          return res.json(response);
        });
    });
}
async function accepttablebooking(req, res) {
  const id = req.params.id;
  tableBooking
    .update(
      {
        status: true,
      },
      {
        where: {
          id,
        },
      }
    )
    .then((data) => {
      const response = ApiResponse(
        "1",
        "Table Booing for the Restaurant",
        "",
        data
      );
      return res.json(response);
    });
}
async function rejecttablebooking(req, res) {
  const id = req.params.id;
  tableBooking
    .update(
      {
        status: false,
      },
      {
        where: {
          id,
        },
      }
    )
    .then((data) => {
      const response = ApiResponse(
        "1",
        "Table Booking for the Restaurant",
        "",
        data
      );
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
    where: {
      userId,
    },
    include: [
      {
        model: order,
        where: {
          orderStatusId: 7,
        },
        attributes: ["id", "scheduleDate", "total", "orderStatusId"],
      },
      {
        model: unit,
        as: "currencyUnitID",
        attributes: ["symbol"],
      },
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
  const data = {
    earnWithMonths,
    outMonths,
    unit: allData,
  };
  const response = ApiResponse("1", "Earning of previous years", "", data);
  return res.json(response);
}

async function updateAddOnCategory(req, res) {
  const {
    id,
    name,
    // maxAllowed,
    // minAllowed
  } = req.body;
  const check = await collection.findOne({
    where: {
      id: id,
    },
  });
  if (check) {
    check.title = name;
    check
      .save()
      .then(async (dd) => {
        const response = ApiResponse("1", "updated successfully!", "", {});
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "", {});
        return res.json(response);
      });
  } else {
    const response = ApiResponse("0", "Not found!", "", {});
    return res.json(response);
  }
}

async function updateUserProfile(req, res) {
  const { firstName, lastName, email, countryCode, phoneNum } = req.body;
  const data = await user.findOne({
    where: {
      id: req.user.id,
    },
  });
  if (data) {
    data.firstName = firstName;
    data.lastName = lastName;
    data.email = email;
    data.countryCode = countryCode;
    data.phoneNum = phoneNum;
    data
      .save()
      .then((dat) => {
        const response = ApiResponse("1", "Updated successfully", "", {});
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "", {});
        return res.json(response);
      });
  } else {
    const response = ApiResponse("0", "User not found!", "", {});
    return res.json(response);
  }
}

async function completedOrders(req, res) {
  const status = await orderStatus.findOne({
    where: {
      name: "Delivered",
    },
  });
  const cancelledStatus = await orderStatus.findOne({
    where: {
      name: "Cancelled",
    },
  });
  const type = await orderType.findOne({
    where: {
      type: "Normal",
    },
  });
  const orderData = await order.findAll({
    where: [
      {
        orderTypeId: type.id,
      },
      {
        restaurantId: req.params.restaurantId,
      },
      {
        orderStatusId: status.id,
      },
    ],
    include: [
      {
        model: orderCharge,
      },
      {
        model: user,
        attributes: ["id", "userName"],
      },
    ],
  });
  const cancelledOrder = await order.findAll({
    where: [
      {
        restaurantId: req.params.restaurantId,
      },
      {
        orderStatusId: cancelledStatus.id,
      },
    ],
    include: [
      {
        model: orderCharge,
      },
      {
        model: user,
        attributes: ["id", "userName"],
      },
    ],
  });
  const data = {
    completedOrder: orderData,
    cancelledOrder: cancelledOrder,
  };
  const response = ApiResponse("1", "Completed Order", "", data);
  return res.json(response);
}

async function activeOrders(req, res) {
  const { restaurantId } = req.params;
  const Accepted = await orderStatus.findOne({
    where: {
      name: "Accepted",
    },
  });
  const Preparing = await orderStatus.findOne({
    where: {
      name: "Preparing",
    },
  });
  const readyForDelivery = await orderStatus.findOne({
    where: {
      name: "Ready for delivery",
    },
  });
  const way = await orderStatus.findOne({
    where: {
      name: "On the way",
    },
  });
  const pickup = await orderStatus.findOne({
    where: {
      name: "Food Pickedup",
    },
  });
  const AcceptedByDriver = await orderStatus.findOne({
    where: {
      name: "Accepted by Driver",
    },
  });
  let status_list = [
    Accepted.id,
    Preparing.id,
    readyForDelivery.id,
    way.id,
    pickup.id,
    AcceptedByDriver.id,
  ];

  const orderData = await order.findAll({
    where: {
      restaurantId: restaurantId,
      orderStatusId: {
        [sequelize.Op.in]: status_list,
      },
    },
    include: [
      {
        model: orderCharge,
      },
      {
        model: user,
        attributes: ["id", "userName", "email", "countryCode", "phoneNum"],
      },
      {
        model: orderStatus,
      },
    ],
  });
  const response = ApiResponse("1", "Active Orders", "", orderData);
  return res.json(response);
}

async function getRating(req, res) {
  const ratings = await restaurantRating.findAll({
    where: {
      restaurantId: req.params.restaurantId,
    },
    include: [
      {
        model: order,
        attributes: ["orderNum"],
      },
      {
        model: user,
        attributes: ["id", "userName", "firstName", "lastName"],
      },
    ],
  });

  const averageRating = await restaurantRating.findAll({
    attributes: [
      [sequelize.fn("AVG", sequelize.col("value")), "averageRating"],
    ],
    where: {
      restaurantId: req.params.restaurantId,
    },
  });
  const data = {
    averageRating: Number(averageRating[0]?.dataValues?.averageRating).toFixed(
      2
    ),
    ratings: ratings,
  };
  const response = ApiResponse("1", "Rating", "", data);
  return res.json(response);
}

async function acceptBookTableRequest(req, res) {
  const { tableBookingId } = req.body;
  try {
    const status = await orderStatus.findOne({
      where: {
        name: "Accepted",
      },
    });
    const table = await tableBooking.findOne({
      where: {
        id: tableBookingId,
      },
      include: [
        {
          model: restaurant,
          attributes: ["id", "businessName"],
        },
        {
          model: user,
          attributes: ["id", "deviceToken"],
        },
      ],
    });
    if (table) {
      table.orderStatusId = status.id;
      table
        .save()
        .then((dat) => {
          singleNotification(
            table?.user?.deviceToken,
            "Accept Request",
            `Your Request for Table booking is accepted by ${table?.restaurant?.businessName} restaurant`
          );
          const response = ApiResponse("1", "Accepted Request", "", {});
          return res.json(response);
        })
        .catch((error) => {
          const response = ApiResponse("0", error.message, "Error", {});
          return res.json(response);
        });
    } else {
      const response = ApiResponse("0", "Not found", "Error", {});
      return res.json(response);
    }
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}
async function rejectBookTableRequest(req, res) {
  const { tableBookingId } = req.body;
  try {
    const status = await orderStatus.findOne({
      where: {
        name: "Cancelled",
      },
    });
    const table = await tableBooking.findOne({
      where: {
        id: tableBookingId,
      },
      include: [
        {
          model: restaurant,
          attributes: ["id", "businessName"],
        },
        {
          model: user,
          attributes: ["id", "deviceToken"],
        },
      ],
    });
    if (table) {
      table.orderStatusId = status.id;
      table
        .save()
        .then((dat) => {
          singleNotification(
            table?.user?.deviceToken,
            "Cancelled Request",
            `Your Request for Table booking is Cancelled by ${table?.restaurant?.businessName} restaurant`
          );
          const response = ApiResponse("1", "Cancelled Request", "", {});
          return res.json(response);
        })
        .catch((error) => {
          const response = ApiResponse("0", error.message, "Error", {});
          return res.json(response);
        });
    }
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

async function getTableBookings(req, res) {
  const placed = await orderStatus.findOne({
    where: {
      name: "Placed",
    },
  });
  const Accepted = await orderStatus.findOne({
    where: {
      name: "Accepted",
    },
  });
  const Cancelled = await orderStatus.findOne({
    where: {
      name: "Cancelled",
    },
  });
  const Delivered = await orderStatus.findOne({
    where: {
      name: "Delivered",
    },
  });
  const placedOrders = await tableBooking.findAll({
    where: {
      restaurantId: req.body.restaurantId,
      orderStatusId: {
        [sequelize.Op.in]: [Accepted.id],
      },
    },
    include: [
      {
        model: user,
        attributes: ["id", "userName"],
      },
    ],
  });
  const acceptedOrders = await tableBooking.findAll({
    where: {
      restaurantId: req.body.restaurantId,
      orderStatusId: {
        [sequelize.Op.in]: [Delivered.id, , Cancelled.id],
      },
    },
    include: [
      {
        model: orderStatus,
        attributes: ["name"],
      },
      {
        model: user,
        attributes: ["id", "userName"],
      },
    ],
  });
  const data = {
    activeBookings: placedOrders,
    completedBookings: acceptedOrders,
  };
  const response = ApiResponse("1", "Restaurant Table Bookings", "", data);
  return res.json(response);
}

async function addDriver(req, res) {
  const {
    firstName,
    lastName,
    email,
    countryCode,
    phoneNum,
    password,
    restaurantId,
  } = req.body;
  // return res.json(req.body)
  try {
    const dd = await user.findOne({
      where: {
        email: email,
      },
    });
    if (dd) {
      const response = ApiResponse("0", "Email already taken", "", {});
      return res.json(response);
    }
    const phoneCheck = await user.findOne({
      where: [
        {
          countryCode,
        },
        {
          phoneNum: phoneNum,
        },
      ],
    });
    if (phoneCheck) {
      const response = ApiResponse("0", "phone No already taken", "", {});
      return res.json(response);
    }

    let tmpPath = req.file.path;
    let path = tmpPath.replace(/\\/g, "/");

    const driverTypeStatus = await userType.findOne({
      where: {
        name: "Driver",
      },
    });
    const newDriver = new user();
    newDriver.firstName = firstName;
    newDriver.lastName = lastName;
    newDriver.email = email;
    newDriver.countryCode = countryCode;
    newDriver.verifiedAt = Date.now();
    newDriver.phoneNum = phoneNum;
    newDriver.userTypeId = driverTypeStatus.id;
    newDriver.phoneNum = "Restaurant";
    newDriver.status = 1;
    newDriver.password = await bcrypt.hash(password, 10);
    newDriver
      .save()
      .then(async (dat) => {
        const service_type = await serviceType.findOne({
          where: {
            name: "Food delivery",
          },
        });

        const details = new driverDetails();
        details.profilePhoto = path;
        details.serviceTypeId = service_type.id;
        details.userId = dat.id;
        details.status = true;
        await details.save();

        const restDriver = new restaurantDriver();
        restDriver.restaurantId = restaurantId;
        restDriver.userId = dat.id;
        restDriver.status = true;
        await restDriver.save();

        const response = ApiResponse("1", "Driver added successfully", "", {
          driverId: newDriver.id,
        });
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
      });
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

async function addDriverZone(req, res) {
  const { countryId, cityId, zoneId, language, driverId } = req.body;
  const zz = new driverZone();
  zz.countryId = countryId;
  zz.cityId = cityId;
  zz.language = language;
  zz.userId = driverId;
  zz.status = 1;
  zz.zoneId = zoneId;
  zz.save()
    .then((dat) => {
      //   return res.json(dat)
      const response = ApiResponse("1", "Zone added successfully", "", {});
      return res.json(response);
    })
    .catch((error) => {
      const response = ApiResponse("0", error.message, "Error", {});
      return res.json(response);
    });
}

async function getData(req, res) {
  const zonesData = await zone.findAll({
    where: {
      status: true,
    },
    attributes: ["id", "name"],
  });
  const countries = await country.findAll({
    where: {
      status: true,
    },
    include: {
      model: city,
      where: {
        status: true,
      },
    },
  });
  const data = {
    zones: zonesData,
    countries,
  };
  const response = ApiResponse("1", "Data", "", data);
  return res.json(response);
}

async function getVehicleType(req, res) {
  const types = await vehicleType.findAll({
    where: {
      status: true,
    },
  });
  let data = {
    types,
  };
  const response = ApiResponse("1", "Data", "", data);
  return res.json(response);
}

async function addDriverLicense(req, res) {
  const { licFrontPhoto, licBackPhoto } = req.files;
  const { licIssueDate, licExpiryDate, licNum, driverId } = req.body;
  // return res.json(req.body)
  const check = await driverDetails.findOne({
    where: [
      {
        userId: driverId,
      },
      {
        status: true,
      },
    ],
  });
  if (check) {
    if (licFrontPhoto) {
      let licFrontPhotoTmp = licFrontPhoto[0].path;
      let licFrontPhotoPath = licFrontPhotoTmp.replace(/\\/g, "/");
      check.licFrontPhoto = licFrontPhotoPath;
    }
    if (licBackPhoto) {
      let licBackPhotoTmp = licBackPhoto[0].path;
      let licBackPhotoPath = licBackPhotoTmp.replace(/\\/g, "/");
      check.licBackPhoto = licBackPhotoPath;
    }
    check.licIssueDate = licIssueDate;
    check.licExpiryDate = licExpiryDate;
    check.licNum = licNum;
    check.userId = driverId;
    check.status = true;
    check
      .save()
      .then((dat) => {
        const response = ApiResponse("1", "License Added successfully", "", {});
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
      });
  } else {
    const newDetails = new driverDetails();
    if (licFrontPhoto) {
      let licFrontPhotoTmp = licFrontPhoto[0].path;
      let licFrontPhotoPath = licFrontPhotoTmp.replace(/\\/g, "/");
      newDetails.licFrontPhoto = licFrontPhotoPath;
    }
    if (licBackPhoto) {
      let licBackPhotoTmp = licBackPhoto[0].path;
      let licBackPhotoPath = licBackPhotoTmp.replace(/\\/g, "/");
      newDetails.licBackPhoto = licBackPhotoPath;
    }
    newDetails.licIssueDate = licIssueDate;
    newDetails.licExpiryDate = licExpiryDate;
    newDetails.licNum = licNum;
    newDetails.userId = driverId;
    newDetails.status = true;
    newDetails
      .save()
      .then((dat) => {
        const response = ApiResponse("1", "License Added successfully", "", {});
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
      });
  }
}

async function addDriverAddress(req, res) {
  const { streetAddress, building, city, state, zipCode, lat, lng, driverId } =
    req.body;

  const check = await address.findOne({
    where: [
      {
        lat: lat,
      },
      {
        lng: lng,
      },
      {
        userId: driverId,
      },
      {
        status: true,
      },
    ],
  });
  if (check) {
    check.streetAddress = streetAddress;
    check.building = building;
    check.city = city;
    check.state = state;
    check.zipCode = zipCode;
    check
      .save()
      .then((dat) => {
        const response = ApiResponse("1", "Address Added successfully", "", {});
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
      });
  } else {
    const dd = new address();
    dd.streetAddress = streetAddress;
    dd.building = building;
    dd.city = city;
    dd.state = state;
    dd.zipCode = zipCode;
    dd.lat = lat;
    dd.lng = lng;
    dd.userId = driverId;
    dd.status = true;
    dd.save()
      .then((dat) => {
        const response = ApiResponse("1", "Address Added successfully", "", {});
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
      });
  }
}

async function addVehicleDetails(req, res) {
  const { make, model, year, registrationNum, color, driverId, vehicleTypeId } =
    req.body;

  const frontimage = req.files["front"];
  let fronttmpPath = frontimage[0].path;
  let frontimagePath = fronttmpPath.replace(/\\/g, "/");

  const backimage = req.files["back"];
  let backtmpPath = backimage[0].path;
  let backimagePath = backtmpPath.replace(/\\/g, "/");

  const leftimage = req.files["left"];
  let lefttmpPath = leftimage[0].path;
  let leftimagePath = lefttmpPath.replace(/\\/g, "/");

  const rightimage = req.files["right"];
  let righttmpPath = rightimage[0].path;
  let rightimagePath = righttmpPath.replace(/\\/g, "/");

  const docfrontimage = req.files["document_front"];
  let docfronttmpPath = docfrontimage[0].path;
  let docfrontimagePath = docfronttmpPath.replace(/\\/g, "/");

  const docbackimage = req.files["document_back"];
  let docbacktmpPath = docbackimage[0].path;
  let docbackimagePath = docbacktmpPath.replace(/\\/g, "/");

  const detail = await vehicleDetails.findOne({
    where: [
      {
        userId: driverId,
      },
      {
        status: true,
      },
    ],
  });
  if (detail) {
    vehicleImages.update(
      {
        image: frontimagePath,
        uploadTime: Date.now(),
        status: true,
      },
      {
        where: [
          {
            vehicleDetailId: detail.id,
          },
          {
            name: "front",
          },
        ],
      }
    );
    vehicleImages.update(
      {
        name: "back",
        image: backimagePath,
        uploadTime: Date.now(),
        status: true,
      },
      {
        where: [
          {
            vehicleDetailId: detail.id,
          },
          {
            name: "back",
          },
        ],
      }
    );
    vehicleImages.update(
      {
        name: "left",
        image: leftimagePath,
        uploadTime: Date.now(),
        status: true,
      },
      {
        where: [
          {
            vehicleDetailId: detail.id,
          },
          {
            name: "left",
          },
        ],
      }
    );
    vehicleImages.update(
      {
        name: "right",
        image: rightimagePath,
        uploadTime: Date.now(),
        status: true,
      },
      {
        where: [
          {
            vehicleDetailId: detail.id,
          },
          {
            name: "right",
          },
        ],
      }
    );
    vehicleImages.update(
      {
        name: "document front",
        image: docfrontimagePath,
        uploadTime: Date.now(),
        status: true,
      },
      {
        where: [
          {
            vehicleDetailId: detail.id,
          },
          {
            name: "document front",
          },
        ],
      }
    );
    vehicleImages.update(
      {
        name: "document back",
        image: docbackimagePath,
        uploadTime: Date.now(),
        status: true,
      },
      {
        where: [
          {
            vehicleDetailId: detail.id,
          },
          {
            name: "document back",
          },
        ],
      }
    );
    const response = ApiResponse(
      "1",
      "Vehicle Details Added successfully",
      "",
      {}
    );
    return res.json(response);
  } else {
    const dd = new vehicleDetails();
    dd.model = model;
    dd.make = make;
    dd.year = year;
    dd.registrationNum = registrationNum;
    dd.color = color;
    dd.vehicleTypeId = vehicleTypeId;
    dd.userId = driverId;
    dd.status = true;
    dd.save()
      .then(async (dat) => {
        const front = new vehicleImages();
        front.name = "front";
        front.image = frontimagePath;
        front.status = true;
        front.uploadTime = Date.now();
        front.vehicleDetailId = dat.id;
        await front.save();

        const back = new vehicleImages();
        back.name = "back";
        back.image = backimagePath;
        back.status = true;
        back.uploadTime = Date.now();
        back.vehicleDetailId = dat.id;
        await back.save();

        const left = new vehicleImages();
        left.name = "left";
        left.image = leftimagePath;
        left.status = true;
        left.uploadTime = Date.now();
        left.vehicleDetailId = dat.id;
        await left.save();

        const rightside = new vehicleImages();
        rightside.name = "right";
        rightside.image = rightimagePath;
        rightside.status = true;
        rightside.uploadTime = Date.now();
        rightside.vehicleDetailId = dat.id;
        await rightside.save();

        const right = new vehicleImages();
        right.name = "right";
        right.image = rightimagePath;
        right.status = true;
        right.uploadTime = Date.now();
        right.vehicleDetailId = dat.id;
        await right.save();

        const db = new vehicleImages();
        db.name = "document back";
        db.image = docbackimagePath;
        db.status = true;
        db.uploadTime = Date.now();
        db.vehicleDetailId = dat.id;
        await db.save();

        const df = new vehicleImages();
        df.name = "document front";
        df.image = docfrontimagePath;
        df.status = true;
        df.uploadTime = Date.now();
        df.vehicleDetailId = dat.id;
        await df.save();

        const response = ApiResponse(
          "1",
          "Vehicle Details Added successfully",
          "",
          {}
        );
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
      });
  }
}

async function getProductById(req, res) {
  const { rpId } = req.body;
  try {
    const productData = await R_PLink.findOne({
      where: {
        id: rpId,
      },
      include: [
        {
          model: productCollections,
          attributes: ["id"],
          include: {
            model: collection,
            attributes: ["id", "title"],
            include: {
              model: collectionAddons,
              attributes: [
                "id",
                "maxAllowed",
                "minAllowed",
                "isPaid",
                "isAvaiable",
                "price",
              ],
              include: {
                model: addOn,
                attributes: ["id", "name"],
              },
            },
          },
        },
      ],
    });

    let rr = ApiResponse("1", "Product Data", "", productData);
    return res.json(rr);
    let currencySign = productData.R_MCLink.restaurant.currencyUnitID.symbol;
    let addOnArr = [];
    let list = [];
    productData.P_AOLinks.map((ao, idx) => {
      let category = {
        name: ao.addOnCategory.name,
        id: ao.addOnCategory.id,
      };

      // Check if the category already exists in addOnArr
      let existingCategoryIndex = addOnArr.findIndex(
        (item) => item.addonCategory.name === category.name
      );
      if (existingCategoryIndex !== -1) {
        // If category already exists, append addons to the existing category
        let aoArr = [];
        ao.P_A_ACLinks.map((a, idx) => {
          let obj = {
            PAACLinkId: a.id,
            name: a.addOn.name,
            currencySign: `${currencySign}`,
            price: `${a.price}`,
          };
          aoArr.push(obj);
        });

        // Append addons to the existing category
        addOnArr[existingCategoryIndex].addonList.push(...aoArr);
      } else {
        // If category doesn't exist, create a new category
        let aoArr = [];
        ao.P_A_ACLinks.map((a, idx) => {
          let obj = {
            PAACLinkId: a.id,
            name: a.addOn.name,
            currencySign: `${currencySign}`,
            price: `${a.price}`,
          };
          aoArr.push(obj);
        });

        list.push({
          addonCategory: category,
          addonList: aoArr,
        });

        let tmpObj = {
          addonCategory: category,
          addonList: aoArr,
        };
        addOnArr.push(tmpObj);
      }
    });

    // return res.json(list)
    let retObj = {
      RPLinkId: productData.id,
      image: productData.image,
      name: productData.name,
      description: productData.description,
      currencySign: `${currencySign}`,
      originalPrice: `${productData.originalPrice}`,
      discountPrice: `${productData.discountPrice} `,
      addOnArr: list,
    };
    const response = ApiResponse("1", "Product Details", "", retObj);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

async function inDeliverOrders(req, res) {
  const status = await orderStatus.findOne({
    where: {
      name: "Food Pickedup",
    },
  });
  const restData = await restaurant.findOne({
    where: {
      userId: req.user.id,
    },
  });
  const orders = await order.findAll({
    where: [
      {
        orderStatusId: status.id,
      },
      {
        restaurantId: restData.id,
      },
    ],
    include: [
      {
        model: user,
        attributes: ["id", "userName", "firstName", "lastName", "email"],
      },
      {
        model: address,
        as: "dropOffID",
      },
    ],
  });
  const fireBaseData = await axios.get(process.env.FIREBASE_URL);
  let list = [];
  for (var i = 0; i < orders.length; i++) {
    let driverData = fireBaseData?.data[orders[i]?.driverId];
    const etaText = await eta_text(
      driverData?.lat,
      driverData?.lng,
      orders[i]?.dropOffID?.lat,
      orders[i]?.dropOffID?.lng
    );
    let obj = {
      id: orders[i].id,
      orderNum: orders[i].orderNum,
      scheduleDate: orders[i].scheduleDate,
      distance: orders[i].distance,
      subTotal: orders[i].subTotal,
      user: orders[i].user,
      deliveryTime: etaText ? etaText : "10 mints",
    };
    list.push(obj);
  }
  let data = {
    orders: list,
  };
  const response = ApiResponse("1", "In Deliver Orders", "", data);
  return res.json(response);
}

async function sendNotificationToFreelanceDriver(req, res) {
  const { restaurantId, orderId } = req.params;
  const type = await userType.findOne({
    where: {
      name: "Driver",
    },
  });
  const getZone = await zoneRestaurants.findOne({
    where: {
      restaurantId: restaurantId,
    },
    include: {
      model: zone,
    },
  });
  const zoneDrivers = await driverZone.findAll({
    where: {
      zoneId: getZone?.zone?.id,
    },
    include: {
      model: user,
      where: [
        {
          driverType: "Freelancer",
        },
        {
          userTypeId: type.id,
        },
      ],
    },
  });
  // return res.json(zoneDrivers)

  const fireBase = await axios.get(process.env.FIREBASE_URL);
  let list = [];
  zoneDrivers.map((driver) => {
    if (fireBase) {
      if (fireBase.data[driver.user.id]) {
        list.push(driver?.user?.deviceToken);
      }
    }
  });

  const orderData = await order.findOne({
    where: {
      id: orderId,
    },
    include: [
      {
        model: address,
        as: "dropOffID",
      },
      {
        model: restaurant,
      },
      {
        model: user,
        attributes: ["id", "deviceToken"],
      },
    ],
  });

  const estTime = await eta_text(
    orderData.restaurant.lat,
    orderData.restaurant.lng,
    orderData.dropOffID.lat,
    orderData.dropOffID.lng
  );

  let notiDAta = {
    orderId: orderData.id,
    restaurantName: orderData.restaurant.businessName,
    estEarning: "23.5",
    dropOffAddress: orderData.dropOffID.streetAddress,
    pickUpAddress: orderData?.restaurant?.address,
    orderApplication: orderData.businessType,
    distance: estTime,
    orderNum: orderData.orderNum,
    orderType: orderData.deliveryTypeId,
  };
  let notification = {
    title: "Driver Assigned",
    body: `New Order Request ID : ${orderId}`,
  };
  sendNotification(list, notification, notiDAta);

  const response = ApiResponse(
    "1",
    "Request send to all Freelancers Drivers",
    "",
    {}
  );
  return res.json(response);
}

async function openCloseRestaurant(req, res) {
  const { restaurantId } = req.body;
  const rest = await restaurant.findOne({
    where: {
      id: restaurantId,
    },
  });
  // return res.json(rest)
  if (rest) {
    rest.isOpen = rest.isOpen ? false : true;
    rest
      .save()
      .then((dat) => {
        let data = {
          isOpen: dat.isOpen ? true : false,
        };
        const response = ApiResponse(
          "1",
          rest.isOpen
            ? "Restaurant opened successfully"
            : "Restaurant closed successfully",
          "",
          data
        );
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
      });
  }
}

// RESTAURANT PANEL APIS

async function addProductStock(req, res) {
  const { restaurantId, RPLinkId, stock } = req.body;
  const requiredFields = ["restaurantId", "RPLinkId", "stock"];
  for (const field of requiredFields) {
    if (!req.body[field]) {
      const response = ApiResponse(
        "0",
        `${field} is required`,
        `Please provide a value for ${field}`,
        {}
      );
      return res.json(response);
    }
  }
  let dd = new productStock();
  dd.stock = stock;
  dd.currentStock = stock;
  dd.date = Date.now();
  dd.status = true;
  dd.restaurantId = restaurantId;
  dd.RPLinkId = RPLinkId;
  dd.save()
    .then((dat) => {
      let response = ApiResponse("1", "Stock added successfully", "", {});
      return res.json(response);
    })
    .catch((error) => {
      const response = ApiResponse("0", error.message, "Error", {});
      return res.json(response);
    });
}

async function analytics(req, res) {
  const { restaurantId } = req.params;
  const { from, to } = req.body;
  let cancelledStatus = await orderStatus.findOne({
    where: {
      name: "Cancelled",
    },
  });
  let DeliveredStatus = await orderStatus.findOne({
    where: {
      name: "Delivered",
    },
  });
  let type = await deliveryType.findOne({
    where: {
      name: "Delivery",
    },
  });
  let pickupType = await deliveryType.findOne({
    where: {
      name: "Self-Pickup",
    },
  });

  let today = new Date(); // Get today's date
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  let todayDayOfWeek = today.getDay(); // Get the day of the week for today
  let todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0); // Set time to midnight for today
  let currentDate = new Date(today);
  let previousWeekOrders = [];
  let weeklyOrderAmount = [];
  let weekTotalAmount = 0;
  let noOfOrdersInWeek = 0;
  let lossValue = 0;
  let weeklyLossValue = 0;

  if (from != "" && to != "") {
    today = new Date(req.body.to);

    todayMidnight = new Date(today);
    todayDayOfWeek = today.getDay();
    todayMidnight.setHours(0, 0, 0, 0);
    currentDate = new Date(today);
  }

  //  return res.json(today)
  for (let i = 0; i < 7; i++) {
    // Loop through each day of the week, 7 days in total
    currentDate.setDate(today.getDate() - 7 + i); // Adjusting the date for previous week
    const formattedDate = currentDate.toISOString().split("T")[0];

    const successOrders = await order.count({
      where: {
        restaurantId: restaurantId,
        orderStatusId: DeliveredStatus.id,
        createdAt: {
          [Op.gte]: currentDate, // Orders from current day
          [Op.lt]: new Date(currentDate.getTime() + 86400000), // Orders before next day
        },
      },
    });
    const orderCount = await order.count({
      where: {
        restaurantId: restaurantId,
        orderStatusId: {
          [Op.ne]: cancelledStatus.id, // OrderStatusId not equal to 3
        },
        createdAt: {
          [Op.gte]: currentDate, // Orders from current day
          [Op.lt]: new Date(currentDate.getTime() + 86400000), // Orders before next day
        },
      },
    });
    const cancelOrders = await order.count({
      where: {
        orderStatusId: cancelledStatus.id,
        restaurantId: restaurantId,
        createdAt: {
          [Op.gte]: currentDate, // Orders from current day
          [Op.lt]: new Date(currentDate.getTime() + 86400000), // Orders before next day
        },
      },
    });
    const restaurantEarnings = await order.count({
      where: {
        restaurantId: restaurantId,
        orderStatusId: DeliveredStatus.id,
        createdAt: {
          [Op.gte]: currentDate, // Orders from current day
          [Op.lt]: new Date(currentDate.getTime() + 86400000), // Orders before next day
        },
      },
    });
    // return res.json(restaurantEarnings)
    const restaurantDeliveryCharges = await order.sum(
      "orderCharge.restaurantDeliveryCharges",
      {
        where: {
          restaurantId: restaurantId,

          orderStatusId: DeliveredStatus.id,
          createdAt: {
            [Op.gte]: currentDate, // Orders from current day
            [Op.lt]: new Date(currentDate.getTime() + 86400000), // Orders before next day
          },
        },
        include: [
          {
            model: orderCharge,

            attributes: [],
          },
        ],
      }
    );

    const restaurantEarningsForCancelledOrders = await order.sum(
      "orderCharge.restaurantEarnings",
      {
        where: {
          restaurantId: restaurantId,
          orderStatusId: cancelledStatus.id,

          createdAt: {
            [Op.gte]: currentDate, // Orders from current day
            [Op.lt]: new Date(currentDate.getTime() + 86400000 + 1), // Orders before next day
          },
        },
        include: [
          {
            model: orderCharge,

            attributes: [],
          },
        ],
      }
    );
    const restaurantDeliveryChargesForCancelledOrders = await order.sum(
      "orderCharge.restaurantDeliveryCharges",
      {
        where: {
          restaurantId: restaurantId,
          orderStatusId: cancelledStatus.id,
          createdAt: {
            [Op.gte]: currentDate, // Orders from current day
            [Op.lt]: new Date(currentDate.getTime() + 86400000 + 1), // Orders before next day
          },
        },
        include: [
          {
            model: orderCharge,
            attributes: [],
          },
        ],
      }
    );
    lossValue =
      parseInt(restaurantDeliveryChargesForCancelledOrders) +
      parseInt(restaurantEarningsForCancelledOrders);

    weeklyOrderValue =
      parseInt(restaurantDeliveryCharges) + parseInt(restaurantEarnings);
    noOfOrdersInWeek = noOfOrdersInWeek + orderCount;
    weekTotalAmount =
      weekTotalAmount + (weeklyOrderValue ? weeklyOrderValue : 0);
    weeklyLossValue = weeklyLossValue + (lossValue ? lossValue : 0);
    // return res.json(weeklyOrderValue)
    previousWeekOrders.push({
      day: formattedDate,
      successOrders,
      cancelOrders,
    });
    weeklyOrderAmount.push({
      day: formattedDate,
      value: weeklyOrderValue ? weeklyOrderValue.toString() : "0",
      lossValue: lossValue ? lossValue.toString() : "0",
    });
  }
  const cancelOrders = await order.count({
    where: {
      orderStatusId: cancelledStatus.id,
      restaurantId: restaurantId,
      createdAt: {
        [Op.between]: [oneWeekAgo, today],
      },
    },
  });
  const totalOrders = await order.count({
    where: {
      restaurantId: restaurantId,
      createdAt: {
        [Op.between]: [oneWeekAgo, today],
      },
    },
  });
  const orderCount = await order.count({
    where: {
      restaurantId: restaurantId,
      orderStatusId: {
        [Op.ne]: cancelledStatus.id, // OrderStatusId not equal to 3
      },
      createdAt: {
        [Op.gte]: currentDate, // Orders from current day
        [Op.lt]: new Date(currentDate.getTime() + 86400000), // Orders before next day
      },
    },
  });
  const successOrders = await order.count({
    where: {
      restaurantId: restaurantId,
      orderStatusId: DeliveredStatus.id,
      createdAt: {
        [Op.between]: [oneWeekAgo, today],
      },
    },
  });

  const deliveryTypeOrders = await order.count({
    where: [
      {
        restaurantId: restaurantId,
      },
      {
        deliveryTypeId: type.id,
      },
    ],
  });
  const pickupTypeOrders = await order.count({
    where: [
      {
        restaurantId: restaurantId,
      },
      {
        deliveryTypeId: pickupType.id,
      },
    ],
  });

  let uniqueDates = {};
  let uniqueWeeklyOrders = {};
  uniqueDates = previousWeekOrders.filter((item) => {
    if (!uniqueDates[item.day]) {
      uniqueDates[item.day] = true;
      return true;
    }
    return false;
  });
  uniqueWeeklyOrders = weeklyOrderAmount.filter((item) => {
    if (!uniqueWeeklyOrders[item.day]) {
      uniqueWeeklyOrders[item.day] = true;
      return true;
    }
    return false;
  });

  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14); // Date for two weeks ago
  const threeWeeksAgo = new Date(today);
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21); // Date for three weeks ago

  const previousWeektotalAmount = await order.sum("total", {
    where: {
      restaurantId: restaurantId,
      orderStatusId: DeliveredStatus.id,
      createdAt: {
        [Op.between]: [threeWeeksAgo, twoWeeksAgo], // Using Sequelize's between operator
      },
    },
  });
  const previousWeekrestaurantDeliveryCharges = await order.sum(
    "orderCharge.restaurantDeliveryCharges",
    {
      where: {
        restaurantId: restaurantId,

        orderStatusId: DeliveredStatus.id,
        createdAt: {
          [Op.between]: [threeWeeksAgo, twoWeeksAgo], // Using Sequelize's between operator
        },
      },
      include: [
        {
          model: orderCharge,

          attributes: [],
        },
      ],
    }
  );
  const previousWeekrestaurantEarnings = await order.sum(
    "orderCharge.restaurantEarnings",
    {
      where: {
        restaurantId: restaurantId,
        orderStatusId: DeliveredStatus.id,
        createdAt: {
          [Op.between]: [threeWeeksAgo, twoWeeksAgo], // Using Sequelize's between operator
        },
      },
      include: [
        {
          model: orderCharge,

          attributes: [],
        },
      ],
    }
  );
  const previousWeekcancelOrders = await order.count({
    where: {
      orderStatusId: cancelledStatus.id,
      restaurantId: restaurantId,
      createdAt: {
        [Op.between]: [threeWeeksAgo, twoWeeksAgo],
      },
    },
  });

  const totalAmount = await order.sum("total", {
    where: {
      restaurantId: restaurantId,
      orderStatusId: DeliveredStatus.id,
      createdAt: {
        [Op.between]: [oneWeekAgo, today],
      },
    },
  });
  const restaurantDeliveryCharges = await order.sum(
    "orderCharge.restaurantDeliveryCharges",
    {
      where: {
        restaurantId: restaurantId,

        orderStatusId: DeliveredStatus.id,
        createdAt: {
          [Op.between]: [oneWeekAgo, today],
        },
      },
      include: [
        {
          model: orderCharge,

          attributes: [],
        },
      ],
    }
  );
  const restaurantEarnings = await order.sum("orderCharge.restaurantEarnings", {
    where: {
      restaurantId: restaurantId,
      orderStatusId: DeliveredStatus.id,
      createdAt: {
        [Op.between]: [oneWeekAgo, today],
      },
    },
    include: [
      {
        model: orderCharge,

        attributes: [],
      },
    ],
  });

  let weeklyTotalAmount = Number(
    restaurantEarnings + restaurantDeliveryCharges
  ).toFixed(1);
  let previousWeekTotalAmount = Number(
    previousWeekrestaurantDeliveryCharges + previousWeekrestaurantEarnings
  ).toFixed(1);
  let percentage =
    ((parseFloat(weeklyTotalAmount) - parseFloat(previousWeekTotalAmount)) /
      parseFloat(previousWeekTotalAmount)) *
    100;

  let totalAmountPercentage =
    ((parseFloat(totalAmount) - parseFloat(previousWeektotalAmount)) /
      parseFloat(previousWeektotalAmount)) *
    100;
  let cancelOrderPercentage =
    ((parseFloat(cancelOrders) - parseFloat(previousWeekcancelOrders)) /
      parseFloat(previousWeekcancelOrders)) *
    100;
  let data = {
    totalAmountPercentage:
      parseInt(previousWeektotalAmount) > 0 ? totalAmountPercentage : 100,
    cancelOrderPercentage:
      previousWeekcancelOrders > 0 ? cancelOrderPercentage : 100,
    weekPercentage: parseInt(previousWeekTotalAmount) > 0 ? percentage : 100,
    cancelledOrders: cancelOrders.toString(),
    totalOrders: successOrders.toString(),
    successOrders: successOrders.toString(),
    totalAmount: Number(totalAmount).toFixed(1).toString(),

    deliveryTypeOrdersPercentage: Number(
      (deliveryTypeOrders * 100) / totalOrders
    ).toFixed(1),
    pickupTypeOrdersPercentage:
      pickupTypeOrders > 0
        ? Number((pickupTypeOrders * 100) / totalOrders)
            .toFixed(1)
            .toString()
        : "0",
    weekTotalAmount: weeklyTotalAmount,

    weeklyLossValue: weeklyLossValue.toString(),
    weeklyAverageValue:
      successOrders > 0
        ? Number(
            (restaurantDeliveryCharges + restaurantEarnings) / successOrders
          )
            .toFixed(1)
            .toString()
        : "0",
    previousWeekOrders: uniqueDates,
    weeklyOrderAmount: uniqueWeeklyOrders,
  };
  let response = ApiResponse("1", "Analytics Data", "", data);
  return res.json(response);
}

async function hourlyInsight(req, res) {
  const { restaurantId } = req.params;
  const { date } = req.body;
  let today = new Date(date); // Current date
  today.setHours(0, 0, 0, 0); // Set time to the beginning of the day

  const cancelledStatus = await orderStatus.findOne({
    where: {
      name: "Cancelled",
    },
  });

  let weeklyData = [];

  // Loop through each day of the previous week
  for (let i = 0; i < 7; i++) {
    let startDate = new Date(today);
    startDate.setDate(today.getDate() - i); // Subtract 'i' days to get previous days

    let endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999); // Set time to the end of the day

    let orderData = await order.findAll({
      include: {
        model: orderCharge,
      },
      where: {
        orderStatusId: {
          [Op.ne]: cancelledStatus.id, // OrderStatusId not equal to 3
        },
        restaurantId: restaurantId,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    let hourlyOrderData = {};

    // Initialize hourlyOrderData
    for (let hour = 0; hour < 24; hour++) {
      hourlyOrderData[hour] = {
        totalOrders: 0,
        totalAmount: 0,
      };
    }

    // Calculate total orders and amount for each hour
    orderData.forEach((order) => {
      let hour = new Date(order.createdAt).getHours();
      hourlyOrderData[hour].totalOrders++;
      hourlyOrderData[hour].totalAmount +=
        parseFloat(order?.orderCharge?.restaurantEarnings) +
        parseFloat(order?.orderCharge?.restaurantDeliveryCharges);
    });

    // Push hourly data to weeklyData
    weeklyData.push({
      date: startDate.toDateString(),
      hourlyData: Object.keys(hourlyOrderData).map((hour) => ({
        hour: hour.toString(),
        totalOrders: hourlyOrderData[hour].totalOrders.toString(),
        totalAmount: hourlyOrderData[hour]?.totalAmount?.toFixed(2),
      })),
    });
  }

  let data = {
    data: weeklyData,
  };
  let respp = ApiResponse("1", "Hourly Insight", "", data);
  return res.json(respp);
}

async function completeTableBooking(req, res) {
  const { id, status } = req.body;
  const statusId = await orderStatus.findOne({
    where: {
      name: status,
    },
  });
  if (status) {
    let orderData = await tableBooking.findOne({
      where: {
        id: id,
      },
      include: {
        model: user,
      },
    });
    if (orderData) {
      orderData.orderStatusId = statusId.id;
      orderData
        .save()
        .then((dat) => {
          singleNotification(
            orderData?.user?.deviceToken,
            "Order Status Changed",
            `Table Booking ID : ${id} status has been changed to ${status}!`,
            {}
          );
          let response = ApiResponse(
            "1",
            `Table Booking ID : ${id} status has been changed to ${status}!`,
            "",
            {}
          );
          return res.json(response);
        })
        .catch((error) => {
          let response = ApiResponse("0", error.message, "Error", {});
          return res.json(response);
        });
    } else {
      let response = ApiResponse("0", "Order not found!", "Error", {});
      return res.json(response);
    }
  } else {
    let response = ApiResponse("0", "Status not found!", "", {});
    return res.json(response);
  }
}

async function menuPerformance(req, res) {
  const { restaurantId } = req.params;
  const { from, to } = req.body;
  fromDate = from;
  toDate = to;
  let rmcData = await R_MCLink.findAll({
    where: {
      status: true,
      restaurantId: restaurantId,
    },
    include: {
      model: R_PLink,
    },
  });

  let totalRPLinks = 0;
  let totalRPLinksWithImage = 0;
  let productWithDescriptions = 0;

  const orders = await order.findAll({
    where: {
      restaurantId: restaurantId,
      createdAt: {
        [Op.between]: [fromDate, toDate],
      },
    },
    attributes: ["total"],
    include: { model: address, as: "dropOffID", attributes: ["id", "zipCode"] },
  });

  const result = {};

  orders.forEach((order) => {
    const zipCode = order.dropOffID.zipCode;
    let total = parseFloat(order.total); // Change const to let to allow reassignment

    // If zip code exists in the result object, update count and sum total
    if (result[zipCode]) {
      result[zipCode].zipCode = zipCode;
      result[zipCode].count++;
      result[zipCode].totalSum += total;
    } else {
      // If zip code doesn't exist, initialize count and total sum
      result[zipCode] = { count: 1, totalSum: total };
    }
  });

  // Convert the result object to an array of objects
  const resultArray = Object.keys(result).map((zipCode) => ({
    zipCode: zipCode,
    count: result[zipCode].count.toString(),
    totalSum: result[zipCode].totalSum.toFixed(2), // Format total sum to two decimal places
    averageTotal: Number(
      parseInt(result[zipCode].totalSum) / parseInt(result[zipCode].count)
    )
      .toFixed(1)
      .toString(), // Fix typo in property name and calculate average correctly
  }));

  let itemList = [];

  for (const rmc of rmcData) {
    totalRPLinks += rmc.R_PLinks.length;
    totalRPLinksWithImage += rmc.R_PLinks.filter(
      (link) => link.image !== null
    ).length;
    productWithDescriptions += rmc.R_PLinks.filter(
      (link) => link.description !== null
    ).length;
    if (rmc.R_PLinks.length > 0) {
      for (const rp of rmc?.R_PLinks) {
        // return res.json(rp)
        let items = await orderItems.findAll({
          where: { RPLinkId: rp.id },
          attributes: ["id"],
          include: {
            model: orderAddOns,
            attributes: ["id"],
            include: { model: addOn, attributes: ["price"] },
          },
        });
        let addOnPrice = 0;

        items.forEach((item) => {
          item.orderAddOns.forEach((addOn) => {
            addOnPrice += addOn.addOn.price;
          });
        });
        let obj = {
          id: rp.id.toString(),
          name: rp.name,
          sold: rp.sold.toString(),
          revenue: (rp.sold * parseInt(rp.originalPrice)).toString(),
          averagePrice: Number(
            (parseInt(rp.originalPrice) + parseInt(addOnPrice)) /
              parseInt(rp.sold)
          ).toFixed(1),
        };
        itemList.push(obj);
      }
    }
  }
  let productsWithImages =
    (parseInt(totalRPLinksWithImage) * 100) / parseInt(totalRPLinks);
  let productsWithDescription =
    (parseInt(productWithDescriptions) * 100) / parseInt(totalRPLinks);
  let data = {
    orderToAcceptDurations: 40,
    productsWithImages: productsWithImages ? productsWithImages : 0,
    productsWithDescription: productsWithDescription
      ? productsWithDescription
      : 0,
    totalRPLinks: totalRPLinks,
    productPerformance: itemList,
    deliveryAreaPerformance: resultArray,
  };
  let response = ApiResponse("1", "Menu Performance Data", "", data);
  return res.json(response);
}

async function postOrderInsight(req, res) {
  const { restaurantId } = req.params;
  const { from, to } = req.body;

  // Calculate the start and end dates for the previous week
  const today = new Date(to);
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  let status = await orderStatus.findOne({ where: { name: "Preparing" } });
  let scheduledMode = await orderMode.findOne({ where: { name: "Scheduled" } });
  let normalMode = await orderMode.findOne({ where: { name: "Standard" } });

  // Fetch orders for each day of the previous week
  const orders = await order.findAll({
    attributes: ["id", "createdAt"],
    where: {
      orderModeId: normalMode.id,
      restaurantId: restaurantId,
      createdAt: {
        [Op.between]: [oneWeekAgo, today],
      },
    },
    include: [
      {
        model: orderItems,
        attributes: ["id"],
        include: {
          model: orderAddOns,
          attributes: ["id"],
          include: { model: addOn, attributes: ["price"] },
        },
      },
      {
        model: orderHistory,
        attributes: ["id", "time"],
        include: {
          model: orderStatus,
          where: {
            [Op.or]: [
              { name: "Placed" },
              { name: "Accepted" },
              { name: "Ready for delivery" },
              { name: "On the way" },
              { name: "Food Pickedup" },
              { name: "Delivered" },
              { name: "Food Arrived" },
              { name: "Food Pickedup" },
              { name: "Accepted by Driver" },
            ],
          },
          attributes: ["id", "name"],
        },
      },
    ],
  });
  const ordersByDay = {};
  let currentDate = new Date(oneWeekAgo);
  let endDate = new Date(today);

  // Initialize objects to store total time difference and order count for each day
  const totalTimeDifferenceByDay = {};
  const orderCountByDay = {};
  const estDeliveryTimeOrders = [];
  // Iterate over each day of the previous week and initialize default values
  while (currentDate <= endDate) {
    const currentDateString = currentDate.toDateString();
    ordersByDay[currentDateString] = [];
    totalTimeDifferenceByDay[currentDateString] = 0;
    orderCountByDay[currentDateString] = 0;
    currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
  }

  // Add orders to respective days and calculate time difference and order count
  orders.forEach((order) => {
    const placedTime = new Date(order.createdAt);
    const orderDate = placedTime.toDateString();
    ordersByDay[orderDate].push(order);

    const placedHistory = order.orderHistories.find(
      (history) => history.orderStatus.name === "Placed"
    );
    const acceptedHistory = order.orderHistories.find(
      (history) => history.orderStatus.name === "Accepted"
    );

    if (placedHistory && acceptedHistory) {
      const placedTime = new Date(placedHistory.time);
      const acceptedTime = new Date(acceptedHistory.time);
      const timeDifference = acceptedTime - placedTime; // Time difference in milliseconds

      // Accumulate the time difference and order count for the current day
      totalTimeDifferenceByDay[orderDate] += timeDifference;
      orderCountByDay[orderDate]++;
    }
  });

  // Calculate average order accept time in minutes and add number of orders for each day
  const averageAcceptTimeAndOrdersByDay = {};
  const millisecondsInMinute = 1000 * 60; // Conversion factor from milliseconds to minutes
  for (const day in totalTimeDifferenceByDay) {
    const totalTimeInMinutes = totalTimeDifferenceByDay[day]
      ? totalTimeDifferenceByDay[day] / millisecondsInMinute
      : 0;
    const averageAcceptTime = orderCountByDay[day]
      ? totalTimeInMinutes / orderCountByDay[day]
      : 0;
    const numberOfOrders = orderCountByDay[day] || 0;
    averageAcceptTimeAndOrdersByDay[day] = {
      averageAcceptTime: averageAcceptTime,
      numberOfOrders: numberOfOrders,
    };
  }
  const resultList = Object.keys(averageAcceptTimeAndOrdersByDay).map((day) => {
    return {
      date: day,
      averageAcceptTimeInMinutes:
        averageAcceptTimeAndOrdersByDay[day].numberOfOrders > 0
          ? Number(
              averageAcceptTimeAndOrdersByDay[day].averageAcceptTime /
                averageAcceptTimeAndOrdersByDay[day].numberOfOrders
            )
              .toFixed(1)
              .toString()
          : "0.0",
      numberOfOrders: Number(
        averageAcceptTimeAndOrdersByDay[day].numberOfOrders
      )
        .toFixed(1)
        .toString(),
    };
  });

  // CALCULATE THE GRAPH DATA FOR ESTIMATED DELIVERY TIME
  currentDate = new Date(oneWeekAgo);
  endDate = new Date(today);
  while (currentDate <= endDate) {
    const currentDateString = currentDate.toDateString();
    let totalMinutes = 0;
    let numberOfOrders = 0;

    // Calculate total time spent and number of orders for the current day
    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt).toDateString();
      if (orderDate === currentDateString) {
        order.orderHistories.forEach((history, index) => {
          if (index < order.orderHistories.length - 1) {
            const currentStatus = history.orderStatus.name;
            const nextHistory = order.orderHistories[index + 1];
            const currentTime = new Date(history.time);
            const nextTime = new Date(nextHistory.time);
            const timeDifference = (nextTime - currentTime) / (1000 * 60); // Convert to minutes
            totalMinutes += timeDifference;
          }
        });
        numberOfOrders++;
      }
    });
    // Calculate average accept time for the current day
    const averageAcceptTimeInMinutes =
      numberOfOrders > 0 ? totalMinutes / numberOfOrders : 0;
    // Add the day's data to the response array
    estDeliveryTimeOrders.push({
      date: currentDateString,
      estDeliveryTime: averageAcceptTimeInMinutes.toFixed(1), // Round to 1 decimal place
      numberOfOrders: numberOfOrders.toFixed(1), // Round to 1 decimal place
    });

    currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
  }

  let data = {
    orderToAccept: resultList,
    estDeliveryTimeOrders,
  };
  let response = ApiResponse("1", "Post Order In Sight", "", data);
  return res.json(response);
}
async function customerExperience(req, res) {
  const { restaurantId } = req.params;
  const { from, to } = req.body;
  const today = new Date(to);
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  let orders = await order.findAll({
    include: [{ model: orderCharge, attributes: ["tip"] }],
    where: {
      restaurantId: restaurantId,
      createdAt: {
        [Op.between]: [oneWeekAgo, today],
      },
    },
    attributes: ["id", "createdAt"],
  });

  const dateRange = [];
  for (let d = new Date(oneWeekAgo); d <= today; d.setDate(d.getDate() + 1)) {
    dateRange.push(new Date(d).toISOString().split("T")[0]);
  }

  // Initialize tips for each date with 0
  const groupedOrders = dateRange.reduce((acc, date) => {
    acc[date] = {
      date: date,
      tip: 0,
    };
    return acc;
  }, {});

  // Update tip values if orders exist for that date
  orders.forEach((order) => {
    const date = order.dataValues.createdAt.toISOString().split("T")[0];
    const tip = order.dataValues.orderCharge
      ? order.dataValues.orderCharge.tip
      : 0;
    groupedOrders[date].tip += tip;
  });

  const weeklyTips = Object.values(groupedOrders);

  let totalVisits = await order.count({
    where: {
      restaurantId: restaurantId,
      createdAt: {
        [Op.between]: [oneWeekAgo, today],
      },
    },
  });
  const previousWeekDates = [];
  // const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    previousWeekDates.push(date.toISOString().split("T")[0]);
  }
  // Create an object to store the count of orders for each day
  const orderCountPerDay = {};
  // Initialize counts for all previous week days to zero
  previousWeekDates.forEach((date) => {
    orderCountPerDay[date] = 0;
  });
  // Iterate over each order
  orders.forEach((order) => {
    // Extract the date from createdAt timestamp
    const date = new Date(order.createdAt).toISOString().split("T")[0];

    // Increment the count for the day in the orderCountPerDay object
    orderCountPerDay[date]++;
  });

  // Retrieve ratings for the previous week
  let ratings = await restaurantRating.findAll({
    where: {
      restaurantId: restaurantId,
      createdAt: {
        [Op.between]: [oneWeekAgo, today],
      },
    },
  });
  // Group ratings by day and calculate average rating
  const ratingsByDay = {};
  const averageRatingByDay = {};
  // Initialize average rating as 0 for each day
  const daysInWeek = 7;
  for (let i = 0; i < daysInWeek; i++) {
    const day = new Date(oneWeekAgo);
    day.setDate(oneWeekAgo.getDate() + i);
    const formattedDay = day.toISOString().split("T")[0];
    ratingsByDay[formattedDay] = [];
    averageRatingByDay[formattedDay] = "0.0";
  }
  // Group ratings by day
  ratings.forEach((rating) => {
    const day = rating.createdAt.toISOString().split("T")[0]; // Extracting date without time
    if (!ratingsByDay[day]) {
      ratingsByDay[day] = []; // Initialize the array if it doesn't exist
    }
    ratingsByDay[day].push(rating);
  });
  // Calculate average rating for each day
  for (const day in ratingsByDay) {
    const totalRatings = ratingsByDay[day].length;
    if (totalRatings > 0) {
      const totalRatingValue = ratingsByDay[day].reduce(
        (sum, rating) => sum + rating.value,
        0
      );
      const averageRating = totalRatingValue / totalRatings;
      averageRatingByDay[day] = averageRating.toFixed(1); // Round to 1 decimal place
    }
  }

  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14); // Date for two weeks ago
  const threeWeeksAgo = new Date(today);
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21); // Date for three weeks ago

  const averageValue = await restaurantRating.findAll({
    attributes: [[sequelize.fn("AVG", sequelize.col("value")), "averageValue"]],
    where: {
      restaurantId: restaurantId,
      createdAt: {
        [Op.between]: [oneWeekAgo, today],
      },
    },
  });
  const previousWeekaverageValue = await restaurantRating.findAll({
    attributes: [[sequelize.fn("AVG", sequelize.col("value")), "averageValue"]],
    where: {
      restaurantId: restaurantId,
      createdAt: {
        [Op.between]: [threeWeeksAgo, twoWeeksAgo],
      },
    },
  });
  let previousWeekRating =
    previousWeekaverageValue[0]?.dataValues?.averageValue;
  const ratingList = Object.entries(averageRatingByDay).map(
    ([date, value]) => ({ date, value })
  );
  const noOfCustomers = Object.entries(orderCountPerDay).map(
    ([date, value]) => ({ date, value })
  );

  let ratingPercentage =
    ((parseFloat(averageValue[0]?.dataValues?.averageValue) -
      parseFloat(previousWeekaverageValue)) /
      parseFloat(previousWeekaverageValue)) *
    100;

  let data = {
    ratingPercentage: ratingPercentage ? ratingPercentage : 0,
    totalVisits: totalVisits,
    noOfCustomers: noOfCustomers,
    weeklyTips: weeklyTips,
    averageRating: averageValue[0]?.dataValues?.averageValue,

    daywiseRating: ratingList,
  };
  let response = ApiResponse("1", "Review Score", "", data);
  return res.json(response);
}

async function orderToAccept(req, res) {
  const { restaurantId } = req.params;
  const { from, to } = req.body;
  const today = new Date(to);
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  let orders = await order.findAll({
    include: { model: orderCharge, attributes: ["tip"] },
    where: {
      restaurantId: restaurantId,
      createdAt: {
        [Op.between]: [oneWeekAgo, today],
      },
    },
    attributes: ["id", "createdAt"],
  });
  let totalOrders = await order.count({
    where: { restaurantId: restaurantId },
  });
  // Initialize an object to hold orders and tips per day
  const ordersAndTipsPerDay = {};
  let totalTip = 0;
  // Iterate through the orders and calculate orders and tips per day
  orders.forEach((order) => {
    totalTip = totalTip + (order.orderCharge ? order.orderCharge.tip : 0);
    const dateStr = order.createdAt.toDateString();
    const tip = order.orderCharge ? order.orderCharge.tip : 0;
    if (!ordersAndTipsPerDay[dateStr]) {
      ordersAndTipsPerDay[dateStr] = {
        numberOfOrders: 1,
        tip: tip,
      };
    } else {
      ordersAndTipsPerDay[dateStr].numberOfOrders++;
      ordersAndTipsPerDay[dateStr].tip += tip;
    }
  });
  // Loop through all days of the previous week and fill in missing days with 0 orders and tip
  let currentDate = new Date(oneWeekAgo);
  const response = [];
  while (currentDate <= today) {
    const dateStr = currentDate.toDateString();
    const data = ordersAndTipsPerDay[dateStr] || { numberOfOrders: 0, tip: 0 };
    response.push({
      date: dateStr,
      numberOfOrders: data.numberOfOrders,
      tip: data.tip,
    });
    currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
  }
  let data = {
    orderToAccept: response,
    orderPercentage: (parseInt(orders.length) * 100) / parseInt(totalOrders),
    totalTip,
  };
  let dd = ApiResponse("1", "Order to accept", "", data);
  return res.json(dd);
}

async function orderByNewCustomers(req, res) {
  const { restaurantId } = req.params;
  const { from, to } = req.body;
  const today = new Date(to);
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  let orders = await order.findAll({
    include: {
      model: user,
      where: {
        createdAt: {
          [Op.between]: [oneWeekAgo, today],
        },
      },
      attributes: ["createdAt"],
    },
    where: {
      restaurantId: restaurantId,
    },
    attributes: ["id"],
  });
  let returningOrders = await order.findAll({
    include: {
      model: user,

      attributes: ["createdAt"],
    },
    where: {
      restaurantId: restaurantId,
    },
    attributes: ["id"],
  });
  // Initialize an object to hold orders by user creation date
  const ordersByUserCreationDate = {};
  const ordersByUserReturning = {};
  // Iterate through the orders and group them by user creation date
  orders.forEach((order) => {
    const userCreationDate = order.user.createdAt.toDateString();
    if (!ordersByUserCreationDate[userCreationDate]) {
      ordersByUserCreationDate[userCreationDate] = [];
    }
    ordersByUserCreationDate[userCreationDate].push({
      id: order.id,
      createdAt: order.createdAt,
    });
  });
  returningOrders.forEach((order) => {
    const userCreationDate = order.user.createdAt.toDateString();
    if (!ordersByUserReturning[userCreationDate]) {
      ordersByUserReturning[userCreationDate] = [];
    }
    ordersByUserReturning[userCreationDate].push({
      id: order.id,
      createdAt: order.createdAt,
    });
  });
  // return res.json(ordersByUserReturning)
  // Create an array of all dates within the range
  const allDates = [];
  let currentDate = new Date(oneWeekAgo);
  while (currentDate <= today) {
    allDates.push(currentDate.toDateString());
    currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
  }
  // Populate the response with zero orders for dates with no orders
  const response = allDates.map((date) => ({
    date: date,
    orders:
      (ordersByUserCreationDate[date] &&
        ordersByUserCreationDate[date].length) ||
      0,
  }));
  const returningResponse = allDates.map((date) => ({
    date: date,
    orders:
      (ordersByUserReturning[date] && ordersByUserReturning[date].length) || 0,
  }));
  let totalOrders = parseInt(returningOrders.length) + parseInt(orders.length);
  let data = {
    totalOrdersbyNewCustomers: (orders.length * 100) / totalOrders,
    totalOrdersbyReturningCustomers:
      (returningOrders.length * 100) / totalOrders,
    totalOrders: totalOrders,
    ordersByNewCustomers: response,
    ordersByReturningCustomers: returningResponse,
  };

  let dd = ApiResponse("1", "Data", "", data);
  return res.json(dd);
}

async function courierDashboard(req, res) {
  const { restaurantId } = req.params;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to the beginning of the day
  // let way = await orderStatus.findOne({where:{name:"On the way"}})
  // let pickup = await orderStatus.findOne({where:{name:"Food Pickedup"}})
  // let arrived = await orderStatus.findOne({where:{name:"Food Arrived"}})

  const orderList = await order.findAll({
    attributes: ["id", "orderNum", "total"],
    include: [
      { model: restaurant, attributes: ["id", "lat", "lng"] },
      {
        model: address,
        as: "dropOffID",
        attributes: [
          "id",
          "lat",
          "lng",
          "title",
          "building",
          "streetAddress",
          "city",
          "state",
          "zipCode",
        ],
      },
    ],
    limit: 10,
    where: {
      restaurantId: restaurantId,
      driverId: null,
      // createdAt: {
      //   [Op.gte]: today
      // }
    },
  });

  let todayList = [];
  let courierList = [];
  const zoneRest = await zoneRestaurants.findOne({
    where: { restaurantId: restaurantId },
    include: {
      model: zone,
      attributes: ["id"],
      include: {
        model: zoneDetails,
        attributes: ["id"],
        include: { model: unit, as: "currencyUnit" },
      },
    },
  });
  let restDrivers = await restaurantDriver.findAll({
    where: { restaurantId: restaurantId },
    include: {
      model: user,
      attributes: ["id", "firstName", "lastName", "email"],
    },
  });

  for (const order of orderList) {
    const estTime = await eta_text(
      order.restaurant.lat,
      order.restaurant.lng,
      order.dropOffID.lat,
      order.dropOffID.lng
    );
    let obj = {
      orderId: order.id,
      estTime: estTime,
      total: order.total,
      currency: zoneRest?.restaurant?.zone?.zoneDetails?.currencyUnit?.symbol,
      orderNum: order.orderNum,
      dropOffAddress: order.dropOffID,
      paid: order.paymentConfirmed && order.paymentRecieved ? true : false,
    };

    todayList.push(obj);
  }

  // let restDrivers = await restaurantDriver.findAll({
  //   where: { restaurantId: restaurantId },
  //   include: {
  //     model: user,
  //     attributes: ["id", "firstName", "lastName", "email"],
  //   },
  // });
  let fireBase = await axios.get(process.env.FIREBASE_URL);
  for (const driver of restDrivers) {
    if (fireBase.data) {
      let dd = fireBase.data[driver?.user?.id];

      if (dd) {
        let obj = {
          courier: driver?.user,
          location: fireBase.data[driver?.user?.id],
        };
        courierList.push(obj);
      }
    }
  }

  let data = {
    orderToday: todayList,
    acitveCourier: courierList,
  };
  const response = ApiResponse("1", "Courier Dashboard ", "", data);
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
  //   NEW APIS
  home,
  acceptOrder,
  restaurantDrivers,
  assignDriver,
  storeTime,
  updateStoreTime,
  orderDetails,
  activeOrders,
  completedOrders,
  updateRestaurant,
  updatePassword,
  enableRushMode,
  readyForPickup,
  addProduct,
  getProducts,
  editCategory,
  getAllCategory,
  addCategory,
  addCollection,
  addAddOns,
  getAllAddOnCategories,
  getAllAddOns,
  getRPLinkIds,
  updateAddOnCategory,
  updateAddOns,
  getRestaurantProfile,
  updateUserProfile,
  rejectOrder,
  completedOrders,
  activeOrders,
  getRestaurantDrivers,
  getRating,
  acceptBookTableRequest,
  rejectBookTableRequest,
  getTableBookings,
  deleteAddonCategory,
  getProductById,
  removeCategory,
  editProduct,
  inDeliverOrders,
  getData,
  delivered,
  addDriver,
  addDriverZone,
  getVehicleType,
  addVehicleDetails,
  addDriverLicense,
  addDriverAddress,
  sendNotificationToFreelanceDriver,
  scheduleOrder_to_Outgoing,
  openCloseRestaurant,

  //RESTAURANT PANEL APIS
  addProductStock,
  analytics,
  completeTableBooking,
  hourlyInsight,
  menuPerformance,
  postOrderInsight,
  customerExperience,
  orderToAccept,
  orderByNewCustomers,
  courierDashboard,
  homeData,
  acceptOrderForSocket,
  assignDriverForSocket,
};
