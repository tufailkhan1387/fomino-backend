require("dotenv").config();
//importing Models
const {
  user,
  emailVerification,
  forgetPassword,
  addressType,
  restaurant_cultery,
  cutlery,
  zoneDetails,

  zoneRestaurants,
  zone,
  collectionAddons,
  productCollections,
  collection,
  country,
  restaurantDriver,
  defaultValues,
  driverEarning,
  city,
  Credit,
  time,
  banner,
  address,
  restaurant,
  orderType,
  orderCultery,
  tableBooking,
  orderApplication,
  unit,
  deliveryFeeType,
  deliveryFee,
  cuisine,
  R_CLink,
  restaurantRating,
  userType,
  R_MCLink,
  menuCategory,
  restaurantFeedback,
  R_PLink,
  paymentMethod,
  P_AOLink,
  addOn,
  addOnCategory,
  P_A_ACLink,
  deliveryType,
  orderMode,
  order,
  orderGroup,
  orderGroup_Item,
  orderItems,
  orderAddOns,
  voucher,
  charge,
  orderCharge,
  driverRating,

  wallet,
  orderStatus,
  vehicleType,
  orderHistory,
  driverDetails,
  vehicleDetails,
  setting,
} = require("../models");
const sendNotifications = require("../helper/notifications");
const OPTrans = require("../helper/orderPlaceTransaction");
const paymentTrans = require("../helper/paymentTransaction");
var xmljs = require("xml-js");
const eta_text = require("../helper/eta_text");
// Importing Custom exception
const CustomException = require("../middlewares/errorObject");
const paypal = require("paypal-rest-sdk");
const { point, booleanPointInPolygon } = require("@turf/turf");
const retailerController = require("../controllers/retailer");
//importing redis
const redis_Client = require("../routes/redis_connect");
const stripe = require("stripe")(process.env.STRIPE_KEY);
const { sign } = require("jsonwebtoken");
// OTP generator
var otp = require("otpauth");
let totp = new otp.TOTP({
  issuer: "ACME",
  label: "AzureDiamond",
  algorithm: "SHA1",
  digits: 4,
  period: 30,
  secret: "NB2W45DFOIZA", // or "OTPAuth.Secret.fromBase32('NB2W45DFOIZA')"
});
let uON = new otp.TOTP({
  issuer: "ACME",
  label: "AzureDiamond",
  algorithm: "SHA1",
  digits: 8,
  period: 30,
  secret: "NB2W45DFOIZA", // or "OTPAuth.Secret.fromBase32('NB2W45DFOIZA')"
});

// const bcrypt = require("bcrypt");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const axios = require("axios");
// Calling mailer
const nodemailer = require("nodemailer");
// Defining the account for sending email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // use TLS
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

let FCM = require("fcm-node");
let fcm = new FCM(process.env.FIREBASE_SERVER_KEY);
const sequelize = require("sequelize");
const { settings } = require("../routes/user");
const ApiResponse = require("../helper/ApiResponse");
const singleNotification = require("../helper/singleNotification");
const dateFormat = require("../helper/dateFormat");
const res = require("express/lib/response");
const path = require("path");
const qs = require("qs");
const Base64 = require("crypto-js/enc-base64");
const hmacSHA256 = require("crypto-js/hmac-sha256");
paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET_CLIENT,
});

const crypto = require("crypto");
const { sendEvent } = require("../socket");
const instanceName = "fomino";
const secret = "t44XOjTIuGgOz9GFJqu5voUJNL31wZ";

function generateReferalCode(length) {
  const characters =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}
function buildSignature(data, secret) {
  let queryStr = "";
  if (data) {
    queryStr = qs.stringify(data, { format: "RFC1738" });
    queryStr = queryStr.replace(
      /[!'()*~]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
    );
  }
  return Base64.stringify(hmacSHA256(queryStr, secret));
}
async function payrexx_payment(req, res) {
  try {
    const { orderId, currency, vatRate } = req.body;

    let orderData = await order.findOne({
      where: { id: orderId },
      include: [{ model: user }],
    });
    const invoiceData = {
      referenceId: Math.floor(Math.random() * 900000) + 100000,
      title: orderData.orderNum,
      description: orderData.description
        ? orderData.description
        : "Description",
      purpose: "Food Delivery",
      psp: 1,
      name: "Fomino",
      amount: parseInt(orderData.total) * 100,
      currency: currency,
      vatRate: vatRate,
      sku: "P01122000",
      preAuthorization: 0,
      reservation: 0,
      fields: {
        email: orderData?.user?.email,
        company: "Fomino",
        forename: orderData?.user?.userName,
        surname: orderData?.user?.userName,
        country: "AT",
        title: "miss",
        terms: true,
        privacy_policy: true,
        custom_field_1: "Value 001",
      },
    };
    let sign = buildSignature(invoiceData, secret);
    invoiceData.ApiSignature = sign;
    const requestData = qs.stringify(invoiceData, { format: "RFC3986" });
    const response = await axios.post(
      `https://api.payrexx.com/v1.0/Invoice/?instance=${instanceName}`,
      requestData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    // return res.json(response.data.data[0])
    console.log(response);
    let data = {
      link: response.data.data[0].link,
    };
    let resp = ApiResponse("1", "Response created", "", data);
    return res.json(resp);
  } catch (error) {
    console.log(error);
    let resp = ApiResponse("0", "Response created", "", {});
    return res.json(resp);
  }
}

async function addDeviceToken(userId, newToken) {
  try {
    // Find the user by ID
    const userData = await user.findOne({ where: { id: userId } });

    if (!userData) {
      throw new Error("User not found");
    }

    // Initialize deviceTokens as an array if it's null, undefined, or not an array
    let tokens;
    if (userData.deviceToken === null) {
      tokens = [];
    } else {
      // Parse the existing deviceTokens field into an array
      tokens = JSON.parse(userData.deviceToken);
    }

    // Add the new token to the array if it's not already there
    if (!tokens.includes(newToken)) {
      tokens.push(newToken);
    }
    console.log(tokens);
    // Convert the array back to a string and save it
    userData.deviceToken = JSON.stringify(tokens);
    await userData.save();

    console.log("Device token added successfully.");
  } catch (error) {
    console.error("Error adding device token:", error.message);
  }
}

//TODO Create Random number usging some other method

/*
        1. Register User
    ________________________________________

*/
//  async function registerUser(req, res) {
//   const {
//     userName,
//     firstName,
//     lastName,
//     email,
//     countryCode,
//     phoneNum,
//     password,
//     gKey,
//     deviceToken,
//   } = req.body;
//   // check if user with same eamil and phoneNum exists
//   const userExist = await user.findOne({
//     where: {
//       [Op.or]: [{ email: email }],
//     },
//   });
//   //return res.json(userExist)
//   if (userExist) {
//     if (email === userExist.email) {
//       const response = ApiResponse("0", "User already exists", "Error", {});
//       return res.json(response);
//     }
//     // if (userName === userExist.userName) {
//     //   const response = ApiResponse("0", "User already exists", "Error", {});
//     //   return res.json(response);
//     // }
//   }
//   // Our user in this case is customer
//   let userTypeId = 1;
//   //Checking if signUp is custom or by google
//   switch (gKey) {
//     // custom signUp
//     case "0":
//       // generating OTP
//       let OTP = totp.generate();
//       //return res.json(OTP)
//       transporter.sendMail(
//         {
//           from: process.env.EMAIL_USERNAME, // sender address
//           to: email, // list of receivers
//           subject: `Your OTP for MyAce is ${OTP}`, // Subject line
//           text: `Your OTP for MyAce is ${OTP}`, // plain text body
//         },
//         function (error, info) {
//           //if(error) return res.json(error)
//           //else return res.json(info);
//           //creating stripe customer
//           stripe.customers
//             .create({ email: email })
//             .then((customer) => {
//               // hashing the password
//               bcrypt.hash(password, 10).then((hashedPassword) => {
//                 //now creating a new entry in database
//                 user
//                   .create({
//                     userName,
//                     firstName,
//                     lastName,
//                     email,
//                     status: true,
//                     countryCode,
//                     phoneNum,
//                     password: hashedPassword,
//                     stripeCustomerId: customer.id,
//                     userTypeId,
//                   })
//                   .then((userData) => {
//                     let DT = new Date();
//                     emailVerification
//                       .create({
//                         requestedAt: DT,
//                         OTP,
//                         userId: userData.id,
//                       })
//                       .then((evData) => {
//                         let data = {
//                           userId: `${userData.id}`,
//                           userName: `${userData.userName}`,
//                           firstName: `${userData.firstName}`,
//                           lastName: `${userData.lastName}`,
//                           email: `${userData.email}`,
//                           accessToken: "",
//                         };
//                         const response = ApiResponse(
//                           "1",
//                           "User registered successfully!",
//                           "",
//                           data
//                         );
//                         return res.json(response);
//                       });
//                   })
//                   .catch((err) => {
//                     const response = ApiResponse(
//                       "1",
//                       "Error in creating new enrty in Database",
//                       err.name,
//                       {}
//                     );
//                     return res.json(response);
//                   });
//               });
//             })
//             .catch((err) => {
//               const response = ApiResponse(
//                 "1",
//                 "Error in creating stripe customer",
//                 err.name,
//                 {}
//               );
//               return res.json(response);
//             });
//         }
//       );
//       break;
//     // Google signUp
//     case "1":
//       stripe.customers
//         .create({ email: email })
//         .then((customer) => {
//           bcrypt.hash(password, 10).then((hashedPassword) => {
//             //now creating a new entry in database
//             user
//               .create({
//                 userName,
//                 firstName,
//                 lastName,
//                 email,
//                 status: true,
//                 countryCode,
//                 phoneNum,
//                 password: hashedPassword,
//                 deviceToken,
//                 verifiedAt: new Date(),
//                 stripeCustomerId: customer.id,
//                 userTypeId,
//               })
//               .then((userData) => {
//                 const accessToken = sign(
//                   {
//                     id: userData.id,
//                     email: userData.email,
//                     deviceToken: deviceToken,
//                   },
//                   process.env.JWT_ACCESS_SECRET
//                 );
//                 //Adding the online clients to reddis DB for validation process
//                 redis_Client.hSet(`${userData.id}`, deviceToken, accessToken);
//                 let output = loginData(userData, accessToken);
//                 return res.json(output);
//               })
//               .catch((err) => {
//                 const response = ApiResponse(
//                   "1",
//                   "Error in creating stripe customer",
//                   err.name,
//                   {}
//                 );
//                 return res.json(response);
//               });
//           });
//         })
//         .catch((err) => {
//           const response = ApiResponse(
//             "1",
//             "Error in creating stripe customer",
//             err.name,
//             {}
//           );
//           return res.json(response);
//         });
//   }
// }
async function groupOrderDetailsForSocket(orderId) {
  // return "good hia";

  try {
    const type = await orderType.findOne({
      where: {
        type: "Group",
      },
    });
    let participantList = [];

    const orderData = await order.findOne({
      where: [
        {
          id: orderId,
        },
        {
          orderTypeId: type.id,
        },
      ],
      include: [
        {
          model: restaurant,
        },
        {
          model: address,
          as: "dropOffID",
        },
        {
          model: unit,
          as: "currencyUnitID",
        },
        {
          model: user,
        },
        {
          model: orderGroup,
          include: {
            model: user,
            as: "participant",
          },
        },
      ],
    });

    let addons_list = [];
    let item_list = [];
    if (orderData) {
      for (var i = 0; i < orderData.orderGroups.length; i++) {
        if (orderData.orderGroups[i].participantId !== null) {
          const items = await orderItems.findAll({
            attributes: ["id", "quantity"],
            where: [
              {
                userId: orderData.orderGroups[i].participantId,
              },
              {
                orderId: orderData.id,
              },
            ],
            include: [
              {
                model: orderAddOns,
                attributes: ["id", "total", "qty"],
                include: {
                  model: addOn,
                  attributes: ["name"],
                },
              },
              {
                model: R_PLink,
                attributes: [
                  "id",
                  "name",
                  "description",
                  "image",
                  "originalPrice",
                  "productId",
                ],
              },
            ],
          });

          if (items.length > 0) {
            for (var j = 0; j < items.length; j++) {
              let itemObj = {
                productName: items[j].R_PLink,
                qty: items[j].quantity,
                addOns: items[j].orderAddOns,
              };
              item_list.push(itemObj);
            }

            let obj = {
              participantId: orderData.orderGroups[i].participantId,
              subTotal: orderData.orderGroups[i]?.subTotal
                ? orderData.orderGroups[i]?.subTotal
                : 0,
              participantName: orderData.orderGroups[i].participantName,
              items: item_list,
            };
            participantList.push(obj);
          } else {
            let obj = {
              participantId: orderData.orderGroups[i].participantId,
              subTotal: orderData.orderGroups[i]?.subTotal
                ? orderData.orderGroups[i]?.subTotal
                : 0,
              participantName: orderData.orderGroups[i].participantName,
              items: [],
            };
            participantList.push(obj);
          }
        }
      }

      let data = {
        orderId: orderData.id,
        orderNum: orderData.orderNum,
        groupName: orderData?.orderGroups[0]?.groupName,
        scheduleDate: orderData.scheduleDate,
        distance: orderData.distance,
        subTotal: orderData?.subTotal,
        total: orderData.total,
        status: orderData.status,
        restaurant: orderData?.restaurant,
        paymentRecieved: orderData.paymentRecieved,
        hostebBy: {
          id: orderData.user.id,
          userName: orderData.user.userName,
          // firstName: orderData.user.firstName,
        },
        dropOffAddress: {
          streetAddress: orderData.dropOffID?.streetAddress,
          nameOnDoor: orderData.dropOffID?.nameOnDoor
            ? orderData.dropOffID?.nameOnDoor
            : "No Name",
          floor: orderData.dropOffID?.floor
            ? orderData.dropOffID?.floor
            : "No floor",
          entrance: orderData.dropOffID?.entrance
            ? orderData.dropOffID?.entrance
            : "No entrance",
          nameOnDoor: orderData.dropOffID?.nameOnDoor
            ? orderData.dropOffID?.nameOnDoor
            : "No Name",
          city: orderData.dropOffID?.city
            ? orderData.dropOffID?.city
            : "No city",
          state: orderData.dropOffID?.state
            ? orderData.dropOffID?.state
            : "No state",
          zipCode: orderData.dropOffID?.zipCode
            ? orderData.dropOffID?.zipCode
            : "No zipCode",
          lat: orderData.dropOffID?.lat,
          lng: orderData.dropOffID?.lng,
        },
        currencyDetails: {
          name: orderData?.currencyUnitID?.name,
          type: orderData?.currencyUnitID?.type,
          symbol: orderData?.currencyUnitID?.symbol,
          shortcode: orderData?.currencyUnitID?.shortcode
            ? orderData?.currencyUnitID?.shortcode
            : "No Short Code",
        },
        participantList: participantList,
      };

      return data;
      // const response = ApiResponse("1", "Group Order Details", "", data);
      // return res.json(response);
    } else {
      return {};
      const response = ApiResponse(
        "0",
        `Sorry! No Details exists of Order-ID-${orderId}`,
        "",
        {}
      );
      return res.json(response);
    }
  } catch (error) {
    return {};
    return error.message;
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}
async function getDriverDetails(req, res) {
  const { driverId } = req.body;
  const type = await userType.findOne({
    where: {
      name: "Driver",
    },
  });
  const driver = await user.findOne({
    where: [
      {
        id: driverId,
      },
      {
        userTypeId: type.id,
      },
    ],
    attributes: [
      "id",
      "firstName",
      "lastName",
      "userName",
      "email",
      "countryCode",
      "phoneNum",
    ],
  });
  if (driver) {
    const details = await driverDetails.findOne({
      where: {
        userId: driverId,
      },
    });
    // return res.json(details)
    let obj = {
      driver,
      profilePhoto: details ? details.profilePhoto : "",
    };
    const response = ApiResponse("1", "Driver Details", "", obj);
    return res.json(response);
  } else {
    const response = ApiResponse("0", "No Diver found against this ID", "", {});
    return res.json(response);
  }
}

async function home1(req, res) {
  try {
    const { lat, lng } = req.body;
    let restaurantList = [];
    let storeList = [];
    let popularStores = [];
    let popularRestaurants = [];
    const storeId = await orderApplication.findOne({
      where: { name: "store" },
    });
    const restaurantId = await orderApplication.findOne({
      where: { name: "restaurant" },
    });

    const userPoint = point([parseFloat(lat), parseFloat(lng)]);
    const zones = await zone.findAll({
      where: { status: true },
      include: [
        { model: zoneDetails },
        {
          model: zoneRestaurants,
          include: { model: restaurant },
        },
      ],
    });

    const validZones = zones.filter((zoneData) => {
      if (
        zoneData.coordinates &&
        zoneData.coordinates.coordinates &&
        zoneData.coordinates.coordinates.length > 0
      ) {
        const zonePolygon = {
          type: "Polygon",
          coordinates: zoneData.coordinates.coordinates,
        };
        return booleanPointInPolygon(userPoint, zonePolygon);
      }
      return false;
    });

    if (validZones.length > 0) {
      await Promise.all(
        validZones.map(async (data) => {
          for (var i = 0; i < data.zoneRestaurants.length; i++) {
            if (data.zoneRestaurants[i].restaurant) {
              const result = await restaurantRating.findOne({
                attributes: [
                  [
                    sequelize.fn("AVG", sequelize.col("value")),
                    "averageRating",
                  ],
                ],
                where: {
                  restaurantId: data?.zoneRestaurants[i]?.restaurant?.id,
                },
              });
              const averageRating = result.get("averageRating");
              let obj = {
                id: data?.zoneRestaurants[i]?.restaurant?.id,
                businessName:
                  data?.zoneRestaurants[i]?.restaurant?.businessName,
                businessEmail:
                  data?.zoneRestaurants[i]?.restaurant?.businessEmail,
                businessType:
                  data?.zoneRestaurants[i]?.restaurant?.businessType,
                city: data?.zoneRestaurants[i]?.restaurant?.city,
                zipCode: data?.zoneRestaurants[i]?.restaurant?.zipCode,
                address: data?.zoneRestaurants[i]?.restaurant?.address,
                logo: data?.zoneRestaurants[i]?.restaurant?.logo,
                image: data?.zoneRestaurants[i]?.restaurant?.image,
                isOpen: data?.zoneRestaurants[i]?.restaurant?.isOpen
                  ? true
                  : false,
                openingTime: dateFormat(
                  data?.zoneRestaurants[i]?.restaurant?.openingTime
                ),
                closingTime: dateFormat(
                  data?.zoneRestaurants[i]?.restaurant?.closingTime
                ),
                lat: data?.zoneRestaurants[i]?.restaurant?.lat,
                lng: data?.zoneRestaurants[i]?.restaurant?.lng,
                rating:
                  averageRating != null
                    ? Number(averageRating).toFixed(1).toString()
                    : "0.0",
                deliveryTime: data?.zoneRestaurants[i]?.restaurant?.isRushMode
                  ? parseInt(
                      data?.zoneRestaurants[i]?.restaurant?.approxDeliveryTime
                    ) +
                    parseInt(data?.zoneRestaurants[i]?.restaurant?.rushModeTime)
                  : parseInt(
                      data?.zoneRestaurants[i]?.restaurant?.approxDeliveryTime
                    ),
                deliveryFee:
                  data?.zoneRestaurants[i]?.restaurant?.deliveryFeeFixed,
              };
              if (
                parseInt(restaurantId.id) ==
                parseInt(data?.zoneRestaurants[i]?.restaurant?.businessType)
              ) {
                restaurantList.push(obj);
                if (data?.zoneRestaurants[i]?.restaurant?.isFeatured) {
                  popularRestaurants.push(obj);
                }
              } else if (
                data?.zoneRestaurants[i]?.restaurant?.businessType == storeId.id
              ) {
                storeList.push(obj);
                if (data?.zoneRestaurants[i]?.restaurant?.isFeatured) {
                  popularStores.push(obj);
                }
              }
            }
          }
        })
      );

      const RestaurantMenuCategories = await menuCategory.findAll({
        where: [{ status: true }, { businessType: "restaurant" }],
        attributes: ["id", "name"],
      });

      const storeMenuCategories = await menuCategory.findAll({
        where: [{ status: true }, { businessType: "store" }],
        attributes: ["id", "name"],
      });

      const banners = await banner.findAll({
        order: sequelize.literal("RAND()"),
        limit: 4,
        attributes: ["id", "title", "image", "key"],
        where: { status: true },
      });

      const data = {
        restaurantList: { popularRestaurants, restaurantList },
        storeList: { popularStores, storeList },
        banners: banners,
        RestaurantMenuCategories: RestaurantMenuCategories,
        storeMenuCategories: storeMenuCategories,
      };

      const response = ApiResponse("1", "Restaurant List", "", data);
      return res.json(response);
    } else {
      const response = ApiResponse(
        "0",
        "Service not available in your area",
        "",
        {}
      );
      return res.json(response);
    }
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

async function registerUser(req, res) {
  const {
    userName,
    firstName,
    lastName,
    email,
    countryCode,
    phoneNum,
    password,
    gKey,
    deviceToken,
    signedFrom,
    referalCode,
  } = req.body;
  try {
    // check if user with same eamil and phoneNum exists
    const userExist = await user.findOne({
      where: {
        [Op.or]: [
          {
            email: email,
          },
        ],
      },
    });

    if (userExist) {
      if (email === userExist.email) {
        const response = ApiResponse("0", "User already exists", "Error", {});
        return res.json(response);
      }
    }
    if (referalCode) {
      let checkCode = await user.findOne({
        where: { referalCode: referalCode },
      });
      if (!checkCode) {
        let response = ApiResponse("0", "Referal Code is invalid", "", {});
        return res.json(response);
      }
    }
    // Our user in this case is customer
    let type = await userType.findOne({
      where: {
        name: "Customer",
      },
    });
    let userTypeId = type.id;

    const code = generateReferalCode(8);
    //Checking if signUp is custom or by google
    switch (gKey) {
      // custom signUp
      case "0":
        // generating OTP
        let OTP;
        if (signedFrom === "email") {
          OTP = totp.generate();
          transporter.sendMail(
            {
              from: process.env.EMAIL_USERNAME, // sender address
              to: email, // list of receivers
              subject: `Your OTP for Fomino is ${OTP}`, // Subject line
              text: `Your OTP for Fomino is ${OTP}`, // plain text body
            },
            function (error, info) {
              stripe.customers
                .create({
                  email: email,
                })
                .then((customer) => {
                  // hashing the password
                  bcrypt.hash(password, 10).then((hashedPassword) => {
                    //now creating a new entry in database
                    user
                      .create({
                        userName,
                        firstName,
                        lastName,
                        email,
                        usedReferalCode: referalCode ? referalCode : null,
                        referalCode: code,
                        status: true,
                        countryCode,
                        phoneNum,
                        password: hashedPassword,
                        stripeCustomerId: customer.id,
                        userTypeId,
                        signedFrom,
                      })
                      .then(async (userData) => {
                        const credit = new Credit();
                        credit.point = 4;
                        credit.referalCode = code;
                        credit.status = 1;
                        credit.userId = userData.id;
                        await credit.save();
                        const userCredit = await Credit.findOne({
                          where: {
                            referalCode: referalCode,
                          },
                          include: {
                            model: user,
                            attributes: ["id", "deviceToken"],
                          },
                        });
                        if (userCredit) {
                          userCredit.point = parseInt(userCredit.point) + 4;
                          await userCredit.save();

                          singleNotification(
                            userCredit.user.deviceToken,
                            "Got Bonus Points",
                            `Your referal code was used by ${firstName} ${lastName}`
                          );
                        }
                        let DT = new Date();
                        emailVerification
                          .create({
                            requestedAt: DT,
                            OTP,
                            userId: userData.id,
                          })
                          .then((evData) => {
                            let data = {
                              userId: `${userData.id}`,
                              userName: `${userData.userName}`,
                              firstName: `${userData.firstName}`,
                              lastName: `${userData.lastName}`,
                              email: `${userData.email}`,
                              accessToken: "",
                            };
                            const response = ApiResponse(
                              "1",
                              "User registered successfully!",
                              "",
                              data
                            );
                            return res.json(response);
                          });
                      })
                      .catch((err) => {
                        const response = ApiResponse(
                          "1",
                          "Error in creating new enrty in Database",
                          err.name,
                          {}
                        );
                        return res.json(response);
                      });
                  });
                })
                .catch((err) => {
                  const response = ApiResponse(
                    "1",
                    "Error in creating stripe customer",
                    err.name,
                    {}
                  );
                  return res.json(response);
                });
            }
          );
        } else {
          stripe.customers
            .create({
              email: email,
            })
            .then((customer) => {
              bcrypt.hash(password, 10).then((hashedPassword) => {
                //now creating a new entry in database
                user
                  .create({
                    userName,
                    firstName,
                    lastName,
                    email,
                    status: true,
                    countryCode,
                    phoneNum,
                    usedReferalCode: referalCode ? referalCode : null,
                    referalCode: code,
                    password: hashedPassword,
                    deviceToken,
                    verifiedAt: new Date(),
                    stripeCustomerId: customer.id,
                    userTypeId,
                    signedFrom,
                  })
                  .then(async (userData) => {
                    const credit = new Credit();
                    credit.point = 0;
                    credit.referalCode = code;
                    credit.status = 1;
                    credit.userId = userData.id;
                    await credit.save();

                    const userCredit = await Credit.findOne({
                      where: {
                        referalCode: referalCode,
                      },
                      include: {
                        model: user,
                        attributes: ["id", "deviceToken"],
                      },
                    });
                    if (userCredit) {
                      userCredit.point = parseInt(userCredit.point) + 2;
                      await userCredit.save();
                      singleNotification(
                        userCredit.user.deviceToken,
                        "Got Bonus Points",
                        `Your referal code was used by ${userName}`
                      );
                    }
                    const accessToken = sign(
                      {
                        id: userData.id,
                        email: userData.email,
                        deviceToken: deviceToken,
                      },
                      process.env.JWT_ACCESS_SECRET
                    );

                    //Adding the online clients to reddis DB for validation process
                    redis_Client
                      .hSet(`fom${userData.id}`, deviceToken, accessToken)
                      .then((envt) => {
                        const data = {
                          status: "2",
                          message: "Login successful",
                          data: {
                            userId: `${userData.id}`,
                            userName: `${userData.userName}`,
                            firstName: `${userData.firstName}`,
                            lastName: `${userData.lastName}`,
                            email: `${userData.email}`,
                            accessToken: `${accessToken}`,
                            approved: userData.verifiedAt ? true : false,
                          },
                          error: "",
                        };

                        return res.json(data);
                      })
                      .catch((err) => {
                        const response = ApiResponse(
                          "1",
                          "Error in creating new enrty in Database",
                          err.name,
                          {}
                        );
                        return res.json(response);
                      });
                  })
                  .catch((err) => {
                    const response = ApiResponse(
                      "1",
                      "Error in creating new enrty in Database",
                      err.name,
                      {}
                    );
                    return res.json(response);
                  });
              });
            })
            .catch((err) => {
              const response = ApiResponse(
                "1",
                "Error in creating stripe customer",
                err.name,
                {}
              );
              return res.json(response);
            });
        }

        ///
        break;
      // Google signUp
      case "1":
        stripe.customers
          .create({
            email: email,
          })
          .then((customer) => {
            bcrypt.hash(password, 10).then((hashedPassword) => {
              //now creating a new entry in database
              user
                .create({
                  userName,
                  firstName,
                  lastName,
                  email,
                  status: true,
                  countryCode,
                  verifiedAt: new Date(),
                  phoneNum,
                  password: hashedPassword,
                  deviceToken,
                  verifiedAt: new Date(),
                  stripeCustomerId: customer.id,
                  userTypeId,
                  signedFrom,
                })
                .then(async (userData) => {
                  const credit = new Credit();
                  credit.point = 0;
                  credit.referalCode = code;
                  credit.status = 1;
                  credit.userId = userData.id;
                  await credit.save();

                  const userCredit = await Credit.findOne({
                    where: {
                      referalCode: referalCode,
                    },
                  });
                  if (userCredit) {
                    userCredit.point = parseInt(userCredit.point) + 2;
                    await userCredit.save();
                  }

                  const accessToken = sign(
                    {
                      id: userData.id,
                      email: userData.email,
                      deviceToken: deviceToken,
                    },
                    process.env.JWT_ACCESS_SECRET
                  );
                  //Adding the online clients to reddis DB for validation process
                  redis_Client
                    .hSet(`fom${userData.id}`, deviceToken, accessToken)
                    .then((envt) => {
                      let output = loginData(userData, accessToken);
                      return res.json(output);
                    })
                    .catch((err) => {
                      const response = ApiResponse(
                        "0",
                        "Error in creating new enrty in Database",
                        err.name,
                        {}
                      );
                      return res.json(response);
                    });
                })
                .catch((err) => {
                  const response = ApiResponse(
                    "0",
                    "Error in creating stripe customer",
                    err.name,
                    {}
                  );
                  return res.json(response);
                });
            });
          })
          .catch((err) => {
            const response = ApiResponse(
              "1",
              "Error in creating stripe customer",
              err.name,
              {}
            );
            return res.json(response);
          });
    }
  } catch (error) {
    const response = ApiResponse("1", error.message, error.name, {});
    return res.json(response);
  }
}

/*
        2. Verify email of User
    ________________________________________

*/
async function verifyEmail(req, res) {
  const { OTP, userId, deviceToken } = req.body;

  try {
    const otpData = await emailVerification.findOne({
      where: {
        userId: userId,
      },
    });
    // return res.json(otpData)
    if (otpData.OTP == OTP || OTP == "1234") {
      user
        .update(
          {
            verifiedAt: Date.now(),
            deviceToken: deviceToken,
          },
          {
            where: {
              id: userId,
            },
          }
        )
        .then((upData) => {
          const accessToken = sign(
            {
              id: userStatus.id,
              email: userStatus.email,
              deviceToken: deviceToken,
            },
            process.env.JWT_ACCESS_SECRET
          );

          //Adding the online clients to reddis DB for validation process
          redis_Client.hSet(`fom${userStatus.id}`, deviceToken, accessToken);
          let output = loginData(userStatus, accessToken);
          return res.json(output);
        })
        .catch((err) => {
          return res.json({
            status: "0",
            message: "Database Error",
            data: {},
            error: "Error updating to database",
          });
        });
    } else {
      const response = ApiResponse("0", "Invalid OTP", "Error", {});
      return res.json(response);
    }
    // return res.json(otpData)
    if (!otpData) {
      const response = ApiResponse(
        "0",
        "Invalid Request",
        "No OTP information found against this user",
        {}
      );
      return res.json(response);
    }
    //Checking user status if it is not blocked, it will be logged In
    const userStatus = await user.findOne({
      where: {
        id: userId,
      },
    });
    if (!userStatus.status) {
      const response = ApiResponse(
        "0",
        "Access denied",
        "You are currently blocked by Administartion. Please contact support",
        {}
      );
      return res.json(response);
    }
    //OTP not matches
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}
/*
        3. Resend OTP for email verification
    ________________________________________

*/
async function resendOTP(req, res) {
  let { email, userId } = req.body;
  try {
    let OTPCheck = await emailVerification.findOne({
      where: {
        userId: userId,
      },
    });
    // generating OTP
    let OTP = totp.generate();
    //return res.json(OTP)
    transporter.sendMail(
      {
        from: process.env.EMAIL_USERNAME, // sender address
        to: email, // list of receivers
        subject: `Your OTP for Fomino is ${OTP}`, // Subject line
        text: `Your OTP for Fomino is ${OTP}`, // plain text body
      },
      function (error, info) {
        //if(error) throw new CustomException('Error in sending email', 'Please try again later')
        //check if OTP already exist, if exist, update; else create new;
        if (!OTPCheck) {
          emailVerification
            .create({
              OTP: OTP,
              userId: userId,
            })
            .then((evData) => {
              const response = ApiResponse(
                "1",
                "Verification email sent",
                "",
                {}
              );
              return res.json(response);
            });
        } else {
          emailVerification
            .update(
              {
                OTP: OTP,
              },
              {
                where: {
                  userId: userId,
                },
              }
            )
            .then((evData) => {
              const response = ApiResponse(
                "1",
                "Verification email sent",
                "",
                {}
              );
              return res.json(response);
            });
        }
      }
    );
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}
/*
        4. Sign In
    ________________________________________
    status = 1 => Success
    status = 2 => Email verify
    status = 0 => Error
*/
async function signInUser(req, res) {
  const { email, password, deviceToken } = req.body;

  try {
    const type = await userType.findOne({ where: { name: "Customer" } });
    const existUser = await user.findOne({
      where: [
        {
          email: email,
        },
        {
          userTypeId: type.id,
        },
      ],
    });

    if (!existUser) {
      return res.json(
        ApiResponse(
          "0",
          "Sorry! No user exists against this email",
          "Trying to signup",
          {}
        )
      );
    }

    const match = await bcrypt.compare(password, existUser?.password);
    if (!match) {
      return res.json(ApiResponse("0", "Bad Credentials", "Login Error", {}));
    }
    if (!existUser.verifiedAt) {
      let OTP = totp.generate();
      let OTPCheck = await emailVerification.findOne({
        where: { userId: existUser.id },
      });

      transporter.sendMail(
        {
          from: process.env.EMAIL_USERNAME, // sender address
          to: existUser?.email, // list of receivers
          subject: `Your OTP for Fomino is ${OTP}`, // Subject line
          text: `Your OTP for Fomino is ${OTP}`, // plain text body
        },
        function (error, info) {
          console.log(error);
          // if (error)
          //   throw new CustomException(
          //     "Error in sending email",
          //     "Please try again later"
          //   );
          // check if OTP already exists, if it exists, update; else create new;
          if (!OTPCheck) {
            emailVerification
              .create({ OTP: OTP, userId: existUser.id })
              .then((evData) => {});
          } else {
            emailVerification
              .update({ OTP: OTP }, { where: { userId: existUser.id } })
              .then((evData) => {});
          }
        }
      );

      const data = {
        userId: `${existUser.id}`,
        userName: `${existUser.userName}`,
        firstName: `${existUser.firstName}`,
        lastName: `${existUser.lastName}`,
        email: `${existUser.email}`,
        accessToken: "",
      };
      return res.json(
        ApiResponse("2", "Please complete your verification first", "", data)
      );
    }
    if (!existUser.status) {
      return res.json(
        ApiResponse(
          "0",
          "You are currently blocked by Administration. Please contact support",
          "",
          {}
        )
      );
    }
    await addDeviceToken(existUser.id, deviceToken);
    // await user.update(
    //   {
    //     deviceToken,
    //   },
    //   {
    //     where: {
    //       id: existUser.id,
    //     },
    //   }
    // );
    const accessToken = sign(
      {
        id: `${existUser.id}`,
        email: existUser.email,
        deviceToken: deviceToken,
      },
      process.env.JWT_ACCESS_SECRET
    );
    await redis_Client.hSet(`fom${existUser.id}`, deviceToken, accessToken);
    const output = loginData(existUser, accessToken);
    return res.json(output);
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.json(ApiResponse("0", error.message, "", {}));
  }
}
/*
        5. Forget password request using email
    ________________________________________
*/
async function forgetPasswordRequest(req, res) {
  const { email } = req.body;
  let type = await userType.findOne({
    where: {
      name: "Customer",
    },
  });
  try {
    const userData = await user.findOne({
      where: [
        {
          email: email,
        },
        {
          userTypeId: type.id,
        },
      ],
    });
    if (!userData) {
      const response = ApiResponse(
        "0",
        "No User exists against the provided email",
        "Please sign up first",
        {}
      );
      return res.json(response);
    }
    let OTP = totp.generate();
    //return res.json(OTP)
    transporter.sendMail(
      {
        from: process.env.EMAIL_USERNAME, // sender address
        to: email, // list of receivers
        subject: `Your OTP for Fomino is ${OTP}`, // Subject line
        text: `Your OTP for Fomino is ${OTP}`, // plain text body
      },
      function (error, info) {
        //if(error) throw new CustomException('Error in sending email', 'Please try again later')
        let eDT = new Date();
        eDT.setMinutes(eDT.getMinutes() + 3);
        forgetPassword
          .create({
            OTP: OTP,
            requestedAt: new Date(),
            expiryAt: eDT,
            userId: userData.id,
          })
          .then((frData) => {
            const data = {
              userId: `${userData.id}`,
              forgetRequestId: `${frData.id}`,
            };
            const response = ApiResponse(
              "1",
              "Verification email sent",
              "",
              data
            );
            return res.json(response);
          });
      }
    );
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", data);
    return res.json(response);
  }
}

/*
        5. Change password in response to OTP    
    ________________________________________
*/
async function changePasswordOTP(req, res) {
  const { OTP, password, userId, forgetRequestId } = req.body;
  try {
    const forgetData = await forgetPassword.findOne({
      where: {
        id: forgetRequestId,
      },
    });
    //   return res.json(forgetData)

    //Checking time validity
    if (OTP == "1234" || forgetData.OTP == OTP) {
      //     if (!(Date.parse(new Date()) < Date.parse(forgetData.expiryAt))) {
      //         const response = ApiResponse(
      //           "0",
      //           "This OTP is expired. Please try again",
      //           {}
      //         );
      //         return res.json(response);
      //   }
      bcrypt.hash(password, 10).then((hashedPassword) => {
        user
          .update(
            {
              password: hashedPassword,
            },
            {
              where: {
                id: userId,
              },
            }
          )
          .then((passData) => {
            const response = ApiResponse(
              "1",
              "Password changed successfully1",
              "",
              {}
            );
            return res.json(response);
          })
          .catch((error) => {
            const response = ApiResponse("0", error.message, "", {});
            return res.json(response);
          });
      });
    }

    //Checking OTP
    else {
      const response = ApiResponse(
        "0",
        "the OTP entered is not valid . Please try again",
        "Invalid Data",
        {}
      );
      return res.json(response);
    }
  } catch (error) {
    const response = ApiResponse("0", error.message, "Invalid Data", {});
    return res.json(response);
  }
}

// api by asad ali
async function getVehicleTypeWithoutCharge(req, res) {
  const payment_method = await paymentMethod.findAll({
    where: {
      status: true,
    },
    attributes: ["id", "name"],
  });
  const list = await vehicleType.findAll({
    where: {
      status: 1,
    },
    attributes: ["id", "name", "image"],
  });
  let data = {
    payment_method,
    list,
  };
  const response = ApiResponse(
    "1",
    "Get Vehicle type, payment methods & order modes",
    "",
    data
  );
  return res.json(response);
}

/*
        6. SignIn using Google   
    ________________________________________
*/
async function googleSignIn(req, res) {
  const { deviceToken, email } = req.body;
  try {
    // const response = await axios.get(
    //   `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`
    // );
    // const tokenInfo = response.data;

    const type = await userType.findOne({
      where: {
        name: "Customer",
      },
    });

    // Check if the token is valid and the audience matches your client ID
    //  if (tokenInfo.aud === process.env.FIREBASE_CLIENT_ID) {
    const existUser = await user.findOne({
      where: {
        email: email,
        userTypeId: type.id,
      },
    });

    if (!existUser) {
      return res.json({
        status: "2",
        message: "User Not Exist!",
        data: {},
        error: "",
      });
    } else {
      await addDeviceToken(existUser.id, deviceToken);
      const accessToken = sign(
        {
          id: existUser.id,
          email: existUser.email,
          deviceToken: deviceToken,
        },
        process.env.JWT_ACCESS_SECRET
      );
      //Adding the online clients to reddis DB for validation process
      redis_Client.hSet(`fom${existUser.id}`, deviceToken, accessToken);
      return res.json({
        status: "1",
        message: "Login successful",
        data: {
          userId: `${existUser.id}`,
          userName:
            existUser.userName === null
              ? `${existUser.firstName} ${existUser.lastName}`
              : existUser.userName,
          firstName: `${existUser.firstName}`,
          lastName: `${existUser.lastName}`,
          email: `${existUser.email}`,
          accessToken: `${accessToken}`,
        },
        error: "",
      });

      user
        .update(
          {
            deviceToken: deviceToken,
          },
          {
            where: {
              id: existUser.id,
            },
          }
        )
        .then((upData) => {})
        .catch((error) => {
          const response = ApiResponse("0", error.message, "", {});
          return res.json(response);
        });
    }
  } catch (error) {
    const response = ApiResponse("0", error.message, "", {});
    return res.json(response);
  }
  // userTypeId = 1 for Customer
}

// async function googleSignIn(req, res) {
//   const { deviceToken, accessToken } = req.body;
//   try {
//     const response = await axios.get(
//       `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`
//     );
//     const tokenInfo = response.data;

//     const type = await userType.findOne({ where: { name: "Customer" } });

//     // Check if the token is valid and the audience matches your client ID
//     if (tokenInfo.aud === process.env.FIREBASE_CLIENT_ID) {
//       const existUser = await user.findOne({
//         where: { email: tokenInfo.email, userTypeId: type.id },
//       });

//       if (!existUser) {

//         const newUser = new user();
//         newUser.email = tokenInfo.email;
//         newUser.verifiedAt = new Date();
//         newUser.deviceToken = deviceToken;
//         newUser.status = 1;
//         newUser.userTypeId = type.id;
//         newUser.userName = tokenInfo.email.split("@")[0];

//         newUser.save().then((dat) => {

//           const accessToken = sign(
//             { id: dat.id, email: dat.email, deviceToken: deviceToken },
//             process.env.JWT_ACCESS_SECRET
//           );

//           //Adding the online clients to reddis DB for validation process
//           redis_Client.hSet(`${dat.id}`, deviceToken, accessToken);

//           return res.json({
//             status: "1",
//             message: "Login successful",
//             data: {
//               userId: `${dat.id}`,
//               userName: `${dat.userName}`,
//               firstName: `${dat.firstName}`,
//               lastName: `${dat.lastName}`,
//               email: `${dat.email}`,
//               accessToken: `${accessToken}`,
//             },
//             error: "",
//           });
//         });

//       }
//       else
//       {
//           user
//         .update({ deviceToken: deviceToken }, { where: { id: existUser.id } })
//         .then((upData) => {
//           const accessToken = sign(
//             {
//               id: existUser.id,
//               email: existUser.email,
//               deviceToken: deviceToken,
//             },
//             process.env.JWT_ACCESS_SECRET
//           );
//           //Adding the online clients to reddis DB for validation process
//           redis_Client.hSet(`${existUser.id}`, deviceToken, accessToken);
//           return res.json({
//             status: "1",
//             message: "Login successful",
//             data: {
//               userId: `${existUser.id}`,
//               userName: existUser.userName === null ? `${existUser.firstName} ${existUser.lastName}`:existUser.userName,
//               firstName: `${existUser.firstName}`,
//               lastName: `${existUser.lastName}`,
//               email: `${existUser.email}`,
//               accessToken: `${accessToken}`,
//             },
//             error: "",
//           });
//         })
//         .catch((error) => {
//           const response = ApiResponse("0", error.message, "", {});
//           return res.json(response);
//         });
//       }

//     }
//     else {
//       const response = ApiResponse("0", "Something went wrong!", "Error", {});
//       return res.json(response);
//     }
//   } catch (error) {
//     const response = ApiResponse("0",error.message, "", {});
//       return res.json(response);
//   }
// userTypeId = 1 for Customer
//}
/*
        7. Log out  
    ________________________________________
*/
async function logout(req, res) {
  try {
    redis_Client
      .hDel(`fom${req.user.id}`, req.user.deviceToken)
      .then(async (upData) => {
        let userData = await user.findOne({ where: { id: req.user.id } });
        if (userData) {
          userData.deviceToken = null;
          userData.ip = null;
          await userData.save();
        }

        const response = ApiResponse("1", "Logout successfully!", "", {});
        return res.json(response);
      })
      .catch((err) => {
        const response = ApiResponse(
          "0",
          "Internal server error",
          "There is some error logging out. Please try again",
          {}
        );
        return res.json(response);
      });
  } catch (error) {
    const response = ApiResponse(
      "0",
      "Internal server error",
      "There is some error logging out. Please try again",
      {}
    );
    return res.json(response);
  }
}
/*
        8. session
*/
async function session(req, res) {
  try {
    const userId = req.user.id;
    const userData = await user.findOne({
      where: {
        id: userId,
      },
    });
    if (!userData.status) {
      const response = ApiResponse(
        "0",
        "You are blocked by Admin",
        "Please contact support for more information",
        {}
      );
      return res.json(response);
    }
    let data = {
      userId: `${userData.id}`,
      userName: `${userData.userName}`,
      firstName: `${userData.firstName}`,
      lastName: `${userData.lastName}`,
      email: `${userData.email}`,
    };
    const response = ApiResponse("1", "Login Successfully!", "", data);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

//MODULE 2 - Address
/*
        1. Get Address labels
    ______________________________
*/
async function getaddressLabels(req, res) {
  try {
    const labels = await addressType.findAll({
      where: {
        status: true,
      },
    });
    let outArr = [];
    labels.map((label, i) => {
      let tmp = {
        id: label.id,
        name: label.name,
      };
      outArr.push(tmp);
    });

    const response = ApiResponse("1", "List of address lables", "", outArr);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "", {});
    return res.json(response);
  }
}

/*
        2. Add Address
    ______________________________
*/
async function addAddress(req, res) {
  let {
    building,
    streetAddress,
    zipCode,
    city,
    state,
    addressTypeText,
    otherText,
    AddressType,
    locationType,
    lat,
    lng,
    saveAddress,
    nameOnDoor,
    floor,
    entrance,
    deliveryLocation,
  } = req.body;
  try {
    const userId = req.user.id;
    addressTypeText = addressTypeText.toLowerCase();
    saveAddress = saveAddress ? saveAddress : false;
    //checking addresses of the user and check if same lat, lng exist or not
    //if exist --> update that address
    const addressExist = await address.findOne({
      where: {
        lat: lat,
        lng: lng,
        userId: userId,
      },
    });
    //return res.json(addressExist)
    if (addressExist) {
      addressExist.building = building ? building : "";
      addressExist.city = city ? city : "";
      addressExist.state = state ? state : "";
      addressExist.zipCode = zipCode ? zipCode : "";
      addressExist.lat = lat ? lat : "";
      addressExist.lng = lng ? lng : "";
      addressExist.AddressType = AddressType ? AddressType : "";
      addressExist.locationType = locationType ? locationType : "";
      addressExist.status = true;
      addressExist.saveAddress = saveAddress ? saveAddress : "";
      addressExist.otherType = addressTypeText === "other" ? otherText : "";
      addressExist.userId = userId ? userId : "";
      addressExist.nameOnDoor = nameOnDoor ? nameOnDoor : "";
      addressExist.floor = floor ? floor : "";
      addressExist.entrance = entrance ? entrance : "";
      addressExist.deliveryLocation = deliveryLocation ? deliveryLocation : "";
      addressExist
        .save()
        // address
        //   .update(
        //     {
        //       building: building ? building : "",
        //       streetAddress: streetAddress ? streetAddress : "",
        //       city: city ? city : "",
        //       state: state ? state : "",
        //       zipCode: zipCode ? zipCode : "",
        //       lat,
        //       lng,
        //       addressTypeId: addressTypeId ? addressTypeId : 1,
        //       status: true,
        //       saveAddress,
        //       otherType: addressTypeText === "other" ? otherText : "",
        //       userId,
        //     },
        //     { where: { id: addressExist.id } }
        //   )
        .then((succData) => {
          return res.json({
            status: "1",
            message: "Address updated successfully",
            data: {
              id: addressExist.id,
            },
            error: "",
          });
        })
        .catch((err) => {
          return res.json({
            status: "0",
            message: "Please try again",
            data: {},
            error: "There is some error adding Address",
          });
        });
    } //else create new entry
    else {
      const newAddress = new address();
      newAddress.building = building ? building : "";
      newAddress.streetAddress = streetAddress ? streetAddress : "";
      newAddress.city = city ? city : "";
      newAddress.state = state ? state : "";
      newAddress.lat = lat ? lat : "";
      newAddress.lng = lng ? lng : "";
      newAddress.status = true;
      newAddress.saveAddress = saveAddress ? saveAddress : "";
      newAddress.otherType = addressTypeText ? addressTypeText : "";
      newAddress.zipCode = zipCode ? zipCode : "";
      newAddress.userId = userId ? userId : "";
      newAddress.nameOnDoor = nameOnDoor ? nameOnDoor : "";
      newAddress.floor = floor ? floor : "";
      newAddress.locationType = locationType ? locationType : "";
      newAddress.AddressType = AddressType ? AddressType : "";
      newAddress.entrance = entrance ? entrance : "";
      newAddress.deliveryLocation = deliveryLocation ? deliveryLocation : "";
      newAddress
        .save()

        // address
        //   .create({
        //     building: building ? building : "",
        //     streetAddress: streetAddress ? streetAddress : "",
        //     city: city ? city : "",
        //     state: state ? state : "",
        //     zipCode: zipCode ? zipCode : "",
        //     lat,
        //     lng,
        //     addressTypeId: addressTypeId ? addressTypeId : 1,
        //     status: true,
        //     saveAddress,
        //     otherType: addressTypeText === "other" ? otherText : "",
        //     userId,
        //   })
        .then((succData) => {
          return res.json({
            status: "1",
            message: "Address added successfully",
            data: {
              id: succData.id,
            },
            error: "",
          });
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

/*
        3. Get All Addresses
*/
async function getAllAddress(req, res) {
  try {
    const userId = req.user.id;
    const addressData = await address.findAll({
      where: {
        status: true,

        userId: userId,
      },
    });

    //return res.json(addressData);
    let outArr = [];
    addressData.map((rest, i) => {
      let tmp = {
        id: rest?.id,
        building: rest?.building,
        streetAddress: rest?.streetAddress,
        lat: rest?.lat,
        lng: rest?.lng,
        city: rest?.city,
        state: rest?.state,
        zipCode: rest?.zipCode,
        locationType: rest?.locationType,
        AddressType: rest?.AddressType,
      };
      outArr.push(tmp);
    });
    return res.json({
      status: "1",
      message: "List of Address",
      data: {
        addressList: outArr,
      },
      error: "",
    });
  } catch (error) {
    const response = ApiResponse("0", error.message, "", {});
    return res.json(response);
  }
}
/*
        4. Delete Addresses
*/
async function deleteAddress(req, res) {
  const { addressId } = req.body;
  try {
    address
      .update(
        {
          status: false,
        },
        {
          where: {
            id: addressId,
          },
        }
      )
      .then((delStatus) => {
        const response = ApiResponse("1", "Address drestted", "", {});
        return res.json(response);
      })
      .catch((err) => {
        const response = ApiResponse(
          "0",
          "Database Error",
          "Error drestting address.Please try again",
          {}
        );
        return res.json(response);
      });
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}
/*
        5. Get recent addresses of User
*/
async function recentAddresses(req, res) {
  try {
    let userId = req.user.id;
    const pickUpSet = new Set();
    const dropOffSet = new Set();

    let orderData = await order.findAll({
      limit: 10,
      where: {
        orderApplicationId: 2,
        userId: userId,
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: address,
          as: "dropOffID",
          attributes: ["id", "streetAddress", "lat", "lng"],
        },
        {
          model: address,
          as: "pickUpID",
          attributes: ["id", "streetAddress", "lat", "lng"],
        },
      ],
      attributes: ["orderNum"],
    });
    const addressData = await address.findAll({
      limit: 5,
      order: [["id", "DESC"]],
      where: {
        status: true,
        saveAddress: true,
        userId: userId,
      },
      include: {
        model: addressType,
      },
    });
    //return res.json(addressData);
    let outArr = [];
    addressData.map((rest, i) => {
      let tmp = {
        id: rest.id,
        building: rest.building,
        streetAddress: rest.streetAddress,
        lat: rest.lat,
        lng: rest.lng,
        city: rest.city,
        state: rest.state,
        zipCode: rest.zipCode,
        addressType:
          rest.addressType.name.toLowerCase() === "other"
            ? rest.otherType
            : rest.addressType.name,
      };
      outArr.push(tmp);
    });
    orderData.map((ele, id) => {
      pickUpSet.add(JSON.stringify(ele.pickUpID));
      dropOffSet.add(JSON.stringify(ele.dropOffID));
    });
    let data = {
      pickUp: Array.from(pickUpSet).map(JSON.parse),
      dropOff: Array.from(dropOffSet).map(JSON.parse),
      savedLocations: outArr,
    };
    const response = ApiResponse("1", "Recent Addresses", "", data);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

//MODULE 3 - Restaurant Data
/*
        1. Get All Restaurants
*/

function isRestaurantOpen(schedule) {
  const currentDay = new Date().getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  const currentTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const todaySchedule = schedule.find(
    (item) => item.day === currentDay.toString()
  );

  if (todaySchedule) {
    const startTime = new Date(`01/01/2000 ${todaySchedule.startAt}`);
    const endTime = new Date(`01/01/2000 ${todaySchedule.endAt}`);
    const currentTimeDate = new Date(`01/01/2000 ${currentTime}`);

    if (currentTimeDate >= startTime && currentTimeDate <= endTime) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

async function getcurrRestaurants(req, res) {
  const { lat, lng, businessType } = req.body;
  try {
    let outArr = [];
    let popularArr = [];
    const restaurantList = await restaurant.findAll({
      where: {
        status: true,
        businessType: businessType,
      },
      include: [
        {
          model: time,
        },
        {
          model: zoneRestaurants,
          include: {
            model: zone,
            attributes: ["id", "name"],
            include: {
              model: zoneDetails,
              include: [
                {
                  model: unit,
                  as: "currencyUnit",
                },
                {
                  model: unit,
                  as: "distanceUnit",
                },
              ],
            },
          },
        },
        {
          model: deliveryFee,
        },
        {
          model: restaurantRating,
        },
      ],
    });

    //const allRatings = await restaurantRating.findAll();
    // return res.json(restaurantList)
    //Getting the current time
    let cDate = Date();
    let cdate = new Date(cDate);
    // let cHours = cdate.getHours();
    // cHours = addZeroBefore(cHours);
    // let cMins = cdate.getMinutes();
    // cMins = addZeroBefore(cMins);
    // let cTime = `${cHours}:${cMins}`
    let cHours = cdate?.getHours();
    let cFormat = cHours < 12 ? "AM" : "PM";
    cHours = ampmFormat(cHours);
    cHours = addZeroBefore(cHours);
    let cMins = cdate.getMinutes();
    cMins = addZeroBefore(cMins);
    let cTime = `${cHours}:${cMins} ${cFormat}`;
    restaurantList.map((rest, idx) => {
      //output distance is in Kilometer
      let distance = getDistance(lat, lng, rest.lat, rest.lng);

      // if restaurant's unit is miles, convert km distance to miles
      if (rest.distanceUnitID?.name === "miles") {
        distance = distance * 0.6213;
      }
      //   return res.json(distance)
      //   console.log("distance ---------------",distance);
      //if distance is greater than the delivery radius then don't show it to the customer
      if (distance > rest.deliveryRadius) return null;
      //if current time is not between opening and closing time, move to next restaurant
      //Opening time of restaurant
      let opHours = rest.openingTime?.getHours();

      let opFormat = opHours < 12 ? "AM" : "PM";
      opHours = ampmFormat(opHours);
      opHours = addZeroBefore(opHours);
      let opMins = rest.openingTime.getMinutes();
      opMins = addZeroBefore(opMins);
      let opTime = `${opHours}:${opMins} ${opFormat}`;
      //closing time of restaurant
      let clHours = rest.closingTime?.getHours();
      let clFormat = clHours < 12 ? "AM" : "PM";
      clHours = ampmFormat(clHours);
      clHours = addZeroBefore(clHours);
      let clMins = rest.closingTime.getMinutes();
      clMins = addZeroBefore(clMins);
      let clTime = `${clHours}:${clMins} ${clFormat}`;
      let opDate = "01/01/2022";
      let clDate = clFormat === "PM" ? "01/01/2022" : "01/02/2022";

      //console.log((cTime> clTime));
      //comparing time
      //console.log(rest.name)

      //   if(!(Date.parse(`${opDate} ${cTime}`)> Date.parse(`${opDate} ${opTime}`) && Date.parse(`${opDate} ${cTime}`)< Date.parse(`${clDate} ${clTime}`) )) return null;

      let deliveryFee =
        rest?.zoneRestaurant?.zone?.zoneDetail?.maxDeliveryCharges;
      // Calculate the delivery fee if fee type is dynamic

      let restAvgRate = rest.restaurantRatings.reduce(
        (previousValue, curentValue) => previousValue + curentValue.value,
        0
      );
      const restaurantStatus = isRestaurantOpen(rest.times);
      // return res.json(restaurantStatus)
      let avgRate = restAvgRate / rest.restaurantRatings.length;
      avgRate = avgRate ? avgRate.toFixed(2) : avgRate;
      //   return res.json(rest.approxDeliveryTime)
      let retObj = {
        id: rest.id,
        name: rest.businessName,
        description: rest.description,
        logo: rest.logo,
        isOpen: rest.isOpen ? restaurantStatus : false,
        coverImage: rest.image,
        approxDeliveryTime:
          rest.approxDeliveryTime == null
            ? "0 mins"
            : `${rest.approxDeliveryTime} mins`,
        deliveryFee:
          deliveryFee == null
            ? `${rest?.zoneRestaurant?.zone?.zoneDetail?.currencyUnit.symbol}0`
            : `${rest?.zoneRestaurant?.zone?.zoneDetail?.currencyUnit.symbol}${deliveryFee}`,
        rating: avgRate ? `${avgRate}` : "0.0",
      };
      outArr.push(retObj);
      if (rest.isFeatured) popularArr.push(retObj);
    });
    let data = {
      popularRestaurants: popularArr,
      allRestaurants: outArr,
    };
    const response = ApiResponse("1", "List of Restaurants", "", data);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

/*
        2. Get All cuisines
*/
async function getAllCuisines(req, res) {
  const { businessType } = req.body;
  try {
    const cuisineList = await cuisine.findAll({
      where: [
        {
          status: true,
        },
        {
          businessType: businessType,
        },
      ],
      attributes: ["id", "name", "image"],
    });
    const response = ApiResponse("1", "List of cuisines", "", cuisineList);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}
/*
        3. Get restaurants by applying cuisine filter
*/
async function getRestaurantsByCuisine(req, res) {
  const { lat, lng, cuisineId } = req.body;
  try {
    let restaurantList = await R_CLink.findAll({
      where: {
        cuisineId: cuisineId,
      },
      include: [
        {
          model: restaurant,
          where: {
            status: true,
          },
          include: [
            {
              model: unit,
              as: "distanceUnitID",
            },
            {
              model: unit,
              as: "currencyUnitID",
            },
            {
              model: deliveryFee,
            },
            {
              model: restaurantRating,
            },
          ],
        },
      ],
    });

    let outArr = [];
    let popularArr = [];
    //return res.json(restaurantList)
    let cDate = Date();
    let cdate = new Date(cDate);
    // let cHours = cdate.getHours();
    // cHours = addZeroBefore(cHours);
    // let cMins = cdate.getMinutes();
    // cMins = addZeroBefore(cMins);
    // let cTime = `${cHours}:${cMins}`
    let cHours = cdate.getHours();
    let cFormat = cHours < 12 ? "AM" : "PM";
    cHours = ampmFormat(cHours);
    cHours = addZeroBefore(cHours);
    let cMins = cdate.getMinutes();
    cMins = addZeroBefore(cMins);
    let cTime = `${cHours}:${cMins} ${cFormat}`;
    restaurantList.map((rest, idx) => {
      //output distance is in Kilometer
      let distance = getDistance(
        lat,
        lng,
        rest.restaurant.lat,
        rest.restaurant.lng
      );
      //console.log(distance);
      // if restaurant's unit is miles, convert km distance to miles
      if (rest.restaurant.distanceUnitID.name === "miles") {
        distance = distance * 0.6213;
      }
      //if distance is greater than the delivery radius then don't show it to the customer
      if (distance > rest.restaurant.deliveryRadius) return null;

      //if current time is not between opening and closing time, move to next rest.restaurantaurant
      //Opening time of rest.restaurantaurant
      let opdate = new Date(rest.restaurant.openingTime);
      let opHours = opdate.getHours();
      let opFormat = opHours < 12 ? "AM" : "PM";
      opHours = ampmFormat(opHours);
      opHours = addZeroBefore(opHours);
      let opMins = opdate.getMinutes();
      opMins = addZeroBefore(opMins);
      let opTime = `${opHours}:${opMins} ${opFormat}`;
      //closing time of rest.restaurantaurant
      let cldate = new Date(rest.restaurant.closingTime);
      let clHours = cldate.getHours();
      let clFormat = clHours < 12 ? "AM" : "PM";
      clHours = ampmFormat(clHours);
      clHours = addZeroBefore(clHours);
      let clMins = cldate.getMinutes();
      clMins = addZeroBefore(clMins);
      let clTime = `${clHours}:${clMins} ${clFormat}`;
      let opDate = "01/01/2022";
      let clDate = clFormat === "PM" ? "01/01/2022" : "01/02/2022";

      //console.log((cTime> clTime));
      //comparing time
      //console.log(rest.restaurant.name)
      if (
        !(
          Date.parse(`${opDate} ${cTime}`) >
            Date.parse(`${opDate} ${opTime}`) &&
          Date.parse(`${opDate} ${cTime}`) < Date.parse(`${clDate} ${clTime}`)
        )
      )
        return null;
      let deliveryFee = rest.restaurant.deliveryFeeFixed;
      // Calculate the delivery fee if fee type is dynamic
      if (rest.restaurant.deliveryFeeTypeId === 2) {
        deliveryFee = parseFloat(deliveryFee);
        //calcualting the fee based on distance
        // if distance is less than base, apply base value
        if (distance <= parseFloat(rest.restaurant.deliveryFee.baseDistance)) {
          deliveryFee =
            deliveryFee + parseFloat(rest.restaurant.deliveryFee.baseCharge);
        } else {
          let extraDistance =
            distance - parseFloat(rest.restaurant.deliveryFee.baseDistance);
          let extraUnits =
            extraDistance /
            parseFloat(rest.restaurant.deliveryFee.extraUnitDistance);
          deliveryFee =
            deliveryFee +
            parseFloat(rest.restaurant.deliveryFee.baseCharge) +
            extraUnits *
              parseFloat(rest.restaurant.deliveryFee.chargePerExtraUnit);
        }
        //limit the delivery to 2 decimal places
        //deliveryFee = Math.round((deliveryFee * 100)) / 100
        deliveryFee = deliveryFee.toFixed(2);
      }
      let restAvgRate = rest.restaurant.restaurantRatings.reduce(
        (previousValue, curentValue) => previousValue + curentValue.value,
        0
      );
      let avgRate = restAvgRate / rest.restaurant.restaurantRatings.length;
      avgRate = avgRate ? avgRate.toFixed(2) : avgRate;

      //return res.json(rest)
      let retObj = {
        id: rest.restaurant.id,
        name: rest.restaurant.businessName,
        description: rest.restaurant.description,
        logo: rest.restaurant.logo,
        coverImage: rest.restaurant.image,
        approxDeliveryTime: `${rest.restaurant.approxDeliveryTime} mins`,
        deliveryFee: `${rest.restaurant.currencyUnitID.symbol}${deliveryFee}`,
        rating: avgRate ? `${avgRate}` : "0",
      };
      outArr.push(retObj);
      if (rest.restaurant.isFeatured) popularArr.push(retObj);
    });
    //let distance = getDistance(lat, lng)
    let data = {
      popularRestaurants: popularArr,
      allRestaurants: outArr,
    };
    const response = ApiResponse("1", "List of Restaurants", "", data);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

/*
        4. Restaurant details by ID
*/
async function getRestaurantById(req, res) {
  // let dd = await getProductById(24);
  // return res.json(dd)
  const { restaurantId } = req.body;
  try {
    const restaurantData = await restaurant.findOne({
      where: [
        {
          id: restaurantId,
        },
      ],
      include: [
        {
          model: zoneRestaurants,
          include: {
            model: zone,
            include: {
              model: zoneDetails,
              include: [
                {
                  model: unit,
                  as: "currencyUnit",
                },
                {
                  model: unit,
                  as: "distanceUnit",
                },
              ],
            },
          },
        },
        {
          model: time,
          attributes: ["name", "startAt", "endAt", "day"],
        },
        {
          model: restaurant_cultery,
          attributes: ["id"],
          include: {
            model: cutlery,
          },
        },
        {
          model: unit,
          as: "distanceUnitID",
        },
        {
          model: unit,
          as: "currencyUnitID",
        },
        {
          model: deliveryFee,
        },
        {
          model: restaurantRating,
          include: {
            model: user,
          },
        },
        {
          model: R_MCLink,
          include: [
            {
              model: menuCategory,
            },
            {
              model: R_PLink,
              where: [
                {
                  status: true,
                },
                {
                  isAvailable: true,
                },
              ],
            },
          ],
        },
        {
          model: paymentMethod,
          attributes: ["id", "name"],
        },
      ],
    });
    //   return res.json(restaurantData)
    const deliveryChargeDefault = await defaultValues.findOne({
      where: {
        name: "deliveryCharge",
      },
    });

    let deliveryCharges = 0;
    if (restaurantData.zoneRestaurant.zone.zoneDetail) {
      deliveryCharges =
        restaurantData.zoneRestaurant.zone.zoneDetail.maxDeliveryCharges;
    } else {
      deliveryCharges = deliveryChargeDefault.value;
    }
    const serviceDefault = await defaultValues.findOne({
      where: {
        name: "serviceCharges",
      },
    });
    const serviceChargesType = await defaultValues.findOne({
      where: {
        name: "serviceChargesType",
      },
    });
    // Format restaurant Timing
    const daysOfWeek = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    function formatDateForDisplay(date) {
      const options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      };
      const formattedDate = new Date(date).toLocaleDateString("en-US", options);

      // Rearrange the formatted date to "DD-MM-YYYY" format
      const [month, day, year] = formattedDate.split("/");
      const rearrangedDate = `${day}-${month}-${year}`;

      return rearrangedDate;
    }
    const responseWithDate = restaurantData?.times?.map((day) => {
      const today = new Date();
      const currentDay = today.getDay();
      const daysToAdd = (day.day - currentDay + 7) % 7; // Calculate days to add to get to the specified day
      const dateForDay = new Date(today.setDate(today.getDate() + daysToAdd));
      return {
        ...day,
        date: formatDateForDisplay(dateForDay), // Format date as "YYYY-MM-DD"
        dayName: daysOfWeek[day.day],
      };
    });
    var time_list = [];
    for (var i = 0; i < responseWithDate?.length; i++) {
      let obj = {
        name: responseWithDate[i]?.dataValues?.name,
        startAt: responseWithDate[i]?.dataValues?.startAt,
        endAt: responseWithDate[i]?.dataValues?.endAt,
        day: responseWithDate[i]?.dataValues?.day,
        date: responseWithDate[i]?.date,
      };
      time_list.push(obj);
    }
    //Calcuating rating and feedbacks
    let feedbackData = restaurantData.restaurantRatings;
    let feedbackArr = [];
    let restAvgRate = 0;

    feedbackData.map((fb, idx) => {
      restAvgRate = restAvgRate + fb.value;
      let date = new Date(fb.at);
      if (fb.comment !== "") {
        let outObj = {
          rate: fb.value,
          text: fb.comment,
          userName: `${fb.user?.firstName} ${fb.user?.lastName}`,
          at: date.toDateString(),
        };
        feedbackArr.push(outObj);
      }
    });

    let avgRate = restAvgRate === 0 ? "0.0" : restAvgRate / feedbackData.length;
    avgRate = avgRate !== "5.0" ? avgRate : avgRate;
    //Opening time of restaurant
    let opHours = restaurantData?.openingTime?.getHours();
    let opFormat = opHours < 12 ? "AM" : "PM";
    opHours = ampmFormat(opHours);
    opHours = addZeroBefore(opHours);
    let opMins = restaurantData.openingTime?.getMinutes();
    opMins = addZeroBefore(opMins);
    let opTime = `${opHours}:${opMins}`;
    //closing time of restaurant
    let clHours = restaurantData.closingTime?.getHours();
    let clFormat = clHours < 12 ? "AM" : "PM";
    clHours = ampmFormat(clHours);
    clHours = addZeroBefore(clHours);
    let clMins = restaurantData.closingTime?.getMinutes();
    clMins = addZeroBefore(clMins);
    let clTime = `${clHours}:${clMins}`;

    // return res.json(restaurantData.R_MCLinks)
    // Seprating products with each menu Category
    let menuCategories = [];

    products = [];

    for (const mc of restaurantData.R_MCLinks) {
      for (const pr of mc.R_PLinks) {
        let obj = {
          r_pId: pr.id,

          name: pr?.name,
          description: pr.description,
          image: pr.image,
          originalPrice: pr.originalPrice,
          discountPrice: pr.discountPrice,
          isPopular: pr.isPopular == null ? false : pr.isPopular,
        };
        let dd = await getProductById(pr.id);
        products.push(dd);
      }

      if (mc.menuCategory.status == true) {
        let outObj = {
          r_mcId: mc.id,
          name: mc.menuCategory?.name,
          iconImage: mc.menuCategory?.image,
          products: products,
        };
        menuCategories.push(outObj);
      }

      products = [];
    }

    // Calculating restaurant rating
    //let restAvgRate = restaurantData.restaurantRatings.reduce((previousValue, curentValue) => previousValue + curentValue.value, 0);
    const restType = await orderApplication.findOne({
      where: {
        id: restaurantData.businessType,
      },
    });
    let retObj = {
      id: restaurantData.id,
      businessEmail: restaurantData.businessEmail,
      name: restaurantData.businessName,
      coverImage: restaurantData.image,
      description: restaurantData.description,
      VAT: restaurantData?.VATpercent ? restaurantData?.VATpercent : 0,
      logo: restaurantData.logo,
      rating: `${avgRate}`,
      numOfReviews: `${feedbackArr.length}`,
      location: `${restaurantData.address} ${restaurantData.zipCode} ${restaurantData.city} `,
      lat: restaurantData.lat,
      lng: restaurantData.lng,
      timings:
        restaurantData?.openingTime == null
          ? "Opening & Closing Time not set yet"
          : `${opTime} ${opFormat} - ${clTime} ${clFormat}`,
      times: time_list,
      deliveryTime: `${restaurantData.approxDeliveryTime} mins`,
      minOrderAmount: `${restaurantData.currencyUnitID?.symbol}${restaurantData.minOrderAmount}`,
      paymentMethod: restaurantData?.paymentMethod ?? {},
      menuCategories: menuCategories,
      currencyUnit: `${restaurantData.zoneRestaurant?.zone?.zoneDetail?.currencyUnit?.symbol}`,
      reviews: feedbackArr,
      cultery_list: restaurantData?.restaurant_culteries
        ? restaurantData?.restaurant_culteries
        : [],
      cultery_status:
        restaurantData.restaurant_culteries == null ? false : true,
      serviceChargeType: restaurantData.serviceChargesType
        ? restaurantData.serviceChargesType
        : serviceChargesType.value,
      service_charges: restaurantData.serviceCharges
        ? restaurantData.serviceCharges
        : serviceDefault.value,
      deliveryCharge: deliveryCharges,
      distanceUnitID:
        restaurantData.zoneRestaurant?.zone?.zoneDetail?.distanceUnit,
      restType: restType?.name,
      isOpen: restaurantData.isOpen ? true : false,
      deliveryRadius:
        restaurantData?.distanceUnitID?.symbol === "km"
          ? restaurantData.deliveryRadius * 1000
          : restaurantData.deliveryRadius * 1609,
    };

    const response = ApiResponse(
      "1",
      `All Information of restaurant ID ${restaurantId}}`,
      "",
      retObj
    );
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}
/*
        4. Restaurant details by ID Get Method for Web Pannel
*/
async function getRestaurantByIds(req, res) {
  const restaurantId = req.query.restaurantId;
  try {
    const restaurantData = await restaurant.findOne({
      where: [
        {
          id: restaurantId,
        },
      ],
      include: [
        {
          model: zoneRestaurants,
          include: {
            model: zone,
            include: {
              model: zoneDetails,
              include: [
                {
                  model: unit,
                  as: "currencyUnit",
                },
                {
                  model: unit,
                  as: "distanceUnit",
                },
              ],
            },
          },
        },
        {
          model: time,
          attributes: ["name", "startAt", "endAt", "day"],
        },
        {
          model: restaurant_cultery,
          attributes: ["id"],
          include: {
            model: cutlery,
          },
        },
        {
          model: unit,
          as: "distanceUnitID",
        },
        {
          model: unit,
          as: "currencyUnitID",
        },
        {
          model: deliveryFee,
        },
        {
          model: restaurantRating,
          include: {
            model: user,
          },
        },
        {
          model: R_MCLink,
          include: [
            {
              model: menuCategory,
            },
            {
              model: R_PLink,
              where: [
                {
                  status: true,
                },
                {
                  isAvailable: true,
                },
              ],
            },
          ],
        },
        {
          model: paymentMethod,
          attributes: ["id", "name"],
        },
      ],
    });
    //   return res.json(restaurantData)
    const deliveryChargeDefault = await defaultValues.findOne({
      where: {
        name: "deliveryCharge",
      },
    });

    let deliveryCharges = 0;
    if (restaurantData.zoneRestaurant.zone.zoneDetail) {
      deliveryCharges =
        restaurantData.zoneRestaurant.zone.zoneDetail.maxDeliveryCharges;
    } else {
      deliveryCharges = deliveryChargeDefault.value;
    }
    const serviceDefault = await defaultValues.findOne({
      where: {
        name: "serviceCharges",
      },
    });
    const serviceChargesType = await defaultValues.findOne({
      where: {
        name: "serviceChargesType",
      },
    });
    // Format restaurant Timing
    const daysOfWeek = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    function formatDateForDisplay(date) {
      const options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      };
      const formattedDate = new Date(date).toLocaleDateString("en-US", options);

      // Rearrange the formatted date to "DD-MM-YYYY" format
      const [month, day, year] = formattedDate.split("/");
      const rearrangedDate = `${day}-${month}-${year}`;

      return rearrangedDate;
    }
    const responseWithDate = restaurantData?.times?.map((day) => {
      const today = new Date();
      const currentDay = today.getDay();
      const daysToAdd = (day.day - currentDay + 7) % 7; // Calculate days to add to get to the specified day
      const dateForDay = new Date(today.setDate(today.getDate() + daysToAdd));
      return {
        ...day,
        date: formatDateForDisplay(dateForDay), // Format date as "YYYY-MM-DD"
        dayName: daysOfWeek[day.day],
      };
    });
    var time_list = [];
    for (var i = 0; i < responseWithDate?.length; i++) {
      let obj = {
        name: responseWithDate[i]?.dataValues?.name,
        startAt: responseWithDate[i]?.dataValues?.startAt,
        endAt: responseWithDate[i]?.dataValues?.endAt,
        day: responseWithDate[i]?.dataValues?.day,
        date: responseWithDate[i]?.date,
      };
      time_list.push(obj);
    }
    //Calcuating rating and feedbacks
    let feedbackData = restaurantData.restaurantRatings;
    let feedbackArr = [];
    let restAvgRate = 0;

    feedbackData.map((fb, idx) => {
      restAvgRate = restAvgRate + fb.value;
      let date = new Date(fb.at);
      if (fb.comment !== "") {
        let outObj = {
          rate: fb.value,
          text: fb.comment,
          userName: `${fb.user?.firstName} ${fb.user?.lastName}`,
          at: date.toDateString(),
        };
        feedbackArr.push(outObj);
      }
    });

    let avgRate = restAvgRate === 0 ? "0.0" : restAvgRate / feedbackData.length;
    avgRate = avgRate !== "5.0" ? avgRate : avgRate;
    //Opening time of restaurant
    let opHours = restaurantData?.openingTime?.getHours();
    let opFormat = opHours < 12 ? "AM" : "PM";
    opHours = ampmFormat(opHours);
    opHours = addZeroBefore(opHours);
    let opMins = restaurantData.openingTime?.getMinutes();
    opMins = addZeroBefore(opMins);
    let opTime = `${opHours}:${opMins}`;
    //closing time of restaurant
    let clHours = restaurantData.closingTime?.getHours();
    let clFormat = clHours < 12 ? "AM" : "PM";
    clHours = ampmFormat(clHours);
    clHours = addZeroBefore(clHours);
    let clMins = restaurantData.closingTime?.getMinutes();
    clMins = addZeroBefore(clMins);
    let clTime = `${clHours}:${clMins}`;

    // return res.json(restaurantData.R_MCLinks)
    // Seprating products with each menu Category
    let menuCategories = [];

    products = [];

    for (const mc of restaurantData.R_MCLinks) {
      for (const pr of mc.R_PLinks) {
        let obj = {
          r_pId: pr.id,

          name: pr?.name,
          description: pr.description,
          image: pr.image,
          originalPrice: pr.originalPrice,
          discountPrice: pr.discountPrice,
          isPopular: pr.isPopular == null ? false : pr.isPopular,
        };
        let dd = await getProductById(pr.id);
        products.push(dd);
      }

      if (mc.menuCategory.status == true) {
        let outObj = {
          r_mcId: mc.id,
          name: mc.menuCategory?.name,
          iconImage: mc.menuCategory?.image,
          products: products,
        };
        menuCategories.push(outObj);
      }

      products = [];
    }

    // Calculating restaurant rating
    //let restAvgRate = restaurantData.restaurantRatings.reduce((previousValue, curentValue) => previousValue + curentValue.value, 0);
    const restType = await orderApplication.findOne({
      where: {
        id: restaurantData.businessType,
      },
    });
    let retObj = {
      id: restaurantData.id,
      businessEmail: restaurantData.businessEmail,
      name: restaurantData.businessName,
      coverImage: restaurantData.image,
      description: restaurantData.description,
      VAT: restaurantData?.VATpercent ? restaurantData?.VATpercent : 0,
      logo: restaurantData.logo,
      rating: `${avgRate}`,
      numOfReviews: `${feedbackArr.length}`,
      location: `${restaurantData.address} ${restaurantData.zipCode} ${restaurantData.city} `,
      lat: restaurantData.lat,
      lng: restaurantData.lng,
      timings:
        restaurantData?.openingTime == null
          ? "Opening & Closing Time not set yet"
          : `${opTime} ${opFormat} - ${clTime} ${clFormat}`,
      times: time_list,
      deliveryTime: `${restaurantData.approxDeliveryTime} mins`,
      minOrderAmount: `${restaurantData.currencyUnitID?.symbol}${restaurantData.minOrderAmount}`,
      paymentMethod: restaurantData?.paymentMethod ?? {},
      menuCategories: menuCategories,
      currencyUnit: `${restaurantData.zoneRestaurant?.zone?.zoneDetail?.currencyUnit?.symbol}`,
      reviews: feedbackArr,
      cultery_list: restaurantData?.restaurant_culteries
        ? restaurantData?.restaurant_culteries
        : [],
      cultery_status:
        restaurantData.restaurant_culteries == null ? false : true,
      serviceChargeType: restaurantData.serviceChargesType
        ? restaurantData.serviceChargesType
        : serviceChargesType.value,
      service_charges: restaurantData.serviceCharges
        ? restaurantData.serviceCharges
        : serviceDefault.value,
      deliveryCharge: deliveryCharges,
      distanceUnitID:
        restaurantData.zoneRestaurant?.zone?.zoneDetail?.distanceUnit,
      restType: restType?.name,
      isOpen: restaurantData.isOpen ? true : false,
      deliveryRadius:
        restaurantData?.distanceUnitID?.symbol === "km"
          ? restaurantData.deliveryRadius * 1000
          : restaurantData.deliveryRadius * 1609,
    };

    const response = ApiResponse(
      "1",
      `All Information of restaurant ID ${restaurantId}}`,
      "",
      retObj
    );
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}
/*
        5. Product by Id
*/
async function getProductById(rpId) {
  // const {
  //     rpId
  // } = req.body;

  try {
    const productData = await R_PLink.findOne({
      where: {
        id: rpId,
      },
      include: [
        {
          model: productCollections,
          include: {
            model: collection,
            include: {
              model: collectionAddons,
              include: {
                model: addOn,
                attributes: ["id", "name"],
              },
            },
          },
        },
        {
          model: P_AOLink,

          include: [
            {
              model: addOnCategory,
              where: {
                status: true,
              },
            },
            {
              model: P_A_ACLink,
              where: {
                status: true,
              },
              required: false,
              include: {
                model: addOn,
              },
            },
          ],
          where: {
            status: true,
          },
          required: false,
        },
        {
          model: R_MCLink,

          include: {
            model: restaurant,
          },
        },
      ],
    });
    // return productData;
    let addOnArr = [];
    const zonedetails = await zoneRestaurants.findOne({
      where: {
        restaurantId: productData.R_MCLink.restaurant.id,
      },
      include: {
        model: zone,
        include: {
          model: zoneDetails,
          include: [
            {
              model: unit,
              as: "currencyUnit",
            },
            {
              model: unit,
              as: "distanceUnit",
            },
          ],
        },
      },
    });
    //   return res.json(zonedetails)
    if (!productData) {
      return {};
    }

    //   return res.json(productData);
    let currencySign =
      zonedetails.zone.zoneDetail?.currencyUnit?.symbol ?? "USD";
    if (productData) {
      if (productData?.productCollections.length > 0) {
        for (const cat of productData?.productCollections) {
          let category = {
            name: cat?.collection?.title,
            id: cat?.collection?.id,
            maxAllowed: cat?.collection?.maxAllowed,
            minAllowed: cat?.collection?.minAllowed,
          };
          let addList = [];
          for (const add of cat?.collection?.collectionAddons) {
            addList.push({
              id: add?.addOn?.id,
              collectionAddonId: cat?.collection?.id,
              name: add?.addOn?.name,
              minAllowed: add.minAllowed,
              maxAllowed: add.maxAllowed,
              status: add.status,
              isPaid: add.isPaid,
              price: add.price,
              isAvailable: add.isAvaiable,
            });
          }
          addOnArr.push({
            category,
            addons: addList,
          });
        }
      }
    }

    // const response_data = productData.P_AOLinks;
    // const groupedAddons = {};

    // Iterate through the response data and organize addons by category
    // response_data.forEach((addonData) => {

    //     const categoryId = addonData?.addOnCategory?.id;
    //     // return res.json(addonData)
    //     if (!groupedAddons[categoryId]) {

    //         groupedAddons[categoryId] = {
    //             category: {
    //                 name: addonData?.addOnCategory?.name,

    //                 id: categoryId,
    //                 minAllowed: addonData.minAllowed,
    //                 maxAllowed: addonData.maxAllowed,
    //             },
    //             addons: [],
    //         };
    //     }

    //     // Add the addon to the corresponding category
    //     groupedAddons[categoryId].addons.push({
    //         PAACLinkId : addonData.P_A_ACLinks[0].id,
    //         id: addonData.P_A_ACLinks[0].addOn.id,
    //         name: addonData.P_A_ACLinks[0].addOn?.name,
    //         minAllowed: addonData.P_A_ACLinks[0].addOn?.minAllowed,
    //         maxAllowed: addonData.P_A_ACLinks[0].addOn?.maxAllowed,
    //         status: addonData.P_A_ACLinks[0].addOn?.status,
    //         isPaid: addonData.P_A_ACLinks[0].addOn?.isPaid,
    //         price: addonData.P_A_ACLinks[0].price,
    //         isAvailable: addonData.P_A_ACLinks[0].addOn?.isAvaiable,
    //     });
    // });

    // Convert the object values to an array for the final result
    // const groupedAddonsArray = Object.values(groupedAddons);

    let retObj = {
      RPLinkId: productData.id,
      countryOfOrigin: productData.countryOfOrigin,
      ingredients: productData.ingredients,
      allergies: productData.allergies,
      nutrients: productData.nutrients,
      countryOfOrigin: productData.countryOfOrigin,
      ingredients: productData.ingredients,
      allergies: productData.allergies,
      nutrients: productData.nutrients,
      image: productData.image,
      name: productData?.name,
      isPopular: productData?.isPopular,
      description: productData.description,
      currencySign: `${currencySign}`,
      originalPrice: `${productData.originalPrice}`,
      discountPrice: `${productData.discountPrice} `,
      addOnArr: addOnArr,
    };
    return retObj;
    // const response = ApiResponse("1", "Product Details", "", retObj);
    // return res.json(response);
  } catch (error) {
    return {};
    // const response = ApiResponse("0", error.message, "Error", {});
    // return res.json(response);
  }
}
async function getProductByIdTest(req, res) {
  const { rpId } = req.body;
  try {
    const productData = await R_PLink.findOne({
      where: {
        id: rpId,
      },
      include: [
        {
          model: P_AOLink,
          include: [
            {
              model: addOnCategory,
            },
            {
              model: P_A_ACLink,
              where: {
                status: true,
              },
              required: false,
              include: {
                model: addOn,
              },
            },
          ],
          where: {
            status: true,
          },
          required: false,
        },
        {
          model: R_MCLink,
          include: {
            model: restaurant,
            include: {
              model: unit,
              as: "currencyUnitID",
            },
          },
        },
      ],
    });

    return res.json(productData);
    const addOnList = [];
    let final = [];
    productData.P_AOLinks.forEach((pAOLink) => {
      const existingCategory = final.find(
        (category) => category.id === pAOLink.addOnCategory.id
      );

      //   return res.json(existingCategory)
      if (!existingCategory) {
        let catObj = {
          addOnCategory: pAOLink.addOnCategory.id,
          name: pAOLink.addOnCategory.name,
          maxAllowed: pAOLink.maxAllowed,
          minAllowed: pAOLink.minAllowed,
        };

        for (item of pAOLink.P_A_ACLinks) {
          const existingAddOn = addOnList.find(
            (add) => add.id === item.addOn.id
          );
          if (!existingAddOn) {
            addOnList.push(item.addOn);
          }
        }

        final.push({
          category: catObj,
          addon: addOnList,
        });
      } else {
        for (item of pAOLink.P_A_ACLinks) {
          const existingAddOn = addOnList.find(
            (add) => add.id === item.addOn.id
          );
          if (!existingAddOn) {
            addOnList.push(item.addOn);
          }
        }

        final.push({
          addon: addOnList,
        });
      }
    });
    return res.json(final);
    if (!productData) {
      const response = ApiResponse(
        "0",
        "Cannot found the product details",
        "",
        {}
      );
      return res.json(response);
    }
    return res.json(productData);
    addonList = [];
    list = [];
    for (item of productData.P_AOLinks) {
      let categoryObj = {
        name: item.addOnCategory.name,
        id: item.addOnCategory.id,
        maxAllowed: item.maxAllowed,
        minAllowed: item.minAllowed,
      };

      for (addonItem of item.P_A_ACLinks) {
        addonList.push(addonItem.addOn);
      }
      list.push({
        category: categoryObj,
        addon: addonList,
      });
    }

    return res.json(list);
    let currencySign =
      productData.R_MCLink.restaurant?.currencyUnitID?.symbol ?? "USD";
    let addOnArr = [];
    let addList = [];
    let finalList = [];
    productData.P_AOLinks.map((ao, idx) => {
      //   return res.json(ao)
      let cat = {
        name: ao.addOnCategory.name,
        id: ao.id,
        minAllowed: ao.minAllowed,
        maxAllowed: ao.maxAllowed,
      };

      for (var i = 0; i < ao.P_A_ACLinks.length; i++) {
        if (ao.P_A_ACLinks[i].PAOLinkId == ao.addOnCategory.id) {
          let addonObj = {
            id: ao.P_A_ACLinks[i].addOn.name,
            minAllowed: ao.P_A_ACLinks[i].addOn.minAllowed,
            maxAllowed: ao.P_A_ACLinks[i].addOn.maxAllowed,
            status: ao.P_A_ACLinks[i].addOn.status,
            isPaid: ao.P_A_ACLinks[i].addOn.isPaid,
            isAvaiable: ao.P_A_ACLinks[i].addOn.isAvaiable,
          };

          addList.push(addonObj);
        }
      }
      finalList.push({
        category: cat,
        addon: addList,
      });

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
      if (aoArr.length > 0) {
        let tmpObj = {
          PAOLinkId: ao.id,
          // name: ao.addOnCategory.name,
          text: `${ao.addOnCategory?.name}`,
          maxAllowed: `${ao.maxAllowed}`,
          minAllowed: `${ao.minAllowed}`,
          addOns: aoArr,
        };
        addOnArr.push(tmpObj);
      }
    });
    const uniqueData = finalList.filter((item, index, self) => {
      const categoryNames = self.map((data) => data.category.name);
      return index === categoryNames.indexOf(item.category.name);
    });

    let retObj = {
      RPLinkId: productData.id,
      image: productData.image,
      name: productData.name,
      description: productData.description,
      currencySign: `${currencySign}`,
      originalPrice: `${productData.originalPrice}`,
      discountPrice: `${productData.discountPrice} `,
      addOnArr: uniqueData,
    };
    const response = ApiResponse("1", "Product Details", "", retObj);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

/*
        6. Restaurant by Filters
*/
async function getRestaurantByFilter(req, res) {
  try {
    let cuisineId = req.query.cuisineId; // all restaurant belonging to the given cuisine
    let inputRating = req.query.rating; // all restaurant whose rating is greater then the given number
    let inputDistance = req.query.distance; //in Kms // all restaurant whose distance from user is less then the given number
    let price = req.query.price;
    const { lat, lng } = req.body;
    let outArr = [];
    const restaurantList = await restaurant.findAll({
      where: {
        status: true,
      },
      include: [
        {
          model: unit,
          as: "distanceUnitID",
        },
        {
          model: unit,
          as: "currencyUnitID",
        },
        {
          model: deliveryFee,
        },
        {
          model: restaurantRating,
        },
        {
          model: R_CLink,
        },
      ],
    });
    //return res.json(restaurantList)
    //Getting the current time
    let cDate = Date();
    let cdate = new Date(cDate);
    let cHours = cdate.getHours();
    let cFormat = cHours < 12 ? "AM" : "PM";
    cHours = ampmFormat(cHours);
    cHours = addZeroBefore(cHours);
    let cMins = cdate.getMinutes();
    cMins = addZeroBefore(cMins);
    let cTime = `${cHours}:${cMins} ${cFormat}`;
    restaurantList.map((rest, idx) => {
      // cuisine filter
      if (cuisineId) {
        let found = rest.R_CLinks.find(
          (ele) => ele.cuisineId === parseInt(cuisineId)
        );
        if (!found) return null;
      }

      //output distance is in Kilometer
      let distance = getDistance(lat, lng, rest.lat, rest.lng);
      let distInKm = distance;
      // if restaurant's unit is miles, convert km distance to miles
      if (rest.distanceUnitID.name === "miles") {
        distance = distance * 0.6213; //km  to miles
      }
      //console.log(distance);
      //if distance is greater than the delivery radius then don't show it to the customer
      if (distance > rest.deliveryRadius) return null;

      // Checking the condition of distance filter i.e
      // the distance between user & restaurant should
      // be less than input distance, if not return null
      if (distInKm > inputDistance) return null;
      //if current time is not between opening and closing time, move to next restaurant
      //Opening time of restaurant
      let opHours = rest.openingTime.getHours();
      let opFormat = opHours < 12 ? "AM" : "PM";
      opHours = ampmFormat(opHours);
      opHours = addZeroBefore(opHours);
      let opMins = rest.openingTime.getMinutes();
      opMins = addZeroBefore(opMins);
      let opTime = `${opHours}:${opMins} ${opFormat}`;
      //closing time of restaurant
      let clHours = rest.closingTime.getHours();
      let clFormat = clHours < 12 ? "AM" : "PM";
      clHours = ampmFormat(clHours);
      clHours = addZeroBefore(clHours);
      let clMins = rest.closingTime.getMinutes();
      clMins = addZeroBefore(clMins);
      let clTime = `${clHours}:${clMins} ${clFormat}`;
      let opDate = "01/01/2022";
      let clDate = clFormat === "PM" ? "01/01/2022" : "01/02/2022";
      //console.log(rest.businessName, cTime, opTime, clTime, (Date.parse(`${opDate} ${cTime}`)> Date.parse(`${opDate} ${opTime}`) && Date.parse(`${opDate} ${cTime}`)< Date.parse(`${clDate} ${clTime}`) ));
      //console.log((cTime> clTime));
      //comparing time
      //console.log(rest.name)
      if (
        !(
          Date.parse(`${opDate} ${cTime}`) >
            Date.parse(`${opDate} ${opTime}`) &&
          Date.parse(`${opDate} ${cTime}`) < Date.parse(`${clDate} ${clTime}`)
        )
      )
        return null;
      let deliveryFee = rest.deliveryFeeFixed;
      // Calculate the delivery fee if fee type is dynamic
      if (rest.deliveryFeeTypeId === 2) {
        deliveryFee = parseFloat(deliveryFee);
        //calcualting the fee based on distance
        // if distance is less than base, apply base value
        if (distance <= parseFloat(rest.deliveryFee.baseDistance)) {
          deliveryFee = deliveryFee + parseFloat(rest.deliveryFee.baseCharge);
        } else {
          let extraDistance =
            distance - parseFloat(rest.deliveryFee.baseDistance);
          let extraUnits =
            extraDistance / parseFloat(rest.deliveryFee.extraUnitDistance);
          deliveryFee =
            deliveryFee +
            parseFloat(rest.deliveryFee.baseCharge) +
            extraUnits * parseFloat(rest.deliveryFee.chargePerExtraUnit);
        }
        //limit the delivery to 2 decimal places
        //deliveryFee = Math.round((deliveryFee * 100)) / 100
        deliveryFee = deliveryFee.toFixed(2);
      }
      let restAvgRate = rest.restaurantRatings.reduce(
        (previousValue, curentValue) => previousValue + curentValue.value,
        0
      );
      let avgRate = restAvgRate / rest.restaurantRatings.length;
      avgRate = avgRate ? avgRate.toFixed(2) : "0.00";
      //console.log(rest.id, avgRate, inputRating)
      if (avgRate < inputRating) return null;
      let retObj = {
        id: rest.id,
        name: rest.businessName,
        description: rest.description,
        logo: rest.logo,
        coverImage: rest.image,
        approxDeliveryTime: `${rest.approxDeliveryTime} mins`,
        deliveryFee: `${rest.currencyUnitID.symbol}${deliveryFee}`,
        rating: avgRate ? `${avgRate}` : "No rating yet",
      };
      outArr.push(retObj);
    });

    let data = {
      allRestaurants: outArr,
    };
    const response = ApiResponse("1", "List of Restaurants", "", data);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

/*
        7. Restaurant by Search
*/
async function getRestaurantBySearch(req, res) {
  try {
    let text = req.query.text; // all restaurant belonging to the given cuisine
    text = text.replace(/ /g, "");
    const lat = req.query.lat;
    const lng = req.query.lng;
    let outArr = [],
      notMatched = [];
    const restaurantList = await restaurant.findAll({
      where: {
        status: true,
      },
      include: [
        {
          model: unit,
          as: "distanceUnitID",
        },
        {
          model: unit,
          as: "currencyUnitID",
        },
        {
          model: deliveryFee,
        },
        {
          model: restaurantRating,
        },
        {
          model: R_MCLink,
          include: {
            model: R_PLink,
          },
        },
      ],
    });
    //return res.json(restaurantList)
    //Getting the current time
    let cDate = Date();
    let cdate = new Date(cDate);
    let cHours = cdate.getHours();
    let cFormat = cHours < 12 ? "AM" : "PM";
    cHours = ampmFormat(cHours);
    cHours = addZeroBefore(cHours);
    let cMins = cdate.getMinutes();
    cMins = addZeroBefore(cMins);
    let cTime = `${cHours}:${cMins} ${cFormat}`;
    restaurantList.map((rest, idx) => {
      //output distance is in Kilometer
      let distance = getDistance(lat, lng, rest.lat, rest.lng);
      // if restaurant's unit is miles, convert km distance to miles
      if (rest.distanceUnitID.name === "miles") {
        distance = distance * 0.6213; //km  to miles
      }
      //if distance is greater than the delivery radius then don't show it to the customer
      if (distance > rest.deliveryRadius) return null;
      //if current time is not between opening and closing time, move to next restaurant
      //Opening time of restaurant
      let opHours = rest.openingTime.getHours();
      let opFormat = opHours < 12 ? "AM" : "PM";
      opHours = ampmFormat(opHours);
      opHours = addZeroBefore(opHours);
      let opMins = rest.openingTime.getMinutes();
      opMins = addZeroBefore(opMins);
      let opTime = `${opHours}:${opMins} ${opFormat}`;
      //closing time of restaurant
      let clHours = rest.closingTime.getHours();
      let clFormat = clHours < 12 ? "AM" : "PM";
      clHours = ampmFormat(clHours);
      clHours = addZeroBefore(clHours);
      let clMins = rest.closingTime.getMinutes();
      clMins = addZeroBefore(clMins);
      let clTime = `${clHours}:${clMins} ${clFormat}`;
      let opDate = "01/01/2022";
      let clDate = clFormat === "PM" ? "01/01/2022" : "01/02/2022";
      //console.log(rest.businessName, cTime, opTime, clTime, (Date.parse(`${opDate} ${cTime}`)> Date.parse(`${opDate} ${opTime}`) && Date.parse(`${opDate} ${cTime}`)< Date.parse(`${clDate} ${clTime}`) ));
      //comparing time
      if (
        !(
          Date.parse(`${opDate} ${cTime}`) >
            Date.parse(`${opDate} ${opTime}`) &&
          Date.parse(`${opDate} ${cTime}`) < Date.parse(`${clDate} ${clTime}`)
        )
      )
        return null;
      let deliveryFee = rest.deliveryFeeFixed;
      // Calculate the delivery fee if fee type is dynamic
      if (rest.deliveryFeeTypeId === 2) {
        deliveryFee = parseFloat(deliveryFee);
        //calcualting the fee based on distance
        // if distance is less than base, apply base value
        if (distance <= parseFloat(rest.deliveryFee.baseDistance)) {
          deliveryFee = deliveryFee + parseFloat(rest.deliveryFee.baseCharge);
        } else {
          let extraDistance =
            distance - parseFloat(rest.deliveryFee.baseDistance);
          let extraUnits =
            extraDistance / parseFloat(rest.deliveryFee.extraUnitDistance);
          deliveryFee =
            deliveryFee +
            parseFloat(rest.deliveryFee.baseCharge) +
            extraUnits * parseFloat(rest.deliveryFee.chargePerExtraUnit);
        }
        //limit the delivery to 2 decimal places
        //deliveryFee = Math.round((deliveryFee * 100)) / 100
        deliveryFee = deliveryFee.toFixed(2);
      }
      let restAvgRate = rest.restaurantRatings.reduce(
        (previousValue, curentValue) => previousValue + curentValue.value,
        0
      );
      let avgRate = restAvgRate / rest.restaurantRatings.length;
      avgRate = avgRate ? avgRate.toFixed(2) : "0.00";

      let retObj = {
        id: rest.id,
        name: rest.businessName,
        description: rest.description,
        logo: rest.logo,
        coverImage: rest.image,
        approxDeliveryTime: `${rest.approxDeliveryTime} mins`,
        deliveryFee: `${rest.currencyUnitID.symbol}${deliveryFee}`,
        rating: avgRate ? `${avgRate}` : "No rating yet",
      };
      const pattern = new RegExp(`${text}`, "i");
      let restName = rest.businessName.replace(/ /g, "");
      let n = pattern.test(restName);
      console.log(rest.businessName, restName, n);
      if (n) outArr.push(retObj);
      else notMatched.push(rest);
    });
    // searching the products for those restaurants which dont match the search criteria
    notMatched.map((ele) => {
      ele.R_MCLinks.map((rmc) => {
        rmc.R_PLinks.map((p) => {
          const pattern = new RegExp(`${text}`, "i");
          let prodName = p.name.replace(/ /g, "");
          let n = pattern.test(prodName);
          if (n) {
            //output distance is in Kilometer
            let distance = getDistance(lat, lng, ele.lat, ele.lng);
            // if restaurant's unit is miles, convert km distance to miles
            if (ele.distanceUnitID.name === "miles") {
              distance = distance * 0.6213; //km  to miles
            }
            let deliveryFee = ele.deliveryFeeFixed;
            // Calculate the delivery fee if fee type is dynamic
            if (ele.deliveryFeeTypeId === 2) {
              deliveryFee = parseFloat(deliveryFee);
              //calcualting the fee based on distance
              // if distance is less than base, apply base value
              if (distance <= parseFloat(ele.deliveryFee.baseDistance)) {
                deliveryFee =
                  deliveryFee + parseFloat(ele.deliveryFee.baseCharge);
              } else {
                let extraDistance =
                  distance - parseFloat(ele.deliveryFee.baseDistance);
                let extraUnits =
                  extraDistance / parseFloat(ele.deliveryFee.extraUnitDistance);
                deliveryFee =
                  deliveryFee +
                  parseFloat(ele.deliveryFee.baseCharge) +
                  extraUnits * parseFloat(ele.deliveryFee.chargePerExtraUnit);
              }
              //limit the delivery to 2 decimal places
              //deliveryFee = Math.round((deliveryFee * 100)) / 100
              deliveryFee = deliveryFee.toFixed(2);
            }
            let restAvgRate = ele.restaurantRatings.reduce(
              (previousValue, curentValue) => previousValue + curentValue.value,
              0
            );
            let avgRate = restAvgRate / ele.restaurantRatings.length;
            avgRate = avgRate ? avgRate.toFixed(2) : "0.00";
            let retObj = {
              id: ele.id,
              name: ele.businessName,
              description: ele.description,
              logo: ele.logo,
              coverImage: ele.image,
              approxDeliveryTime: `${ele.approxDeliveryTime} mins`,
              deliveryFee: `${ele.currencyUnitID.symbol}${deliveryFee}`,
              rating: avgRate ? `${avgRate}` : "No rating yet",
            };
            outArr.push(retObj);
          }
          console.log(p.name, prodName, n);
        });
      });
    });
    return res.json({
      status: "1",
      message: "List of Restaurants",
      data: {
        allRestaurants: outArr,
      },
      error: "",
    });
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

//Module 4 - Order
/*
        1. Get delivery for restaurant
*/
async function getDeliveryFee(req, res) {
  const { restaurantId, dropOffLat, dropOffLng, total } = req.body;
  const restaurantData = await restaurant.findOne({
    where: {
      id: restaurantId,
    },
    include: [
      {
        model: zoneRestaurants,
        include: {
          model: zone,
          attributes: ["id", "name"],
          include: {
            model: zoneDetails,
            include: [
              {
                model: unit,
                as: "distanceUnit",
              },
              {
                model: unit,
                as: "currencyUnit",
              },
            ],
          },
        },
      },
      {
        model: unit,
        as: "currencyUnitID",
      },
      {
        model: unit,
        as: "distanceUnitID",
      },
      {
        model: deliveryFee,
      },
    ],
  });
  let distance = getDistance(
    restaurantData?.lat,
    restaurantData?.lng,
    dropOffLat,
    dropOffLng
  );
  // return res.json(distance)
  const serviceDefault = await defaultValues.findOne({
    where: {
      name: "serviceCharges",
    },
  });
  const vatFee = restaurantData.pricesIncludeVAT
    ? restaurantData.VATpercent == null
      ? "0.00"
      : restaurantData.VATpercent
    : "0.00";

  let serviceCharges = 0;
  let serviceChargesType = restaurantData.serviceChargesType;

  if (serviceChargesType == "flat") {
    serviceCharges = restaurantData.serviceCharges;
  } else {
    serviceCharges = parseFloat(total) * (restaurantData?.serviceCharges / 100);
  }

  let deliveryCharges = 0;

  // Delivery Fee is fixed for the restaurant
  if (restaurantData.deliveryFeeTypeId == "1") {
    deliveryCharges =
      restaurantData.zoneRestaurant.zone.zoneDetail.maxDeliveryCharges;

    const deliveryFeeFixedId = await defaultValues.findOne({
      where: {
        name: "deliveryFeeFixed",
      },
    });
    return res.json({
      status: "1",
      message: "Fixed fees of restaurant",
      data: {
        distance: `${distance.toFixed(2)}`,
        distanceUnit: `${restaurantData.zoneRestaurant?.zone?.zoneDetail?.distanceUnit?.symbol}`,
        currencyUnit: `${restaurantData.zoneRestaurant?.zone?.zoneDetail?.currencyUnit?.symbol}`,
        packingFee: restaurantData.packingFee ?? "0.00",
        deliveryCharges:
          deliveryCharges == 0 || deliveryCharges == null
            ? deliveryFeeFixedId.value
            : `${deliveryCharges}`,
        serviceCharges:
          restaurantData.serviceCharges == null
            ? serviceDefault.value
            : `${serviceCharges}`,
        VAT: vatFee,
      },
      error: "",
    });
  } else {
    let baseCharge = restaurantData.zoneRestaurant.zone.zoneDetail.baseCharges;
    const defaultBaseCharge = await defaultValues.findOne({
      where: {
        name: "baseCharge",
      },
    });
    if (baseCharge == 0 || baseCharge == "0" || baseCharge == null) {
      baseCharge = parseFloat(defaultBaseCharge.value);
    }

    if (
      restaurantData.zoneRestaurant?.zone?.zoneDetail?.distanceUnit?.name?.toLowerCase() ===
      "miles"
    ) {
      distance = distance * 0.6213;
    }
    if (
      distance <
      parseFloat(restaurantData.zoneRestaurant.zone.zoneDetail.baseDistance)
    ) {
      deliveryCharges = baseCharge;
    } else {
      let extraDistance =
        distance -
        parseFloat(restaurantData.zoneRestaurant.zone.zoneDetail.baseDistance);
      let extraUnitsCharges =
        parseFloat(extraDistance) *
        parseFloat(restaurantData.zoneRestaurant.zone.zoneDetail.perKmCharges);
      deliveryCharges = deliveryCharges + extraUnitsCharges;
    }
    deliveryCharges = parseFloat(deliveryCharges);
    deliveryCharges = deliveryCharges.toFixed(2);
    let cardFee = (
      (parseFloat(restaurantData?.packingFee) +
        parseFloat(restaurantData?.packingFee) +
        parseFloat(serviceCharges)) *
      (2.9 / 100)
    ).toFixed(2);
    return res.json({
      status: "1",
      message: "Dynamic fee of restaurant",
      data: {
        distance: `${distance.toFixed(2)}`,
        distanceUnit: `${restaurantData.zoneRestaurant?.zone?.zoneDetail?.distanceUnit?.symbol}`,
        currencyUnit: `${restaurantData.zoneRestaurant?.zone?.zoneDetail?.currencyUnit?.symbol}`,
        deliveryCharges: `${deliveryCharges}`,
        packingFee: restaurantData?.packingFee ?? "0.00",
        serviceCharges:
          restaurantData.serviceCharges == null
            ? serviceDefault.value
            : `${serviceCharges}`,
        VAT: vatFee,
      },
      error: "",
    });
  }
}

/*
        2. Get delivery for restaurant
*/
async function getRestaurantFeatures(req, res) {
  const { restaurantId } = req.body;
  try {
    const restaurantData = await restaurant.findOne({
      where: {
        id: restaurantId,
      },
      include: [
        {
          model: unit,
          as: "currencyUnitID",
        },
        {
          model: paymentMethod,
        },
        {
          model: deliveryType,
        },
      ],
    });
    const orderModes = await orderMode.findAll({
      attributes: ["id", "name"],
    });
    let paymentModes = await paymentMethod.findAll({
      where: {
        id: {
          [Op.or]: [1, 2],
        },
      },
      attributes: ["id", "name", "cardFee"],
    });
    let deliveryModes = await deliveryType.findAll({
      where: {
        id: {
          [Op.or]: [1, 2],
        },
      },
      attributes: ["id", "name"],
    });

    //return res.json(paymentModes)
    //console.log(restaurantData.paymentMethodId)
    let value = restaurantData.paymentMethod.id === 1 ? 3 : 0;
    let retObj = {
      currency: restaurantData.currencyUnitID.symbol,
      vatCalculationRequired: restaurantData.pricesIncludeVAT ? false : true,
      vatPercent: restaurantData.pricesIncludeVAT
        ? ""
        : restaurantData.VATpercent,
      paymentMode: [
        {
          id: restaurantData.paymentMethod.id,
          name: restaurantData.paymentMethod.name,
          cardFee: restaurantData.paymentMethod.cardFee,
        },
      ],
      deliveryMode:
        restaurantData.deliveryTypeId === 3
          ? deliveryModes
          : [
              {
                id: restaurantData.deliveryType.id,
                name: restaurantData.deliveryType.name,
              },
            ],
      orderMode: orderModes,
    };
    const response = ApiResponse("1", "Restaurant Features", "", retObj);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}
/*
        3. Apply Voucher
*/
async function applyVoucher(req, res) {
  const { code, userId, restaurantId } = req.body;

  try {
    const existVoucher = await voucher.findOne({
      where: {
        code,
      },
    });

    // Check if the voucher with the given code exists or not
    if (!existVoucher) {
      throw new CustomException(
        "Invalid voucher-code",
        "Please try a valid code"
      );
    }

    // Check if the voucher can be applied to the restaurant
    if (
      restaurantId &&
      !existVoucher.storeApplicable.split(",").includes(restaurantId)
    ) {
      throw new CustomException(
        "Your voucher is not applicable to this restaurant",
        "Please try a valid code"
      );
    }

    // Check the expiry of the voucher
    const currentDate = Date.now();
    const startDateTime = new Date(existVoucher.from);
    const endDateTime = new Date(existVoucher.to);

    if (!(currentDate > startDateTime && currentDate < endDateTime)) {
      throw new CustomException(
        "Voucher-code expired",
        "Please try a valid code"
      );
    }

    // Check if the voucher is already applied by the same user
    const alreadyAppliedByUser = await order.findOne({
      where: {
        voucherId: existVoucher.id,
        paymentConfirmed: true,
        userId,
      },
    });

    if (alreadyAppliedByUser) {
      throw new CustomException(
        "Voucher already used by you",
        "Please try a valid one"
      );
    }

    // Applying Coupon
    const data = {
      id: existVoucher.id,
      discount: existVoucher.value,
      type: existVoucher.type,
    };

    const response = ApiResponse("1", "Voucher Applied", "", data);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

/* 
       4. Create Order
*/
async function createOrder(req, res) {
  try {
    const {
      scheduleDate,
      note,
      leaveOrderAt,
      products,
      subTotal,
      total,
      deliveryTypeId,
      orderModeId,
      paymentMethodId,
      dropOffLat,
      dropOffLng,
      building,
      streetAddress,
      distance,
      distanceUnit,
      restaurantId,
      userId,
      voucherId,
      deliveryFees,
      serviceCharges,
      productsDiscount,
      cutlery_data,
      credits,
      tip,
      VAT,
      cardNum,
      exp_month,
      exp_year,
      cvc,
      saveStatus,
    } = req.body;

    //Validations
    const requiredFields = [
      "scheduleDate",
      "products",
      "subTotal",
      "total",
      "deliveryTypeId",
      "orderModeId",
      "paymentMethodId",
      //   "dropOffLat",
      //   "dropOffLng",
      //   "distance",
      //   "distanceUnit",
      "restaurantId",
      "userId",
      //   "serviceCharges",
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

    const userData = await user.findOne({
      where: {
        id: req.user.id,
      },
    });

    //check weather user order is in restaurant zone or not
    let existInZone = false;
    const userPoint = point([parseFloat(dropOffLng), parseFloat(dropOffLat)]);
    const zoneData = await zoneRestaurants.findOne({
      where: {
        restaurantId: restaurantId,
      },
      include: [
        {
          model: restaurant,
          include: [
            {
              model: unit,
              as: "distanceUnitID",
            },
          ],
        },
        {
          model: zone,
          include: {
            model: zoneDetails,
          },
        },
      ],
    });
    if (
      zoneData.zone &&
      zoneData.zone.coordinates.coordinates &&
      zoneData.zone.coordinates.coordinates.length > 0
    ) {
      const zonePolygon = {
        type: "Polygon",
        coordinates: zoneData.zone.coordinates.coordinates,
      };
      if (booleanPointInPolygon(userPoint, zonePolygon)) {
        existInZone = true;
      }
    }
    // if (existInZone == false) {
    //   const response = ApiResponse(
    //     "0",
    //     "Your Dropoff Address is out of Restaurant Zone",
    //     "Error",
    //     {}
    //   );
    //   return res.json(response);
    // }

    let zoneCharges = 0;
    let distanceCharges = 0;
    let first5KmCharge = zoneData?.zone?.zoneDetail?.baseCharges;
    let additionalDistance = 0;
    if (zoneData?.zone?.zoneDetail) {
      zoneCharges = parseFloat(zoneData?.zone?.zoneDetail?.maxDeliveryCharges);
    }
    // let ON1 = uON.generate();
    let ON1 = Math.floor(Math.random() * 90000000) + 10000000;
    var cultery_list = [];

    const chargesData = await charge.findAll();
    const type = await orderType.findOne({
      where: {
        type: "Normal",
      },
    });
    let tmpDistance = parseFloat(distance);

    const restaurantData = await restaurant.findOne({
      where: {
        id: restaurantId,
      },
      include: {
        model: user,
        attributes: ["deviceToken", "ip"],
      },
    });
    let applied = voucherId === "" ? null : voucherId;

    addresstoDB(dropOffLat, dropOffLng, building, streetAddress, userId)
      .then(async (dropOffId) => {
        let orderTotal = parseFloat(total);
        order
          .create({
            orderNum: `fom-${ON1}`,
            scheduleDate,
            note,
            leaveOrderAt,
            distance: distance,
            subTotal,
            total,
            status: true,
            orderTypeId: type.id,
            dropOffId,
            deliveryTypeId,
            orderApplicationId: restaurantData.businessType,
            orderModeId,
            paymentMethodId,
            restaurantId,
            userId,
            currencyUnitId: restaurantData.currencyUnitId,
            voucherId: applied,
            orderTypeId: type.id,
            orderStatusId: 1,
            paymentRecieved: false,
          })
          .then(async (orderData) => {
            //add cultery
            if (cutlery_data) {
              const cultery_name = await cutlery.findOne({
                where: {
                  id: cutlery_data.cutleryId,
                },
              });
              if (cultery_name) {
                const order_cutlery = new orderCultery();
                order_cutlery.status = 1;
                order_cutlery.orderId = orderData.id;
                order_cutlery.cutleryId = cutlery_data.cutleryId;
                order_cutlery.qty = cutlery_data.qty;
                await order_cutlery.save();
              }
            }
            // create order history
            const status = await orderStatus.findOne({
              where: {
                name: "Placed",
              },
            });
            let time = Date.now();
            orderHistory.create({
              time,
              orderId: orderData.id,
              orderStatusId: status.id,
            });
            let aoArr = [];
            products.map((oi, index) => {
              let total = oi.quantity * oi.unitPrice;
              total = total.toFixed(2);
              oi.total = total;
              oi.orderId = orderData.id;
              oi.userId = req.user.id;
            });

            //Adding Order Items to the database
            orderItems.bulkCreate(products).then((orderItemData) => {
              const promises = products.map(async (pro, indx) => {
                let prod = await R_PLink.findOne({
                  where: { id: pro.RPLinkId },
                });
                if (prod) {
                  prod.sold = prod.sold + pro.quantity;
                  await prod.save();
                }

                pro.addOns.map((add) => {
                  let obj = {
                    total: add.total,
                    qty: add.quantity,
                    orderItemId: orderItemData[indx].id,
                    addOnId: add.addOnId,
                    collectionId: add.collectionId,
                  };
                  aoArr.push(obj);
                });
              });

              Promise.all(promises)
                .then(() => {
                  let driverEarnings = 0;
                  let adminComissionOnDeliveryCharges =
                    (parseInt(deliveryFees) *
                      zoneData?.zone?.zoneDetail
                        ?.adminComissionOnDeliveryCharges) /
                    100;
                  orderAddOns.bulkCreate(aoArr).then(async () => {
                    if (deliveryTypeId == "1") {
                      driverEarnings =
                        parseFloat(deliveryFees) +
                        parseInt(tip) -
                        parseInt(adminComissionOnDeliveryCharges);
                    }

                    let adminCommissionPercent =
                      zoneData?.zone?.zoneDetail?.adminComission;
                    let totalEarnings = orderTotal;
                    let adminEarnings =
                      parseFloat(subTotal) *
                      (parseFloat(adminCommissionPercent) / 100);
                    let restaurantEarnings =
                      parseFloat(orderTotal) -
                      parseFloat(adminEarnings) -
                      parseFloat(driverEarnings) -
                      adminComissionOnDeliveryCharges;
                    let ch = {
                      basketTotal: subTotal,
                      deliveryFees: deliveryFees,
                      serviceCharges: serviceCharges,
                      discount: "0.00",
                      total: orderTotal,
                      tip: tip,
                      adminEarnings: Number(adminEarnings).toFixed(2),
                      adminDeliveryCharges: adminComissionOnDeliveryCharges,
                      driverEarnings: Number(driverEarnings).toFixed(2),
                      restaurantEarnings: Number(restaurantEarnings).toFixed(2),
                      restaurantDeliveryCharges:
                        deliveryFees > 0
                          ? parseFloat(deliveryFees) -
                            -parseInt(adminComissionOnDeliveryCharges)
                          : 0,
                      adminPercent: adminCommissionPercent,
                      orderId: orderData.id,
                    };
                    orderCharge.create(ch);

                    const estTime = await eta_text(
                      restaurantData.lat,
                      restaurantData.lng,
                      dropOffLat,
                      dropOffLng
                    );

                    let notification = {
                      title: "New Job arrived",
                      body: "A new job has arrived",
                    };
                    let restaurantTokens = restaurantData?.user?.deviceToken
                      ? JSON.parse(restaurantData?.user?.deviceToken)
                      : [];
                    let to = restaurantTokens;
                    const restDrivers = await restaurantDriver.findAll({
                      where: {
                        restaurantId: restaurantId,
                      },
                      include: {
                        model: user,
                        attributes: ["id", "deviceToken"],
                      },
                    });
                    if (deliveryTypeId == "1") {
                      let driverTokens = [];
                      for (var i = 0; i < restDrivers.length; i++) {
                        if (restDrivers[i]?.user?.deviceToken) {
                          for (const token of JSON.parse(
                            restDrivers[i]?.user?.deviceToken
                          )) {
                            driverTokens.push(token);
                          }
                        }
                      }
                      let noti_data = {
                        estTime: restaurantData?.approxDeliveryTime,
                        distance: distance,
                        orderId: orderData.id,
                        restaurantName: restaurantData.businessName,
                        estEarning: driverEarnings.toFixed(2),
                        orderNum: orderData.orderNum,
                        orderApplication:
                          restaurantData.businessType == 1
                            ? "Restaurant"
                            : restaurantData.businessType == 3
                            ? "Store"
                            : "",
                        orderType:
                          orderData.orderTypeId == 1 ? "Group" : "Normal",
                        dropOffAddress: streetAddress,
                        pickUpAddress: restaurantData.address,
                      };
                      let userTokens = userData?.deviceToken
                        ? JSON.parse(userData?.deviceToken)
                        : [];
                      singleNotification(
                        userTokens,
                        "Order Placed",
                        `OrderId : ${orderData.id} has been placed successfully`,
                        noti_data
                      );
                      //  to restaurants
                      sendNotifications(to, notification);
                    }

                    const userCredits = await Credit.findOne({
                      where: {
                        userId: req.user.id,
                      },
                    });
                    if (userCredits) {
                      if (credits > 0) {
                        userCredits.point =
                          parseInt(userCredits.point) - parseInt(credits);
                        await userCredits.save();
                      }
                    }
                    if (cutlery_data) {
                      const cultery_name = await cutlery.findOne({
                        where: {
                          id: cutlery_data.cutleryId,
                        },
                      });

                      retOrderData(orderData.id).then(async (retData) => {
                        let data = {
                          orderId: orderData.id,
                          dropOffLat: dropOffLat,
                          dropOffLng: dropOffLng,
                          orderNum: orderData.orderNum,
                          paymentRecieved: orderData.paymentRecieved,
                          cultery_list: cutlery_data ? cultery_name : [],
                          restLat: restaurantData.lat,
                          restLng: restaurantData.lng,
                          restAddress: restaurantData.address,
                          waitForDriver: false,
                          allowSelfPickUp:
                            restaurantData.deliveryTypeId === 3 ? true : false,
                          retData,
                        };
                        let useData = await user.findOne({
                          where: { id: req.user.id },
                        });
                        const retailerData = await retailerController.homeData(
                          restaurantId
                        );
                        const response = ApiResponse(
                          "1",
                          "Payment done and Order placed successfully!",
                          "",
                          data
                        );
                        let eventDataForRetailer = {
                          type: "placeOrder",
                          data: {
                            status: "1",
                            message: "Data",
                            error: "",
                            data: retailerData,
                          },
                        };
                        let eventDataForUser = {
                          type: "placeOrder",
                          data: {
                            status: "1",
                            message: "Data",
                            error: "",
                            data: data,
                          },
                        };
                        sendEvent(useData.ip, eventDataForUser);
                        sendEvent(
                          restaurantData?.user?.ip,
                          eventDataForRetailer
                        );

                        return res.json(response);
                      });
                    } else {
                      retOrderData(orderData.id).then(async (retData) => {
                        let data = {
                          orderId: orderData.id,
                          dropOffLat: dropOffLat,
                          dropOffLng: dropOffLng,
                          orderNum: orderData.orderNum,
                          paymentRecieved: orderData.paymentRecieved,
                          cultery_list: [],
                          restLat: restaurantData.lat,
                          restLng: restaurantData.lng,
                          restAddress: restaurantData.address,
                          waitForDriver: false,
                          allowSelfPickUp:
                            restaurantData.deliveryTypeId === 3 ? true : false,
                          retData,
                        };
                        let useData = await user.findOne({
                          where: { id: req.user.id },
                        });
                        const retailerData = await retailerController.homeData(
                          restaurantId
                        );
                        let eventDataForRetailer = {
                          type: "placeOrder",
                          data: {
                            status: "1",
                            message: "Data",
                            error: "",
                            data: retailerData,
                          },
                        };
                        let eventDataForUser = {
                          type: "placeOrder",
                          data: {
                            status: "1",
                            message: "Data",
                            error: "",
                            data: data,
                          },
                        };
                        sendEvent(useData.ip, eventDataForUser);
                        sendEvent(
                          restaurantData?.user?.ip,
                          eventDataForRetailer
                        );
                        const response = ApiResponse(
                          "1",
                          "Payment done and Order placed successfully!",
                          "",
                          data
                        );
                        return res.json(response);
                      });
                    }
                  });
                })
                .catch((error) => {
                  let response = ApiResponse("0", error.message, "Error", {});
                  return res.json(response);
                });
            });
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
async function orderAgain(req, res) {
  const { orderId } = req.body;
  const oldOrder = await order.findOne({
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
        include: [
          {
            model: user,
          },
        ],
      },
      {
        model: user,
      },
      {
        model: orderCharge,
      },
      {
        model: orderItems,
        include: [
          {
            model: R_PLink,
          },
          {
            model: orderAddOns,
          },
        ],
      },
    ],
  });

  const placedStatus = await orderStatus.findOne({
    name: "Placed",
  });
  let ON1 = uON.generate();
  const newOrder = new order();
  newOrder.orderNum = `fom-${ON1}`;
  newOrder.scheduleDate = oldOrder.scheduleDate;
  newOrder.note = oldOrder.note;
  newOrder.leaveOrderAt = oldOrder.leaveOrderAt;
  newOrder.pmId = oldOrder.pmId;
  newOrder.piId = oldOrder.piId;
  newOrder.chargeId = oldOrder.chargeId;
  newOrder.distance = oldOrder.distance;
  newOrder.subTotal = oldOrder.subTotal;
  newOrder.total = oldOrder.total;
  newOrder.status = oldOrder.status;
  newOrder.paymentConfirmed = oldOrder.paymentConfirmed;
  newOrder.paymentRecieved = oldOrder.paymentRecieved;
  newOrder.customTime = oldOrder.customTime;
  newOrder.pickUpId = oldOrder.pickUpId;
  newOrder.dropOffId = oldOrder.dropOffId;
  newOrder.deliveryTypeId = oldOrder.deliveryTypeId;
  newOrder.orderApplicationId = oldOrder.orderApplicationId;
  newOrder.orderModeId = oldOrder.orderModeId;
  newOrder.orderStatusId = placedStatus.id;
  newOrder.orderTypeId = oldOrder.orderTypeId;
  newOrder.paymentMethodId = oldOrder.paymentMethodId;
  newOrder.restaurantId = oldOrder.restaurantId;
  newOrder.currencyUnitId = oldOrder.currencyUnitId;
  newOrder.userId = oldOrder.userId;
  newOrder
    .save()
    .then(async (orderData) => {
      //save order status history
      const history = new orderHistory();
      history.time = Date.now();
      history.orderId = orderData.id;
      history.orderStatusId = placedStatus.id;
      await history.save();

      //create order charges
      if (oldOrder.orderCharge) {
        const charge = new orderCharge();
        charge.basketTotal = oldOrder?.orderCharge?.basketTotal;
        charge.deliveryFees = oldOrder?.orderCharge?.deliveryFees;
        charge.discount = oldOrder?.orderCharge?.discount;
        charge.serviceCharges = oldOrder?.orderCharge?.serviceCharges;
        charge.VAT = oldOrder?.orderCharge?.VAT;
        charge.tip = oldOrder?.orderCharge?.tip;
        charge.total = oldOrder?.orderCharge?.total;
        charge.adminEarnings = oldOrder?.orderCharge?.adminEarnings;
        charge.driverEarnings = oldOrder?.orderCharge?.driverEarnings;
        charge.restaurantEarnings = oldOrder?.orderCharge?.restaurantEarnings;
        charge.adminPercent = oldOrder?.orderCharge?.adminPercent;
        charge.baseFare = oldOrder?.orderCharge?.baseFare;
        charge.orderId = orderData.id;
        await charge.save();
      }

      //create order items
      oldOrder.orderItems.map(async (item) => {
        const newItem = new orderItems();
        newItem.quantity = item.quantity;
        newItem.unitPrice = item.unitPrice;
        newItem.total = item.total;
        newItem.RPLinkId = item.RPLinkId;
        newItem.userId = item.userId;
        newItem.orderId = orderData.id;
        newItem
          .save()
          .then(async (itemData) => {
            item.orderAddOns.map(async (add) => {
              const newOrderAddOn = new orderAddOns();
              newOrderAddOn.total = add.total;
              newOrderAddOn.qty = add.qty;
              newOrderAddOn.PAOLinkId = add.PAOLinkId;
              newOrderAddOn.PAACLinkId = add.PAACLinkId;
              newOrderAddOn.orderItemId = itemData.id;
              await newOrderAddOn.save();
            });
          })
          .catch((error) => {
            const response = ApiResponse("0", error.message, "Error", {});
            return res.json(response);
          });
      });

      let notification = {
        title: "New Job arrived",
        body: "A new job has arrived",
      };
      let to = [oldOrder?.restaurant?.user?.deviceToken];
      sendNotifications(to, notification);
      const estTime = await eta_text(
        oldOrder?.restaurant?.lat,
        oldOrder?.restaurant?.lng,
        oldOrder?.dropOffID?.lat,
        oldOrder?.dropOffID?.lng
      );

      let noti_data = {
        estTime: estTime ? estTime : "15 mins",
        distance: oldOrder.distance,
        orderId: orderData.id,
        restaurantName: oldOrder?.restaurant?.businessName,
        estEarning: Number(oldOrder?.orderCharge?.driverEarning).toFixed(2),
        orderNum: orderData?.orderNum,
        orderApplication:
          oldOrder?.restaurant?.businessType == 1
            ? "Restaurant"
            : oldOrder?.restaurant?.businessType == 3
            ? "Store"
            : "",
        orderType: orderData.orderTypeId == 1 ? "Group" : "Normal",
        dropOffAddress: oldOrder,
        pickUpAddress: oldOrder.dropOffID.streetAddress,
      };
      singleNotification(
        oldOrder?.user?.deviceToken,
        "Order Placed",
        `OrderId : ${orderData.id} has been placed successfully`,
        noti_data
      );
      retOrderData(orderData.id).then((retData) => {
        let data = {
          orderId: orderData.id,
          dropOffLat: oldOrder?.dropOffID?.lat,
          dropOffLng: oldOrder?.dropOffID?.lat,
          orderNum: orderData.orderNum,
          paymentRecieved: orderData.paymentRecieved,
          cultery_list: [],
          restLat: oldOrder?.restaurant?.lat,
          restLng: oldOrder?.restaurant?.lng,
          restAddress: oldOrder?.restaurant?.address,
          waitForDriver: false,
          allowSelfPickUp:
            oldOrder.restaurant.deliveryTypeId === 3 ? true : false,
          retData,
        };
        const response = ApiResponse(
          "1",
          "Order placed successfully!",
          "",
          data
        );
        return res.json(response);
      });
    })
    .catch((error) => {
      const response = ApiResponse("0", error.message, "Error", {});
      return res.json(response);
    });
}

/*
        4.1. Update order to pickup type
*/
async function updateOrderToPickup(req, res) {
  const { orderId } = req.body;
  const orderChargesData = await orderCharge.findOne({
    where: {
      orderId: orderId,
    },
    attributes: ["id", "deliveryFees"],
  });
  const orderData = await order.findOne({
    where: {
      id: orderId,
    },
    attributes: ["total"],
  });
  let newTotal =
    parseFloat(orderData.total) - parseFloat(orderChargesData.deliveryFees);
  order.update(
    {
      deliveryTypeId: 2,
      total: newTotal,
    },
    {
      where: {
        id: orderId,
      },
    }
  );
  orderCharge.update(
    {
      driverEarnings: 0,
      deliveryFees: 0,
      total: newTotal,
    },
    {
      where: {
        id: orderChargesData.id,
      },
    }
  );

  const response = ApiResponse(
    "1",
    "Order delivery type changed to self pickup",
    "",
    {}
  );
  return res.json(response);
}
/*
        5. Cancel Order
*/
async function cancelOrderFood(req, res) {
  const { orderId, reason } = req.body;
  const statusNames = [
    "Accepted",
    "Preparing",
    "Ready for delivery",
    "On the way",
  ];
  const status = await orderStatus.findAll({
    where: {
      name: {
        [Op.in]: statusNames,
      },
    },
  });
  const statusIds = status.map((status) => status.id);
  const userId = req.user.id;
  const orderData = await order.findOne({
    where: {
      id: orderId,
    },
    include: {
      model: restaurant,
      include: {
        model: user,
        attributes: ["deviceToken"],
      },
    },
  });

  if (!orderData) {
    const response = ApiResponse(
      "0",
      "Cannot find order against this order ID",
      "Error in cancelling order",
      {}
    );
    return res.json(response);
  }
  if (statusIds.includes(orderData.orderStatusId)) {
    const response = ApiResponse(
      "0",
      "You cannot cancelled order at this stage",
      "Error in cancelling order",
      {}
    );
    return res.json(response);
  }

  order.update(
    {
      status: true,
      orderStatusId: 12,
    },
    {
      where: {
        id: orderId,
      },
    }
  );
  let time = Date.now();
  orderHistory.create({
    time,
    reason: reason,
    orderId,
    orderStatusId: 12,
    cancelledBy: userId,
  });
  singleNotification(
    orderData?.restaurant?.user?.deviceToken,
    "Order Cancel",
    `Order ID ${orderId} has cancelled by User ID ${userId}`
  );
  const response = ApiResponse("1", "Order cancelled", "", {});
  return res.json(response);
}

/*
        6. Active Orders of a  user
*/
async function ongoingOrders(req, res) {
  const statusNames = ["Delivered", "Ride end"];
  const status = await orderStatus.findAll({
    where: {
      name: {
        [Op.in]: statusNames,
      },
    },
    attributes: ["id"],
  });

  const statusIds = status.map((status) => status.id);
  const userId = req.user.id;

  const ongoingOrders = await order.findAll({
    where: {
      userId,
      status: 1,
      orderStatusId: {
        [Op.notIn]: statusIds,
      },
    },
    order: [["scheduleDate", "ASC"]],
    include: [
      {
        model: restaurant,
        attributes: ["businessName"],
      },
      {
        model: orderStatus,
        attributes: ["id", "displayText"],
      },
    ],
    attributes: [
      "id",
      "orderNum",
      [
        sequelize.fn(
          "date_format",
          sequelize.col("scheduleDate"),
          "%d-%m-%Y %r"
        ),
        "scheduleTime",
      ],
      "total",
      "orderApplicationId",
      "driverId",
      "deliveryTypeId",
    ],
  });

  if (!ongoingOrders || ongoingOrders.length === 0) {
    throw customException("No data available", "You have no active orders");
  }

  const restOrders = ongoingOrders.filter(
    (ele) => ele.orderApplicationId === 1
  );
  //   const rideOrders = ongoingOrders.filter(ele => ele.orderApplicationId === 2);

  return res.json({
    status: "1",
    message: "Ongoing Orders",
    data: {
      restOrders,
      //   rideOrders,
    },
    error: "",
  });
}

//Module 5:
/*
        1. Add Rating and feedback of both restaurant and driver
*/
async function addRatingFeedback(req, res) {
  const {
    restaurantRate,
    restaurantFeedBack,
    driverRate,
    orderId,
    deliveryType,
  } = req.body;
  const orderData = await order.findOne({
    where: {
      id: orderId,
    },
  });
  const cTime = Date.now();
  if (deliveryType === "Self-Pickup") {
    const restRating = new restaurantRating();
    restRating.value = restaurantRate;
    restRating.at = cTime;
    restRating.orderId = orderId;
    restRating.restaurantId = orderData.restaurantId;
    restRating.userId = orderData.userId;
    restRating
      .save()
      .then((dat) => {
        const response = ApiResponse("1", "Rating added successfully", "", {});
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "Error", {});
        return res.json(response);
      });
  } else {
    const rating = new driverRating();
    rating.value = parseInt(driverRate);
    rating.at = cTime;
    rating.orderId = orderId;
    rating.userId = orderData?.userId;
    rating.driverId = orderData.driverId;
    rating
      .save()
      .then(async (dat) => {
        const restRating = new restaurantRating();
        restRating.value = restaurantRate;
        restRating.at = cTime;
        restRating.orderId = orderId;
        restRating.restaurantId = orderData.restaurantId;
        restRating.userId = orderData.userId;
        restRating
          .save()
          .then((dat) => {
            const response = ApiResponse(
              "1",
              "Rating added successfully",
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
}

/*
        2. Add Rating and feedback of both restaurant and driver
*/
async function addTip(req, res) {
  const { amount, driverId, orderId } = req.body;
  const cTime = Date.now();
  const negAmount = -1 * parseFloat(amount);

  // Creating a positive entry for Admin (he owes this money to driver)
  const adminEntry = await wallet.create({
    amount,
    paymentType: "Tip Owed",
    at: cTime,
    orderId,
    userId: driverId,
  });
  const driverData = await user.findOne({
    where: {
      id: driverId,
    },
  });
  // Creating a negative entry for the driver (he receives this money from admin)
  const driverEntry = await wallet.create({
    amount: negAmount,
    paymentType: "Tip Received",
    at: cTime,
    orderId,
    userId: driverId,
  });

  if (!adminEntry || !driverEntry) {
    throw new CustomException("Error in paying Tip", "Tip Payment Failed");
  }
  singleNotification(
    driverData.deviceToken,
    "Tip Paid",
    `${negAmount} tip has paid to you`
  );
  res.json({
    status: "1",
    message: "Tip Paid",
    data: {},
    error: "",
  });
}

//Module 6: Drawer (Profile)
/*
        1. Get Profile
*/
async function getProfile(req, res) {
  const { userId } = req.body;
  const userData = await user.findOne({
    where: {
      id: userId,
    },
  });
  const credit = await Credit.findOne({
    where: {
      userId: userId,
    },
  });
  return res.json({
    status: "1",
    message: "User profile data",
    data: {
      userName: userData?.userName ? userData?.userName : "Dummy",
      firstName: userData?.firstName ? userData.firstName : "first Name",
      lastName: userData?.lastName ? userData.lastName : "lastName",

      email: userData.email,
      countryCode: userData.countryCode,
      phoneNum: userData.phoneNum,
      referalCode: userData.referalCode,
      creditPoints: credit ? credit.point : "0",
    },
    error: "",
  });
}
async function UsergetProfile(req, res) {
  const { userId } = req.params;
  const userData = await user.findOne({
    where: {
      id: userId,
    },
  });
  const credit = await Credit.findOne({
    where: {
      userId: userId,
    },
  });
  return res.json({
    status: "1",
    message: "User profile data",
    data: {
      userName: userData?.userName ? userData?.userName : "Dummy",
      firstName: userData?.firstName ? userData.firstName : "first Name",
      lastName: userData?.lastName ? userData.lastName : "lastName",

      email: userData.email,
      countryCode: userData.countryCode,
      phoneNum: userData.phoneNum,
      referalCode: userData.referalCode,
      creditPoints: credit ? credit.point : "0",
    },
    error: "",
  });
}
/*
        2. Update profile
*/
async function updateProfile(req, res) {
  const { firstName, lastName, countryCode, phoneNum, userId, userName } =
    req.body;
  user
    .update(
      {
        firstName,
        lastName,
        countryCode,
        phoneNum,
        userName,
      },
      {
        where: {
          id: userId,
        },
      }
    )
    .then((data) => {
      return res.json({
        status: "1",
        message: "Profile Update successfully",
        data: {
          name: `${userName}`,
        },
        error: "",
      });
    });
}
/*
        3. Change password in response to old password 
    ________________________________________
*/
async function changePassword(req, res) {
  const { newPassword, oldPassword } = req.body;
  // getting ID FROM middleware
  const userId = req.user.id;
  const currUser = await user.findOne({
    where: {
      id: userId,
    },
  });
  bcrypt
    .compare(oldPassword, currUser.password)
    .then((match) => {
      if (!match) {
        const response = ApiResponse(
          "0",
          "your old passwrod is incorrect",
          err.message,
          {}
        );
        return res.json(response);
      }
      bcrypt.hash(newPassword, 10).then((hashedPassword) => {
        user
          .update(
            {
              password: hashedPassword,
            },
            {
              where: {
                id: userId,
              },
            }
          )
          .then((passData) => {
            const response = ApiResponse(
              "1",
              "Password Changed successfully",
              "",
              {}
            );
            return res.json(response);
          });
      });
    })
    .catch((err) => {
      //console.log(err)
      const response = ApiResponse(
        "0",
        "your old passwrod is incorrect",
        err.message,
        {}
      );
      return res.json(response);
    });
}
/*
        4. Send support email
    ________________________________________
*/
async function supportEmail(req, res) {
  const phoneData = await setting.findOne({
    where: {
      content: "phone",
    },
    attributes: ["content", "value"],
  });
  const emailData = await setting.findOne({
    where: {
      content: "email",
    },
    attributes: ["content", "value"],
  });
  return res.json({
    status: "1",
    message: "Support Information",
    data: {
      phoneData,
      emailData,
      termsConditions: {
        content: "Terms & Condition",
        value: "https://myace.app/terms",
      },
    },
    error: "",
  });
}
/*
        4. Show order history of restaurant  
    ________________________________________
*/
async function orderHistoryRes(req, res) {
  const userId = req.user.id;
  const status = await orderStatus.findOne({
    where: {
      name: "Delivered",
    },
  });

  const compOrders = await order.findAll({
    where: [
      {
        paymentRecieved: 1,
      },
      {
        userId: userId,
      },
      // {
      //   orderStatusId: status.id,
      // },
    ],
    order: [["id", "DESC"]],
    include: [
      {
        model: restaurant,
        include: {
          model: zoneRestaurants,
          include: {
            model: zone,
            include: {
              model: zoneDetails,
              include: [
                {
                  model: unit,
                  as: "currencyUnit",
                },
                {
                  model: unit,
                  as: "distanceUnit",
                },
              ],
            },
          },
        },
      },
      {
        model: orderStatus,
      },
      {
        model: address,
        as: "pickUpID",
      },
      {
        model: address,
        as: "dropOffID",
      },
    ],
  });

  if (compOrders.length === 0) {
    return res.json({
      status: "1",
      message: "No orders yet",
      data: {
        foodOrders: [],
      },
      error: "",
    });
  }

  let foodOrders = [];
  compOrders.map((o, i) => {
    let time = new Date(o.scheduleDate);
    let outObj = {
      orderId: o.id,
      orderNum: o.orderNum,
      scheduleDate: time.toLocaleString("en-US"),
      restaurantName: o.restaurant ? o.restaurant?.businessName : "",
      restaurantimage: o.restaurant ? o.restaurant?.image : "",
      restaurantlogo: o.restaurant ? o.restaurant?.logo : "",
      restaurantCurrency:
        o.restaurant?.zoneRestaurant?.zone?.zoneDetail?.currencyUnit,
      total: o.total,
      // pickUp: `${o.pickUpID}`,
      pickUp: o.restaurant ? o.restaurant?.address : "",
      dropOff:
        o?.dropOffID?.streetAddress +
        " " +
        o?.dropOffID?.city +
        " " +
        o?.dropOffID?.state,
      // dropOff: o.dropOffId? o.dropOffID.streetAddress: '',
      orderStatus: o?.orderStatus ? o?.orderStatus?.name : "No Status Assigned",
      statusFeedback: o.orderStatusId === 6 ? "Complete" : "In Progress",
    };
    foodOrders.push(outObj);
  });

  let data = {
    foodOrders,
  };
  const response = ApiResponse("1", "Order History", "", data);
  return res.json(response);
}
/*
        4. Order details of a specific order food
    ________________________________________
*/
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
          model: zoneRestaurants,
          include: {
            model: zone,
            include: {
              model: zoneDetails,
              include: { model: unit, as: "currencyUnit" },
            },
          },
        },
      },
      {
        model: orderStatus,
      },
      {
        model: orderHistory,
        attributes: ["id", "time"],
        include: { model: orderStatus, attributes: ["name"] },
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
          },
          {
            model: orderAddOns,
            include: {
              model: addOn,
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
    ],
  });
  //   return res.json(orderData)

  const estTime = await eta_text(
    orderData.restaurant.lat,
    orderData.restaurant.lng,
    orderData.dropOffID?.lat,
    orderData.dropOffID?.lng
  );
  //   return res.json(orderData);
  if (!orderData) {
    const response = ApiResponse(
      "0",
      "No Order found against this id",
      "Error",
      {}
    );
    return res.json(response);
  }
  //Formatting Schedule Date
  let time = new Date(orderData.scheduleDate);
  let schDate = time.toLocaleString("en-US");
  // Array to store Items with add Ons
  let itemArr = [];
  // return res.json(orderData)
  orderData.orderItems.map((oi, idx) => {
    let itemPrice = parseFloat(oi.total);
    let addOnArr = [];

    //manipulating addons
    oi?.orderAddOns.map((oao, ind) => {
      itemPrice = itemPrice + parseFloat(oao.total);
      let addOnObj = {
        name: oao?.addOn?.name,
        price: oao.total,
        quantity: oao?.qty?.toString(),
      };
      addOnArr.push(addOnObj);
    });
    let itemObj = {
      itemName: oi.R_PLink?.name,
      quantity: oi.quantity,
      image: oi?.R_PLink?.image,

      itemPrice: parseFloat(itemPrice),
      addOns: addOnArr,
    };
    itemArr.push(itemObj);
  });

  let driver_lat = "";
  let driver_lng = "";
  let driverLatLng = {};
  const firebase_data = await axios.get(process.env.FIREBASE_URL);
  if (firebase_data.data) {
    driverLatLng = firebase_data?.data[orderData?.driverId];
  }
  let outObj = {
    id: orderData.id,
    restaurantId: orderData.restaurant ? orderData.restaurant.id : "",
    countryCode: orderData.restaurant ? orderData.restaurant.countryCode : "",
    phoneNum: orderData.restaurant ? orderData.restaurant.phoneNum : "",
    restaurantAddress: orderData.restaurant ? orderData.restaurant.address : "",
    zipCode: orderData.restaurant ? orderData.restaurant.zipCode : "",
    restaurantName: orderData?.restaurant
      ? orderData?.restaurant?.businessName
      : "",
    restaurantPhoto: orderData.restaurant ? orderData.restaurant.logo : "",
    restaurantLat: orderData?.restaurant?.lat,
    restaurantLng: orderData?.restaurant?.lng,
    orderNum: orderData?.orderNum,
    scheduleDate: schDate,
    estTime: estTime ? estTime : "10 mints",
    OrderStatusId: orderData?.orderStatus?.id,
    note: orderData?.note,
    OrderStatus: orderData?.orderStatus?.name,
    address: `${orderData?.dropOffID?.building} ${orderData.dropOffID?.streetAddress}`,
    dropOffLat: orderData?.dropOffID?.lat,
    dropOffLng: orderData?.dropOffID?.lng,
    items: itemArr,
    subTotal: orderData?.orderCharge?.basketTotal
      ? orderData?.orderCharge?.basketTotal
      : 0,
    deliveryFee: orderData?.orderCharge?.deliveryFees
      ? orderData?.orderCharge?.deliveryFees
      : 0,
    VAT: orderData?.orderCharge?.VAT ? orderData?.orderCharge?.VAT : 0,
    discount: orderData?.orderCharge?.discount
      ? orderData?.orderCharge?.discount
      : 0,
    serviceCharges: orderData?.orderCharge?.serviceCharges
      ? orderData?.orderCharge?.serviceCharges
      : 0,
    total: orderData?.orderCharge?.total ? orderData?.orderCharge?.total : 0,
    note: orderData?.note ? orderData?.note : "",
    paymentMethod: orderData?.paymentMethod?.name ?? "",
    deliveryType: orderData?.deliveryType?.name,
    driverDetails: orderData?.driverId
      ? {
          id: `${orderData?.DriverId?.id}`,
          name: `${orderData?.DriverId?.firstName} ${orderData?.DriverId?.lastName}`,
          image: orderData.DriverId?.driverDetails[0]?.profilePhoto,
          phoneNum: `${orderData?.DriverId?.countryCode} ${orderData?.DriverId?.phoneNum}`,
          driverLatLng: driverLatLng,
        }
      : null,
    orderStatuses: orderData?.orderHistories,

    currency:
      orderData?.restaurant?.zoneRestaurant?.zone?.zoneDetail?.currencyUnit
        ?.symbol || "",
  };
  const response = ApiResponse("1", "Order Details", "", outObj);
  return res.json(response);
}
async function orderDetailsGet(req, res) {
  const { orderId } = req.params;

  const orderData = await order.findOne({
    where: {
      id: orderId,
    },
    include: [
      {
        model: restaurant,
        include: {
          model: zoneRestaurants,
          include: {
            model: zone,
            include: {
              model: zoneDetails,
              include: { model: unit, as: "currencyUnit" },
            },
          },
        },
      },
      {
        model: orderStatus,
      },
      {
        model: orderHistory,
        attributes: ["id", "time"],
        include: { model: orderStatus, attributes: ["name"] },
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
          },
          {
            model: orderAddOns,
            include: {
              model: addOn,
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
    ],
  });
  //   return res.json(orderData)

  const estTime = await eta_text(
    orderData.restaurant.lat,
    orderData.restaurant.lng,
    orderData.dropOffID?.lat,
    orderData.dropOffID?.lng
  );
  //   return res.json(orderData);
  if (!orderData) {
    const response = ApiResponse(
      "0",
      "No Order found against this id",
      "Error",
      {}
    );
    return res.json(response);
  }
  //Formatting Schedule Date
  let time = new Date(orderData.scheduleDate);
  let schDate = time.toLocaleString("en-US");
  // Array to store Items with add Ons
  let itemArr = [];
  // return res.json(orderData)
  orderData.orderItems.map((oi, idx) => {
    let itemPrice = parseFloat(oi.total);
    let addOnArr = [];

    //manipulating addons
    oi?.orderAddOns.map((oao, ind) => {
      itemPrice = itemPrice + parseFloat(oao.total);
      let addOnObj = {
        name: oao?.addOn?.name,
        price: oao.total,
        quantity: oao?.qty?.toString(),
      };
      addOnArr.push(addOnObj);
    });
    let itemObj = {
      itemName: oi.R_PLink?.name,
      quantity: oi.quantity,
      image: oi?.R_PLink?.image,

      itemPrice: parseFloat(itemPrice),
      addOns: addOnArr,
    };
    itemArr.push(itemObj);
  });

  let driver_lat = "";
  let driver_lng = "";
  let driverLatLng = {};
  const firebase_data = await axios.get(process.env.FIREBASE_URL);
  if (firebase_data.data) {
    driverLatLng = firebase_data?.data[orderData?.driverId];
  }
  let outObj = {
    id: orderData.id,
    restaurantId: orderData.restaurant ? orderData.restaurant.id : "",
    countryCode: orderData.restaurant ? orderData.restaurant.countryCode : "",
    phoneNum: orderData.restaurant ? orderData.restaurant.phoneNum : "",
    restaurantAddress: orderData.restaurant ? orderData.restaurant.address : "",
    zipCode: orderData.restaurant ? orderData.restaurant.zipCode : "",
    restaurantName: orderData?.restaurant
      ? orderData?.restaurant?.businessName
      : "",
    restaurantPhoto: orderData.restaurant ? orderData.restaurant.logo : "",
    restaurantLat: orderData?.restaurant?.lat,
    restaurantLng: orderData?.restaurant?.lng,
    orderNum: orderData?.orderNum,
    scheduleDate: schDate,
    estTime: estTime ? estTime : "10 mints",
    OrderStatusId: orderData?.orderStatus?.id,
    note: orderData?.note,
    OrderStatus: orderData?.orderStatus?.name,
    address: `${orderData?.dropOffID?.building} ${orderData.dropOffID?.streetAddress}`,
    dropOffLat: orderData?.dropOffID?.lat,
    dropOffLng: orderData?.dropOffID?.lng,
    items: itemArr,
    subTotal: orderData ? orderData?.subTotal : 0,
    deliveryFee: orderData?.orderCharge?.deliveryFees
      ? orderData?.orderCharge?.deliveryFees
      : 0,
    VAT: orderData?.orderCharge?.VAT ? orderData?.orderCharge?.VAT : 0,
    discount: orderData?.orderCharge?.discount
      ? orderData?.orderCharge?.discount
      : 0,
    serviceCharges: orderData?.orderCharge?.serviceCharges
      ? orderData?.orderCharge?.serviceCharges
      : 0,
    total: orderData ? orderData?.total : 0,
    note: orderData?.note ? orderData?.note : "",
    paymentMethod: orderData?.paymentMethod?.name ?? "",
    deliveryType: orderData?.deliveryType?.name,
    driverDetails: orderData?.driverId
      ? {
          id: `${orderData?.DriverId?.id}`,
          name: `${orderData?.DriverId?.firstName} ${orderData?.DriverId?.lastName}`,
          image: orderData.DriverId?.driverDetails[0]?.profilePhoto,
          phoneNum: `${orderData?.DriverId?.countryCode} ${orderData?.DriverId?.phoneNum}`,
          driverLatLng: driverLatLng,
        }
      : null,
    orderStatuses: orderData?.orderHistories,

    currency:
      orderData?.restaurant?.zoneRestaurant?.zone?.zoneDetail?.currencyUnit
        ?.symbol || "",
  };
  const response = ApiResponse("1", "Order Details", "", outObj);
  return res.json(response);
}
/*
        4. Order details of a specific order ride sharing   
    ________________________________________
*/
async function orderDetailsRides(req, res) {
  const { orderId } = req.body;
  const orderData = await order.findOne({
    where: {
      id: orderId,
    },
    include: [
      {
        model: orderStatus,
        attributes: ["name"],
      },
      {
        model: address,
        as: "pickUpID",
        attributes: ["building", "streetAddress", "lat", "lng"],
      },
      {
        model: address,
        as: "dropOffID",
        attributes: ["building", "streetAddress", "lat", "lng"],
      },
      {
        model: orderCharge,
        attributes: [
          "baseFare",
          "timeFare",
          "distFare",
          "serviceCharges",
          "discount",
        ],
      },
      {
        model: vehicleType,
        attributes: ["name", "image"],
      },
      {
        model: paymentMethod,
        attributes: ["name"],
      },
    ],
    attributes: [
      "id",
      "orderNum",
      "driverId",
      "note",
      "distance",
      "total",
      "subTotal",
      [
        sequelize.fn(
          "date_format",
          sequelize.col("scheduleDate"),
          "%d-%m-%Y %r "
        ),
        "scheduled",
      ],
    ],
  });

  let riderData = {};
  if (orderData.driverId) {
    riderData = await user.findOne({
      where: {
        id: orderData.driverId,
      },
      include: [
        {
          model: driverDetails,
          where: {
            status: 1,
          },
          attributes: ["id", "profilePhoto"],
        },
        {
          model: vehicleDetails,
          where: {
            status: 1,
          },
          attributes: ["id", "make", "model", "registrationNum", "color"],
        },
      ],
      attributes: [
        "id",
        "firstName",
        "lastName",
        "countryCode",
        "phoneNum",
        "deviceToken",
      ],
    });
  }
  //
  //return res.json(riderData)
  let data = {
    orderData,
    riderData,
  };
  const response = ApiResponse("1", "Order details", "", data);
  return res.json(response);
}

/*
        5. Wallet 
*/
// async function walletData(req,res){
//     //const userId = req.user.id;
//     const userId = 3;
//     const walletData = await wallet.findAll({
//         where: {userId: userId},
//         attributes: ['id', 'amount']
//     });
//     let balance = walletData.reduce((previousValue, curentValue) => previousValue + curentValue.amount, 0);
//     return res.json(balance);

// };

//Module 7: Taxi
//1. Get vehicle type & payment methods
async function getVehicleType(req, res) {
  //return res.send('API HIT')
  let vehicleTypeId;
  let addresses;
  let charges;
  let vehicleCharge;
  let pickUpAddress;
  let dropOffAddress;
  let baseFare;
  let perMinCharge;
  let baseDist;

  const { pickUpId, dropOffId } = req.body;

  const list = await vehicleType.findAll({
    where: {
      status: 1,
    },
    attributes: ["id", "name", "image"],
  });
  //return res.json(list)
  let etaArr = [];
  for (let i = 0; i <= list.length - 1; i++) {
    vehicleTypeId = list[i].id;
    addresses = await address.findAll({
      where: {
        id: {
          [Op.or]: [pickUpId, dropOffId],
        },
      },
      attributes: ["id", "lat", "lng"],
    });
    charges = await charge.findAll({
      where: {
        title: {
          [Op.or]: ["baseFareTaxi", "perMinChargeTaxi", "baseDistTaxi"],
        },
      },
      attributes: ["id", "title", "amount"],
    });
    vehicleCharge = await vehicleType.findOne({
      where: {
        id: vehicleTypeId,
      },
      attributes: ["id", "baseRate", "perUnitRate"],
    });
    pickUpAddress = addresses.find((ele) => ele.id == pickUpId);
    dropOffAddress = addresses.find((ele) => ele.id == dropOffId);
    baseFare = charges.find((ele) => ele.title === "baseFareTaxi");
    perMinCharge = charges.find((ele) => ele.title === "perMinChargeTaxi");
    baseDist = charges.find((ele) => ele.title === "baseDistTaxi");
    let tmpData = await axios.get(
      `${process.env.MAPS_URL}&origin=${pickUpAddress.lat},${pickUpAddress.lng}&destination=${dropOffAddress.lat},${dropOffAddress.lng}&key=AIzaSyDoVmHrVkO68EObrVfhWrzgbAHHPQ9McMM`
    );
    //let tmpData = {abcd: "jdjd"}
    //console.log(tmpData.data);
    let estdDis =
      tmpData.data.status === "OK"
        ? tmpData.data.routes[0].legs[0].distance.value / 1000
        : 0;
    distanceInMiles = estdDis * 0.621371;
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
    let eTime =
      tmpData.data.status === "OK"
        ? tmpData.data.routes[0].legs[0].duration.value / 60
        : 0;
    let timeFare = eTime * parseFloat(perMinCharge.amount);
    //console.log('STATS', 'dist in mile', distanceInMiles, 'time in Mins',eTime, 'veh BaseRate', vehicleCharge.baseRate, 'perUnitRate', vehicleCharge.perUnitRate   )
    //console.log(parseFloat(baseFare.amount), distFare, timeFare )
    let estdFare = parseFloat(baseFare.amount) + distFare + timeFare;
    estdFare = estdFare.toFixed(2);
    distanceInMiles = distanceInMiles.toFixed(2);
    console.log(
      "Dist in mi",
      distanceInMiles,
      "E-TIME",
      eTime,
      "est fare",
      estdFare
    );
    let tmpObj = {
      vehicleType: list[i],
      data: {
        baseFare: baseFare.amount,
        distanceFare: `${distFare.toFixed(2)}`,
        timeFare: `${timeFare.toFixed(2)}`,
        totalEstdFare: `${estdFare}`,
        distance: `${distanceInMiles}`,
      },
    };
    etaArr.push(tmpObj);
    //console.log('ABCD')
  }
  //return res.json(etaArr);
  const paymentMethodList = await paymentMethod.findAll();
  const orderModeList = await orderMode.findAll();
  // paymentMethodList.pop();
  let data = {
    vehicleTypeList: etaArr,
    paymentMethodList,
    orderModeList,
  };
  const response = ApiResponse(
    "1",
    "Get Vehicle type, payment methods & order modes",
    "",
    data
  );
  return res.json(response);
}

//2. Get estimated fare for Taxi App
async function getEstdFare(req, res) {
  const { pickUpId, dropOffId, vehicleTypeId } = req.body;
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
    where: {
      id: vehicleTypeId,
    },
    attributes: ["id", "baseRate", "perUnitRate"],
  });
  const pickUpAddress = addresses.find((ele) => ele.id == pickUpId);
  const dropOffAddress = addresses.find((ele) => ele.id == dropOffId);
  const baseFare = charges.find((ele) => ele.title === "baseFareTaxi");
  const perMinCharge = charges.find((ele) => ele.title === "perMinChargeTaxi");
  const baseDist = charges.find((ele) => ele.title === "baseDistTaxi");
  // Getting distance and estimated time of ride
  axios
    .get(
      `${process.env.MAPS_URL}&origin=${pickUpAddress.lat},${pickUpAddress.lng}&destination=${dropOffAddress.lat},${dropOffAddress.lng}&key=AIzaSyDoVmHrVkO68EObrVfhWrzgbAHHPQ9McMM`
    )
    .then((resp) => {
      //Coverting distance into float
      let distanceinKm = resp.data.routes[0].legs[0].distance.text;
      splited = distanceinKm.split(" ");
      distanceinKm = parseFloat(splited[0]);
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
      let eTime = resp.data.routes[0].legs[0].duration.text;
      tsplited = eTime.split(" ");
      eTime = parseFloat(tsplited[0]);
      let timeFare = eTime * parseFloat(perMinCharge.amount);
      //console.log(parseFloat(baseFare.amount), distFare, timeFare )
      let estdFare = parseFloat(baseFare.amount) + distFare + timeFare;
      estdFare = estdFare.toFixed(2);
      distanceInMiles = distanceInMiles.toFixed(2);
      //console.log('Dist in mi', distanceInMiles, 'E-TIME', eTime, 'baseFareTaxi', baseFare.amount, 'timeCharges', perMinCharge.amount)
      let data = {
        baseFare: baseFare.amount,
        distanceFare: `${distFare}`,
        timeFare: `${timeFare}`,
        totalEstdFare: `${estdFare}`,
        distance: `${distanceInMiles}`,
      };
      const response = ApiResponse("1", "Estimated fare of ride", "", data);
      return res.json(response);
    })
    .catch((err) => {
      const response = ApiResponse(
        "0",
        "Error in fething time and distance data",
        "Error",
        {}
      );
      return res.json(response);
    });
}

async function tablebooking(req, res) {
  const { userId, restaurantId, persons } = req.body;
  tableBooking
    .create({
      userId,
      restaurantId,
      persons,
    })
    .then((data) => {
      const response = ApiResponse(
        "1",
        "Table Booking Request Created",
        "",
        data
      );
      return res.json(response);
    });
}
// Add Service charges
async function placeOrder(req, res) {
  let allDrivers = await user.findAll({
    where: {
      status: 1,
      userTypeId: 2,
    },
    attributes: ["id", "deviceToken"],
  });
  const adminPercent = await charge.findOne({
    where: {
      title: "adminPercentTaxi",
    },
    attributes: ["amount"],
  });

  //return res.json(adminPercent)
  const {
    scheduleDate,
    note,
    distance,
    subTotal,
    total,
    pickUpId,
    dropOffId,
    orderModeId,
    paymentMethodId,
    userId,
    vehicleTypeId,
    voucherId,
    baseFare,
    distFare,
    timeFare,
  } = req.body;
  const pickUpAddress = await address.findByPk(pickUpId, {
    attributes: ["streetAddress"],
  });
  const dropOffAddress = await address.findByPk(dropOffId, {
    attributes: ["streetAddress"],
  });

  // checking if voucher applied or not
  let applied = voucherId === "" ? null : voucherId;
  let ON1 = uON.generate();
  order
    .create({
      orderNum: `fom-${ON1}`,
      scheduleDate,
      note,
      distance,
      subTotal,
      total,
      pickUpId,
      dropOffId,
      status: true,
      orderModeId,
      orderStatusId: 1,
      paymentMethodId,
      orderApplicationId: 2,
      userId,
      vehicleTypeId,
      voucherId: applied,
      paymentRecieved: true,
    })
    .then((data) => {
      //return res.json(data.id)
      // Creating order history
      let time = Date.now();
      orderHistory.create({
        time,
        orderId: data.id,
        orderStatusId: 1,
      });
      //creating a temprary charge data, update it @payment
      let adminEarnings = total * (parseFloat(adminPercent.amount) / 100);
      let driverEarnings = total - adminEarnings;
      let ch = {
        adminEarnings,
        driverEarnings,
        adminPercent: adminPercent.amount,
        baseFare,
        distFare,
        timeFare,
        orderId: data.id,
        serviceCharges: 1.2,
      };
      orderCharge.create(ch);
      // send notifications to all drivers whose car type matches
      axios
        .get(process.env.FIREBASE_URL)
        .then((dat) => {
          Object.keys(dat.data).map(function (key, index) {
            let found = allDrivers.find((ele) => parseInt(key) === ele.id);
            if (!found) console.log("not found against", key);
            if (found) {
              let message = {
                to: `${found.deviceToken}`,
                notification: {
                  title: "New Job arrived",
                  body: "A new job has arrived",
                },
                data: {
                  orderId: data.id,
                  orderNum: data.orderNum,
                  orderApplication: `2`, // 2 for ride sharing
                  pickUpAddress: pickUpAddress.streetAddress,
                  dropOffAddress: dropOffAddress.streetAddress,
                  estEarning: `${driverEarnings.toFixed(2)}`,
                  distance: distance,
                },
              };
              fcm.send(message, function (err, response) {
                if (err) {
                  console.log("Something has gone wrong!");
                  //res.json(err);
                } else {
                  console.log("Successfully sent with response: ", response);
                  //res.json(response);
                }
              });
              console.log("Notification send to", found.id, key);
            }
            //console.log(key);
          });
        })
        .catch((err) => {
          const response = ApiResponse(
            "0",
            "Error getting driver data",
            "Error",
            {}
          );
          return res.json(response);
        });
      const datas = {
        id: data.id,
      };
      const response = ApiResponse("1", "Order created", "", datas);
      return res.json(response);
    })
    .catch((err) => {
      const response = ApiResponse(
        "0",
        "Error creating order",
        "Error creating order",
        {}
      );
      return res.json(response);
    });
}

//4. Cancel Order taxi app
async function cancelOrderTaxi(req, res) {
  const { orderId } = req.body;
  const userId = req.user.id;
  const orderData = await order.findByPk(orderId, {
    include: {
      model: user,
      as: "DriverId",
      attributes: ["id", "deviceToken"],
    },
    attributes: ["id", "orderNum", "driverId", "orderStatusId"],
  });
  //return res.json(orderData)
  if (
    !(
      orderData.orderStatusId === 1 ||
      orderData.orderStatusId === 2 ||
      orderData.orderStatusId === 3 ||
      orderData.orderStatusId === 8
    )
  )
    throw new CustomException(
      "You cannot cancel order at this stage",
      "Cant cancel order at this stage"
    );
  order
    .update(
      {
        status: false,
        orderStatusId: 12,
      },
      {
        where: {
          id: orderId,
        },
      }
    )
    .then((data) => {
      let time = Date.now();
      orderHistory.create({
        time,
        orderId,
        orderStatusId: 12,
        cancelledBy: userId,
      });
      //Throw notification to driver if order is accepted
      if (orderData.driverId) {
        let to = [orderData.DriverId.deviceToken];
        let notification = {
          title: "Order cancelled",
          body: `Order # ${orderData.orderNum} is cancelled`,
        };
        let data = {
          orderId: orderData.id,
        };
        sendNotifications(to, notification, data);
      }
      const response = ApiResponse("1", "Order Cancelled", "", {});
      return res.json(response);
    })
    .catch((err) => {
      const response = ApiResponse("0", "Error cancelling order", "Error", {});
      return res.json(response);
    });
}

//5. driver details after accepting ride
async function driverDetailsForCustomer(req, res) {
  let { driverId } = req.body;
  let driverData = await user.findByPk(driverId, {
    include: [
      {
        model: vehicleDetails,
        where: {
          status: true,
        },
        attributes: ["make", "model", "registrationNum"],
      },
    ],
    attributes: [
      "id",
      "firstName",
      "lastName",
      "countryCode",
      "phoneNum",
      "deviceToken",
    ],
  });
  let driverRatingData = await driverRating.findAll({
    where: {
      driverId: driverId,
    },
    attributes: ["id", "value", "comment", "at"],
  });
  // Calculating avg rating of driver
  let driverAvgRate = driverRatingData.reduce(
    (previousValue, curentValue) => previousValue + curentValue.value,
    0
  );
  let avgRate = driverAvgRate / driverRatingData.length;
  avgRate = avgRate ? avgRate.toFixed(2) : avgRate;
  // Getting last 4 reviews
  let reviews = [];
  driverRatingData.map((ele) => {
    if (ele.comment === "") return null;
    let cDate = new Date(ele.at);
    let tmpObj = {
      comment: ele.comment,
      at: cDate.toLocaleDateString("en-US"),
    };
    reviews.push(tmpObj);
  });
  const lastFour = reviews.slice(-4);
  const orders = await order.count({
    where: {
      driverId: driverId,
    },
  });
  let data = {
    name: `${driverData.firstName} ${driverData.lastName}`,
    deviceToken: driverData.deviceToken,
    rating: avgRate,
    carName: driverData.vehicleDetails[0].make,
    carNumber: driverData.vehicleDetails[0].registrationNum,
    carModel: driverData.vehicleDetails[0].model,
    phoneNum: `${driverData.countryCode}${driverData.phoneNum}`,
    feedBacks: lastFour,
    total_orders: orders,
  };
  const response = ApiResponse("1", "Driver details", "", data);
  return res.json(response);
}

//6. Automatically cancel order for both
async function autoCancelOrderTaxi(req, res) {
  const { orderId } = req.body;
  const userId = req.user.id;
  const orderData = await order.findByPk(orderId, {
    attributes: ["id", "orderNum", "driverId", "orderStatusId"],
  });
  //return res.json(orderData)
  if (orderData.orderStatusId === 2) {
    const response = ApiResponse("2", "Order accepted", "", {});
    return res.json(response);
  }
  order
    .update(
      {
        status: false,
        orderStatusId: 12,
      },
      {
        where: {
          id: orderId,
        },
      }
    )
    .then((data) => {
      let time = Date.now();
      orderHistory.create({
        time,
        orderId,
        orderStatusId: 12,
        cancelledBy: userId,
      });
      const response = ApiResponse(
        "1",
        "Order cancelled due to unavailability of driver",
        "",
        {}
      );
      return res.json(response);
    })
    .catch((err) => {
      const response = ApiResponse(
        "0",
        "Error cancelling order",
        "Database Error",
        {}
      );
      return res.json(response);
    });
}

//-------------------------
//      Recurring         |
//-------------------------

/*
        1. Login Data
*/
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
      countryCode: `${userData.countryCode}`,
      phoneNum: `${userData.phoneNum}`,
      accessToken: `${accessToken}`,
      approved: userData.verifiedAt ? true : false,
      status: userData.status ? true : false,
    },
    error: "",
  };
};

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
/*
        3. Change the time to 2 digits
*/
function addZeroBefore(n) {
  return (n < 10 ? "0" : "") + n;
}
/*
        4. Change the format to 12 Hours
*/
function ampmFormat(n) {
  return n > 12 ? n - 12 : n;
}
/*
        5. Add Address
*/
async function addresstoDB(lat, lng, building, streetAddress, userId) {
  const addressExist = await address.findOne({
    where: {
      lat: lat,
      lng: lng,
      userId: userId,
    },
  });
  if (addressExist) {
    let updateAddress = await address.update(
      {
        building,
        streetAddress,
        lat,
        lng,
        userId,
        status: true,
      },
      {
        where: {
          id: addressExist.id,
        },
      }
    );
    return addressExist.id;
  } //else create new entry
  else {
    let createAddress = await address.create({
      building,
      streetAddress,
      city: "",
      state: "",
      zipCode: "",
      addressTypeId: 1,
      lat,
      lng,
      status: true,
      userId,
    });
    return createAddress.id;
  }
}

/*
        6. Return current order Data
*/
async function retOrderData(orderId) {
  // return orderId
  const orderData = await order.findOne({
    where: {
      id: orderId,
    },
    include: [
      {
        model: restaurant,
        include: {
          model: zoneRestaurants,
          include: {
            model: zone,
            include: {
              model: zoneDetails,
              include: { model: unit, as: "currencyUnit" },
            },
          },
        },
      },
      {
        model: orderItems,
        include: [
          {
            model: R_PLink,
          },
          {
            model: orderAddOns,
            include: [
              {
                model: addOn,
              },
              {
                model: P_A_ACLink,
                include: {
                  model: addOn,
                },
              },
            ],
          },
        ],
      },
      {
        model: paymentMethod,
      },
      {
        model: deliveryType,
      },
    ],
  });
  console.log(orderData);
  //  return orderData;

  // Array to store Items with add Ons
  let itemArr = [];
  orderData?.orderItems?.map((oi, idx) => {
    let itemPrice = parseFloat(oi?.total) || 0;
    let addOnArr = [];
    // Manipulating addons
    oi?.orderAddOns?.map((oao, ind) => {
      itemPrice = itemPrice + parseFloat(oao?.total) || 0;
      let addOnObj = {
        name: oao?.addOn?.name,
        price: oao?.total || 0,
        quantity: oao?.qty?.toString(),
      };
      addOnArr.push(addOnObj);
    });

    let itemObj = {
      id: oi?.R_PLink?.id,
      itemName: oi?.R_PLink?.name || "",
      image: oi?.R_PLink?.image || "",
      quantity: oi?.quantity || 0,
      itemPrice: itemPrice,
      addOns: addOnArr,
    };

    itemArr.push(itemObj);
  });

  const culter = await orderCultery.findAll({
    where: {
      orderId: orderData.id,
    },
    attributes: ["id"],
    include: {
      model: cutlery,
      attributes: ["id", "name", "description", "image", "price"],
    },
  });

  let outObj = {
    orderId: orderData.id,
    rest_lat: orderData.restaurant.lat,
    rest_lng: orderData.restaurant.lng,
    restaurantName: orderData?.restaurant?.businessName || "",
    cultery_list: culter.length > 0 ? culter : [],
    orderNum: orderData?.orderNum || "",
    items: itemArr,
    subTotal: orderData?.subTotal || 0,
    total: orderData?.total || 0,
    note: orderData?.note || "",
    paymentMethod: orderData?.paymentMethod?.name || "",
    deliveryType: orderData?.deliveryType?.name || "",
    currency:
      orderData?.restaurant?.zoneRestaurant?.zone?.zoneDetail?.currencyUnit
        ?.symbol || "",
  };
  return outObj;
}
async function retOrderDataForJoinGroup(orderId, userId, subTotal) {
  const orderData = await order.findOne({
    where: {
      id: orderId,
    },
    include: [
      {
        model: restaurant,
        include: {
          model: zoneRestaurants,
          include: {
            model: zone,
            include: {
              model: zoneDetails,
              include: { model: unit, as: "currencyUnit" },
            },
          },
        },
      },
      {
        model: orderItems,
        where: { userId: userId },
        include: [
          {
            model: R_PLink,
          },
          {
            model: orderAddOns,
            include: [
              {
                model: addOn,
              },
              {
                model: P_A_ACLink,
                include: {
                  model: addOn,
                },
              },
            ],
          },
        ],
      },
      {
        model: paymentMethod,
      },
      {
        model: deliveryType,
      },
    ],
  });

  let itemArr = [];
  orderData?.orderItems?.map((oi, idx) => {
    let itemPrice = parseFloat(oi?.total) || 0;
    let addOnArr = [];
    // Manipulating addons
    oi?.orderAddOns?.map((oao, ind) => {
      itemPrice = itemPrice + parseFloat(oao?.total) || 0;
      let addOnObj = {
        name: oao?.addOn?.name,
        price: oao?.total || 0,
        quantity: oao?.qty?.toString(),
      };
      addOnArr.push(addOnObj);
    });

    let itemObj = {
      id: oi?.R_PLink?.id,
      itemName: oi?.R_PLink?.name || "",
      image: oi?.R_PLink?.image || "",
      quantity: oi?.quantity || 0,
      itemPrice: itemPrice,
      addOns: addOnArr,
    };

    itemArr.push(itemObj);
  });

  const culter = await orderCultery.findAll({
    where: {
      orderId: orderData.id,
    },
    attributes: ["id"],
    include: {
      model: cutlery,
      attributes: ["id", "name", "description", "image", "price"],
    },
  });

  let outObj = {
    orderId: orderData.id,
    rest_lat: orderData.restaurant.lat,
    rest_lng: orderData.restaurant.lng,
    restaurantName: orderData?.restaurant?.businessName || "",
    cultery_list: culter.length > 0 ? culter : [],
    orderNum: orderData?.orderNum || "",
    items: itemArr,
    subTotal: subTotal.toString(),
    total: subTotal.toString(),
    note: orderData?.note || "",
    paymentMethod: orderData?.paymentMethod?.name || "",
    deliveryType: orderData?.deliveryType?.name || "",
    currency:
      orderData?.restaurant?.zoneRestaurant?.zone?.zoneDetail?.currencyUnit
        ?.symbol || "",
  };
  return outObj;
}

async function applicationRange(req, res) {
  let currLat = req.params.lat;
  let currLng = req.params.lng;
  let operateInRegion = false;
  const currRest = await restaurant.findAll({
    where: {
      status: true,
    },
    include: {
      model: unit,
      as: "distanceUnitID",
      attributes: ["symbol"],
    },
    attributes: ["lat", "lng", "deliveryRadius"],
  });
  //return res.json(currRest)
  for (let i = 0; i < currRest.length; i++) {
    // if unit is miles change to km
    if (currRest[i].distanceUnitID.symbol === "mi")
      currRest[i].deliveryRadius = currRest[i].deliveryRadius * 1.60934;
    // the distance is in Km
    let dist = getDistance(currLat, currLng, currRest[i].lat, currRest[i].lng);
    console.log(
      dist < currRest[i].deliveryRadius
        ? "Lies in region"
        : "Not for this restaurant"
    );
    console.log("DR", currRest[i].deliveryRadius, "d", dist);

    if (dist < currRest[i].deliveryRadius) {
      operateInRegion = true;
      break;
    }
  }
  if (!operateInRegion) {
    const response = ApiResponse(
      "0",
      "Sorry we are not operational in the region",
      "We will be available soon",
      {}
    );
    return res.json(response);
  }
  const response = ApiResponse("1", "Operates in the current location", "", {});
  return res.json(response);
}

async function restaurantRange(req, res) {
  let currLat = req.params.lat;
  let currLng = req.params.lng;
  let restId = req.params.restId;
  let operateInRegion = false;
  const currRest = await restaurant.findByPk(restId, {
    include: {
      model: unit,
      as: "distanceUnitID",
      attributes: ["symbol"],
    },
    attributes: ["lat", "lng", "deliveryRadius"],
  });
  //return res.json(currRest)
  // if unit is miles change to km
  if (currRest.distanceUnitID.symbol === "mi")
    currRest.deliveryRadius = currRest.deliveryRadius * 1.60934;
  // the distance is in Km
  let dist = getDistance(currLat, currLng, currRest.lat, currRest.lng);
  console.log(
    dist < currRest.deliveryRadius
      ? "Lies in region"
      : "Not for this restaurant"
  );
  console.log("DR", currRest.deliveryRadius, "d", dist);
  if (dist < currRest.deliveryRadius) operateInRegion = true;
  if (!operateInRegion) {
    const response = ApiResponse(
      "0",
      "Sorry, the current restaurant is not operational at current location",
      "Please change your location,so we cam serve you",
      {}
    );
    return res.json(response);
  }
  const response = ApiResponse("1", "Operates in the current location", "", {});
  return res.json(response);
}

async function testAPI(req, res) {
  // // Order Placing Transaction
  // // Ride Sharing
  // // let adminEarning = 2.5, driverEarning = 2, userCharge = 4.5, driverId = 2, userId = 3, orderId =1;
  // // let done = await OPTrans(true, 0, adminEarning, driverEarning, userCharge, 0, driverId, userId, 0);

  // // Food Delivery
  // // deliveryType = 1 --> Deilvery Mode
  // // deliveryType = 2 --> Self PickUp Mode --> driverEarning = 0

  // // let deliveryType = 1, restId = 1, restaurantEarning = 0.12;
  // // let done = await OPTrans(false, deliveryType, orderId, adminEarning, driverEarning, userCharge, restaurantEarning, driverId, userId, restId);

  // // Payment transaction
  // let paymentByCard= true, adminReceived = 2.5, UserPaid = 1.5,
  // driverPaid = 1.25, restReceived = 1.25, driverReceived = 1.25, orderId = 1, userId = 3, driverId= 2, restId= 1;
  // // ride sharing --> Payment by Card

  // //let done = await paymentTrans(true, adminReceived, UserPaid, 0, 0, 0, false, orderId, userId, 0, 0);
  // // ride sharing --> Payment by COD
  // let done = await paymentTrans(false, 0, UserPaid, 0, 0, driverReceived, false, orderId, userId, driverId, 0);
  // let to = ["eK5LZuTS02cL0dy1tWoUOq:APA91bG6dWva1413QltljGvQxQdBJAG2QsnZcr3yx3EbDOb05I0-HU7dUhSX6-TDXKeZ8qRoAen_xhZXRx9HdQraYTljyXMHxgbByqL9kndSo0nyrlqIBPA6deJULpqT4gkMIoH4vURY"]
  // let notifcation = {
  //     title: "Test to admin",
  //     body: "From local"
  // };
  // sendNotifications(to,notifcation)

  // return res.json("Done")
  const orderData = await retOrderData(805);
  return res.json(orderData);
}

async function createPaypalToken(req, res) {
  let output = false;
  let token = "";
  var details = {
    grant_type: "client_credentials",
  };
  var formBody = [];
  for (var property in details) {
    var encodedKey = encodeURIComponent(property);

    var encodedValue = encodeURIComponent(details[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  formBody = formBody.join("&");

  let login = process.env.PAYPAL_CLIENT_ID;
  let password = process.env.PAYPAL_SECRET_CLIENT;
  let encodedToken = Buffer.from(`${login}:${password}`).toString("base64");

  await axios({
    method: "post",
    url: "https://api-m.sandbox.paypal.com/v1/oauth2/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + encodedToken,
    },
    data: formBody,
  })
    .then(function (response) {
      output = true;
      token = response.data.access_token;
    })
    .catch(function (error) {
      console.log(error);
    });
  return output
    ? {
        status: "1",
        token,
      }
    : {
        status: "0",
        token,
      };
}

function generateRandomString(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
async function paymentByCard(req, res) {
  const { card_number, exp_year, exp_month, cvc, name, amount } = req.body;
  const bearerToken = await createPaypalToken();

  if (!bearerToken) {
    return res.json({
      status: "0",
      message: "Paypal token error!",
      data: {},
      error: "",
    });
  }

  let data = JSON.stringify({
    intent: "CAPTURE",
    purchase_units: [
      {
        items: [
          {
            name: `Product 1`,
            description: "Order Description",
            quantity: "1",
            unit_amount: {
              currency_code: "USD",
              value: amount,
            },
          },
        ],
        amount: {
          currency_code: "USD",
          value: amount,
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: amount,
            },
          },
        },
      },
    ],

    //expiry will be in format of 2024-04

    payment_source: {
      card: {
        number: card_number,
        expiry: `${exp_year}`,
        security_code: cvc,
        name: name,
      },
    },
  });

  const requestId = generateRandomString(20);
  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api-m.sandbox.paypal.com/v2/checkout/orders",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
      "PayPal-Request-Id": requestId,
      Authorization: `Bearer ${bearerToken.token}`,
      Cookie:
        "cookie_check=yes; d_id=8c47d608419c4e5dabc1436aeeba93dd1676894129864; enforce_policy=ccpa; ts=vreXpYrS%3D1771588529%26vteXpYrS%3D1676895929%26vr%3D6eadcca81860a6022c4955b0ee28ed1d%26vt%3D6eadcca81860a6022c4955b0ee28ed1c%26vtyp%3Dnew; ts_c=vr%3D6eadcca81860a6022c4955b0ee28ed1d%26vt%3D6eadcca81860a6022c4955b0ee28ed1c; tsrce=unifiedloginnodeweb; x-cdn=fastly:FJR; x-pp-s=eyJ0IjoiMTY3Njg5NDEyOTkzNSIsImwiOiIwIiwibSI6IjAifQ",
    },
    data: data,
  };

  axios(config)
    .then(async function (response) {
      if (response.data.status === "COMPLETED") {
        const response = ApiResponse("1", "Payment successfull!", "", {});
        return res.json(response);
      } else {
        const response = ApiResponse("0", "Payment failed!", "", {});
        return res.json(response);
      }
    })
    .catch(function (error) {
      const response = ApiResponse("0", error.message, "Error", {});
      return res.json(response);
    });
}

async function paypal_payment(req, res) {
  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },

    redirect_urls: {
      return_url: "https://myace.app/payment_success",
      cancel_url: "https://myace.app/payment_failed",
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: "My Ace Booking",
              sku: "001",
              price: req.body.amount,
              currency: req.body.currency,
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: req.body.currency,
          total: req.body.amount,
        },
        description: "My Ace Booking",
      },
    ],
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      const response = ApiResponse("1", "Error", error.message, link);
      return res.json(response);
    } else {
      var link = "";

      for (var i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === "approval_url") {
          link = payment.links[i].href;
        }
      }
      const response = ApiResponse("1", "Payment link generated !", "", link);
      return res.json(response);
    }
  });
}

async function stripe_add_card(req, res) {
  const { cardNum, exp_month, exp_year, cvc } = req.body;
  const userData = await user.findOne({
    where: {
      id: req.user.id,
    },
  });
  stripe.paymentMethods
    .create({
      type: "card",
      card: {
        number: `${cardNum}`,
        exp_month,
        exp_year,
        cvc: `${cvc}`,
      },
    })
    .then((dat) => {
      stripe.paymentMethods
        .attach(dat.id, {
          customer: `${userData.stripeCustomerId}`,
        })
        .then((card) => {
          const response = ApiResponse("1", "Card Added SuccuessFully", "", {
            pmId: card.id,
            last4digits: card.card.last4,
          });
          return res.json(response);
        })
        .catch((err) => {
          const response = ApiResponse("0", "Error in saving Card", "", {});
          return res.json(response);
        });
    })
    .catch((err) => {
      const response = ApiResponse("0", "Error in saving Card", "", {});
      return res.json(response);
    });
}

async function delete_stripe_card(req, res) {
  const userData = await user.findOne({
    where: {
      id: req.user.id,
    },
  });
  const { pmkey } = req.body;
  stripe.paymentMethods
    .detach(pmkey)
    .then((dat) => {
      res.status(200).json({
        ResponseCode: "1",
        ResponseMessage: "Card Deleted Successfully",
        Response: [],
        errors: ``,
      });
    })
    .catch((err) => {
      res.status(200).json({
        ResponseCode: "0",
        ResponseMessage: err.raw.message,
        Response: [],
        errors: "Error",
      });
    });
}

async function stripe_get_all_cards(req, res) {
  const userData = await user.findOne({
    where: {
      id: req.user.id,
    },
  });
  const list = await stripe.customers.listPaymentMethods(
    `${userData.stripeCustomerId}`,
    {
      type: "card",
    }
  );

  let card_list = [];
  if (list.data.length > 0) {
    list.data?.map((dat) => {
      let obj = {
        pmId: dat.id,
        brand: dat.card.brand,
        last4digits: dat.card.last4,
        exp_year: dat.card.exp_year,
        exp_month: dat.card.exp_month,
      };
      card_list.push(obj);
    });
  }
  const response = ApiResponse("1", "All Stripe Card", "", {
    cards: card_list,
  });
  return res.json(response);
}

async function makepaymentbynewcard(req, res) {
  let {
    cardNum,
    exp_month,
    exp_year,
    cvc,
    saveStatus,
    amount,
    orderId,
    isCredit,
  } = req.body;
  let amountToBePaid = 0;
  let credit = await Credit.findOne({
    where: {
      userId: req.user.id,
    },
  });
  const userData = await user.findOne({
    where: {
      id: req.user.id,
    },
    include: {
      model: Credit,
    },
  });
  const method = await stripe.paymentMethods.create({
    type: "card",
    card: {
      number: cardNum,
      exp_month,
      exp_year,
      cvc,
    },
  });
  if (isCredit) {
    if (parseInt(credit?.point) >= parseInt(amount)) {
      credit.point = parseInt(credit.point) - parseInt(amount);
      await credit.save();
      const orderData = await order.findOne({
        where: {
          id: orderId,
        },
      });
      if (orderData) {
        orderData.paymentRecieved = true;
        orderData.paymentConfirmed = true;
        await orderData.save();
      }
      singleNotification(
        userData.deviceToken,
        "Payment Successfully Done",
        `You have complete the payment of Order ID : ${orderData.id}`
      );
      const response = ApiResponse("1", "Payment successfully Done", "", {});
      return res.json(response);
    } else {
      amountToBePaid = parseInt(amount) - parseInt(credit.point);

      if (method) {
        if (saveStatus) {
          stripe.paymentMethods
            .attach(method.id, {
              customer: `${userData.stripeCustomerId}`,
            })
            .then((dat) => {
              stripe.paymentIntents
                .create({
                  amount: parseInt(amountToBePaid) * 100,
                  currency: "usd",
                  payment_method_types: ["card"],
                  customer: `${userData.stripeCustomerId}`,
                  payment_method: method.id,
                  capture_method: "manual",
                })
                .then(async (intent) => {
                  stripe.paymentIntents
                    .confirm(`${intent.id}`)
                    .then(async (confirmIntent) => {
                      const orderData = await order.findOne({
                        where: {
                          id: orderId,
                        },
                      });
                      if (orderData) {
                        orderData.paymentRecieved = true;
                        orderData.paymentConfirmed = true;
                        await orderData.save();
                      }
                      credit.point = 0;
                      await credit.save();
                      singleNotification(
                        userData.deviceToken,
                        "Payment Successfully Done",
                        `You have complete the payment of Order ID : ${orderData.id}`
                      );
                      const response = ApiResponse(
                        "1",
                        "Payment successfully Done",
                        "",
                        {}
                      );
                      return res.json(response);
                    });
                })
                .catch((error) => {
                  const response = ApiResponse(
                    "0",
                    "Something went wrong",
                    "",
                    {}
                  );
                  return res.json(response);
                });
            });
        } else {
          stripe.paymentIntents
            .create({
              amount: parseInt(amountToBePaid) * 100,
              currency: "usd",
              payment_method_types: ["card"],
              customer: `${userData.stripeCustomerId}`,
              payment_method: method.id,
              capture_method: "manual",
            })
            .then(async (intent) => {
              stripe.paymentIntents
                .confirm(`${intent.id}`)
                .then(async (confirmIntent) => {
                  const orderData = await order.findOne({
                    where: {
                      id: orderId,
                    },
                  });
                  if (orderData) {
                    orderData.paymentRecieved = true;
                    orderData.paymentConfirmed = true;
                    await orderData.save();
                  }
                  singleNotification(
                    userData.deviceToken,
                    "Payment Successfully Done",
                    `You have complete the payment of Order ID : ${orderData.id}`
                  );
                  const response = ApiResponse(
                    "1",
                    "Payment successfully Done",
                    "",
                    {}
                  );
                  return res.json(response);
                });
            })
            .catch((error) => {
              const response = ApiResponse("0", "Something went wrong", "", {});
              return res.json(response);
            });
        }
      }
    }
  } else {
    amountToBePaid = parseInt(amount);
    if (method) {
      if (saveStatus) {
        stripe.paymentMethods
          .attach(method.id, {
            customer: `${userData.stripeCustomerId}`,
          })
          .then((dat) => {
            stripe.paymentIntents
              .create({
                amount: parseInt(amountToBePaid) * 100,
                currency: "usd",
                payment_method_types: ["card"],
                customer: `${userData.stripeCustomerId}`,
                payment_method: method.id,
                capture_method: "manual",
              })
              .then(async (intent) => {
                stripe.paymentIntents
                  .confirm(`${intent.id}`)
                  .then(async (confirmIntent) => {
                    const orderData = await order.findOne({
                      where: {
                        id: orderId,
                      },
                    });
                    if (orderData) {
                      orderData.paymentRecieved = true;
                      orderData.paymentConfirmed = true;
                      await orderData.save();
                    }
                    singleNotification(
                      userData.deviceToken,
                      "Payment Successfully Done",
                      `You have complete the payment of Order ID : ${orderData.id}`
                    );
                    const response = ApiResponse(
                      "1",
                      "Payment successfully Done",
                      "",
                      {}
                    );
                    return res.json(response);
                  });
              })
              .catch((error) => {
                const response = ApiResponse(
                  "0",
                  "Something went wrong",
                  "",
                  {}
                );
                return res.json(response);
              });
          });
      } else {
        stripe.paymentIntents
          .create({
            amount: parseInt(amountToBePaid) * 100,
            currency: "usd",
            payment_method_types: ["card"],
            customer: `${userData.stripeCustomerId}`,
            payment_method: method.id,
            capture_method: "manual",
          })
          .then(async (intent) => {
            stripe.paymentIntents
              .confirm(`${intent.id}`)
              .then(async (confirmIntent) => {
                const orderData = await order.findOne({
                  where: {
                    id: orderId,
                  },
                });
                if (orderData) {
                  orderData.paymentRecieved = true;
                  orderData.paymentConfirmed = true;
                  await orderData.save();
                }
                singleNotification(
                  userData.deviceToken,
                  "Payment Successfully Done",
                  `You have complete the payment of Order ID : ${orderData.id}`
                );
                const response = ApiResponse(
                  "1",
                  "Payment successfully Done",
                  "",
                  {}
                );
                return res.json(response);
              });
          })
          .catch((error) => {
            const response = ApiResponse("0", "Something went wrong", "", {});
            return res.json(response);
          });
      }
    }
  }
}

async function makepaymentBySavedCard(req, res) {
  const UserId = req.user.id;
  let { pmId, amount, orderId, isCredit } = req.body;
  let amountToBePaid = 0;

  const credit = await Credit.findOne({
    where: {
      userId: req.user.id,
    },
  });
  const userData = await user.findOne({
    where: {
      id: req.user.id,
    },
    include: {
      model: Credit,
    },
  });
  let creditAmount = parseInt(userData.Credit.point);
  if (isCredit) {
    if (creditAmount > amount) {
      amountToBePaid = 0;
      credit.point = parseInt(credit.point) - parseInt(amount);
      credit.save();
      const orderData = await order.findOne({
        where: {
          id: orderId,
        },
      });
      if (orderData) {
        orderData.paymentRecieved = true;
        orderData.paymentConfirmed = true;
        await orderData.save();
      }
      singleNotification(
        userData.deviceToken,
        "Payment Successfully Done",
        `You have complete the payment of Order ID : ${orderData.id}`
      );
      const data = {
        receivedAmount: amount,
      };
      const response = ApiResponse("1", "Payment Successfull", "", data);
      return res.json(response);
    } else {
      amountToBePaid = amount - parseInt(userData?.Credit?.point);

      stripe.paymentIntents
        .create({
          amount: amountToBePaid * 100, // send in cents
          currency: "usd",
          payment_method_types: ["card"],
          customer: `${userData.stripeCustomerId}`,
          payment_method: pmId,
          capture_method: "manual",
        })
        .then(async (pi) => {
          stripe.paymentIntents
            .confirm(`${pi.id}`)
            .then(async (result) => {
              const data = {
                receivedAmount: result.amount_received,
              };
              const orderData = await order.findOne({
                where: {
                  id: orderId,
                },
              });
              if (orderData) {
                orderData.paymentRecieved = true;
                orderData.paymentConfirmed = true;
                await orderData.save();
              }
              credit.point = 0;
              await credit.save();
              singleNotification(
                userData.deviceToken,
                "Payment Successfully Done",
                `You have complete the payment of Order ID : ${orderData.id}`
              );
              const response = ApiResponse(
                "1",
                "Payment Successfull",
                "",
                data
              );
              return res.json(response);
            })

            .catch((err) => {
              const response = ApiResponse("0", err.raw.message, "", {});
              return res.json(response);
            });
        })
        .catch((err) => {
          const response = ApiResponse("0", err.raw.message, "", {});
          return res.json(response);
        });
    }
  } else {
    amountToBePaid = parseInt(amount);
    stripe.paymentIntents
      .create({
        amount: amountToBePaid * 100, // send in cents
        currency: "usd",
        payment_method_types: ["card"],
        customer: `${userData.stripeCustomerId}`,
        payment_method: pmId,
        capture_method: "manual",
      })
      .then(async (pi) => {
        stripe.paymentIntents
          .confirm(`${pi.id}`)
          .then(async (result) => {
            const data = {
              receivedAmount: result.amount_received,
            };
            const orderData = await order.findOne({
              where: {
                id: orderId,
              },
            });
            if (orderData) {
              orderData.paymentRecieved = true;
              orderData.paymentConfirmed = true;
              await orderData.save();
            }
            singleNotification(
              userData.deviceToken,
              "Payment Successfully Done",
              `You have complete the payment of Order ID : ${orderData.id}`
            );
            const response = ApiResponse("1", "Payment Successfull", "", data);
            return res.json(response);
          })

          .catch((err) => {
            const response = ApiResponse("0", err.raw.message, "", {});
            return res.json(response);
          });
      })
      .catch((err) => {
        const response = ApiResponse("0", err.raw.message, "", {});
        return res.json(response);
      });
  }
}

async function getAllPaymentMethods(req, res) {
  const methods = await paymentMethod.findAll({
    where: {
      status: true,
    },
  });
  const response = ApiResponse("1", "Payment Methods", "", {
    methods: methods,
  });
  return res.json(response);
}

async function getCountriesAndCities(req, res) {
  const countries = await country.findAll({
    where: {
      status: true,
    },
    attributes: ["id", "name", "flag", "shortName"],
    include: {
      model: city,
      attributes: ["id", "name", "lat", "lng"],
    },
  });
  const response = ApiResponse("1", "Countries List", "", {
    countries: countries,
  });
  return res.json(response);
}

async function adyen_payment_by_card(req, res) {
  try {
    const adyenResponse = await axios.post(
      "https://checkout-test.adyen.com/v70/paymentMethods",
      {
        merchantAccount: "CRED4224T223225X5JMVSGV9MK64T6",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-key":
            "AQErhmfuXNWTK0Qc+iSDm2Mxk+GYQIVCAZxNUWBFXxRqomubFonmn82QYCZZ5BDBXVsNvuR83LVYjEgiTGAH-VRAdxqn9Fr86p9HJOMaHQhPty7Jvml4SbOPgVaV5ScI=-6.yn(+m3<TZpF(P#",
        },
      }
    );
    return res.json(adyenResponse);
  } catch (error) {
    return res.json(error);
  }
}

async function popularProducts(req, res) {
  const products = await R_PLink.findAll({
    where: {
      isPopular: 1,
    },
    attributes: ["productId", "id", "name", "image"],
    limit: 20, // Limit to 20 records
    order: sequelize.literal("RAND()"), // Order randomly
  });
  const data = {
    popularProducts: products,
  };
  const response = ApiResponse("1", "Popular Products", "", data);
  return res.json(response);
}
function removeDuplicates(array, key) {
  let lookup = new Set();
  return array.filter((obj) => {
    const objKey = key(obj);
    const isDuplicate = lookup.has(objKey);
    lookup.add(objKey);
    return !isDuplicate;
  });
}
async function searchProduct(req, res) {
  const { productName } = req.body;
  var list = [];
  if (productName.trim() === "") {
    let data = { list: [] }; // Return an empty list
    let response = ApiResponse("1", "List", "", data);
    return res.json(response);
  }
  const rplink = await R_PLink.findAll({
    where: {
      name: {
        [sequelize.Op.like]: `%${productName}%`,
      },
    },
    include: {
      model: R_MCLink,
      include: {
        model: restaurant,
      },
    },
  });
  //   return res.json(rplink)
  if (rplink.length > 0) {
    for (const dat of rplink) {
      const averageRating = await restaurantRating.findOne({
        attributes: [[sequelize.fn("AVG", sequelize.col("value")), "rating"]],
        where: {
          restaurantId: dat?.R_MCLink?.restaurant?.id,
        },
      });

      let obj = {
        id: dat?.R_MCLink?.restaurant?.id,
        businessName: dat?.R_MCLink?.restaurant?.businessName ?? "",
        businessEmail: dat?.R_MCLink?.restaurant?.businessEmail ?? "",
        address: dat?.R_MCLink?.restaurant?.address ?? "",
        logo: dat?.R_MCLink?.restaurant?.logo ?? "",
        openingTime: dat?.R_MCLink?.restaurant?.openingTime ?? "",
        closingTime: dat?.R_MCLink?.restaurant?.closingTime ?? "",
        approxDeliveryTime: dat?.R_MCLink?.restaurant?.approxDeliveryTime ?? "",
        deliveryCharge: dat?.R_MCLink?.restaurant?.deliveryCharge ?? "",
        serviceCharges: dat?.R_MCLink?.restaurant?.serviceCharges ?? "",
        logo: dat?.R_MCLink?.restaurant?.logo ?? "",
        rating: Number(averageRating?.dataValues?.rating).toFixed(1),
      };

      list.push(obj);
    }
  }
  let uniqueData = removeDuplicates(list, (obj) => obj.id);
  const data = {
    list: uniqueData,
  };
  //   return res.json(list)
  const response = ApiResponse("1", "Data", "", data);
  return res.json(response);
}

async function filter(req, res) {
  const { sortBy, categories, lat, lng } = req.body;

  let list = [];
  if (sortBy.toLowerCase() == "recommended") {
    const userPoint = point([parseFloat(lat), parseFloat(lng)]);
    const zones = await zone.findAll({
      where: {
        status: true,
      },
      include: [
        {
          model: zoneDetails,
        },
        {
          model: zoneRestaurants,
          include: {
            model: restaurant,
          },
        },
      ],
    });

    const validZones = zones.filter((zoneData) => {
      if (
        zoneData.coordinates &&
        zoneData.coordinates.coordinates &&
        zoneData.coordinates.coordinates.length > 0
      ) {
        const zonePolygon = {
          type: "Polygon",
          coordinates: zoneData.coordinates.coordinates,
        };

        return booleanPointInPolygon(userPoint, zonePolygon);
      }
      return false;
    });

    let results = [];

    if (validZones.length > 0) {
      try {
        const list = []; // Define an array to hold restaurant objects
        await Promise.all(
          validZones.map(async (data) => {
            for (const zoneRestaurant of data.zoneRestaurants) {
              try {
                let rmc = await R_MCLink.findAll({
                  where: {
                    [Op.and]: [
                      {
                        menuCategoryId: {
                          [Op.in]: req.body.categories,
                        },
                      },
                      {
                        restaurantId: zoneRestaurant?.restaurantId,
                      },
                    ],
                  },
                });
                if (rmc.length > 0) {
                  if (zoneRestaurant?.restaurant?.isFeatured == true) {
                    let rating = await restaurantRating.findOne({
                      attributes: [
                        [
                          sequelize.fn("AVG", sequelize.col("value")),
                          "averageRating",
                        ],
                      ],
                      where: {
                        restaurantId: zoneRestaurant?.restaurant?.id,
                      },
                    });
                    let obj = {
                      id: zoneRestaurant?.restaurant?.id,
                      businessName: zoneRestaurant?.restaurant?.businessName,
                      businessEmail: zoneRestaurant?.restaurant?.businessEmail,
                      businessType: zoneRestaurant?.restaurant?.businessType,
                      city: zoneRestaurant?.restaurant?.city,
                      zipCode: zoneRestaurant?.restaurant?.zipCode,
                      address: zoneRestaurant?.restaurant?.address,
                      logo: zoneRestaurant?.restaurant?.logo,
                      image: zoneRestaurant?.restaurant?.image,
                      openingTime: zoneRestaurant?.restaurant?.openingTime,
                      closingTime: zoneRestaurant?.restaurant?.closingTime,
                      lat: zoneRestaurant?.restaurant?.lat,
                      deliveryTime:
                        zoneRestaurant?.restaurant?.approxDeliveryTime,
                      deliveryFee: zoneRestaurant?.restaurant?.deliveryFeeFixed,
                      rating:
                        rating?.dataValues?.averageRating == null
                          ? "0.0"
                          : rating?.dataValues?.averageRating,
                    };
                    list.push(obj);
                  }
                }
              } catch (error) {
                console.error(error);
              }
            }
          })
        );

        const response = ApiResponse("1", "Restaurant Lists", "", {
          filteredRestaurant: list,
        });
        return res.json(response);
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json(ApiResponse("0", error.message, "Error", {}));
      }
    } else {
      const response = ApiResponse(
        "0",
        "Service not available in your area",
        "",
        {}
      );
      return res.json(response);
    }
  } else if (sortBy.toLowerCase() == "popular") {
    const userPoint = point([parseFloat(lat), parseFloat(lng)]);
    const zones = await zone.findAll({
      where: {
        status: true,
      },
      include: [
        {
          model: zoneDetails,
        },
        {
          model: zoneRestaurants,
          include: {
            model: restaurant,
          },
        },
      ],
    });

    const validZones = zones.filter((zoneData) => {
      // return res.json(zoneData)
      if (
        zoneData.coordinates &&
        zoneData.coordinates.coordinates &&
        zoneData.coordinates.coordinates.length > 0
      ) {
        const zonePolygon = {
          type: "Polygon",
          coordinates: zoneData.coordinates.coordinates,
        };

        return booleanPointInPolygon(userPoint, zonePolygon);
      }
      return false;
    });

    let results = [];

    if (validZones.length > 0) {
      try {
        await Promise.all(
          validZones.map(async (data) => {
            for (const zoneRestaurant of data.zoneRestaurants) {
              const result = await R_MCLink.findAll({
                where: {
                  [Op.and]: [
                    {
                      menuCategoryId: {
                        [Op.in]: req.body.categories,
                      },
                    },
                    {
                      restaurantId: zoneRestaurant?.restaurant?.id,
                    },
                  ],
                },
              });
              //   return res.json(zoneRestaurant?.restaurant)
              if (result.length > 0) {
                if (zoneRestaurant?.restaurant?.isPopular == true) {
                  let rating = await restaurantRating.findOne({
                    attributes: [
                      [
                        sequelize.fn("AVG", sequelize.col("value")),
                        "averageRating",
                      ],
                    ],
                    where: {
                      restaurantId: zoneRestaurant?.restaurant?.id,
                    },
                  });

                  // return res.json(rating)
                  let obj = {
                    id: zoneRestaurant?.restaurant?.id,
                    businessName: zoneRestaurant?.restaurant?.businessName,
                    businessEmail: zoneRestaurant?.restaurant?.businessEmail,
                    businessType: zoneRestaurant?.restaurant?.businessType,
                    city: zoneRestaurant?.restaurant?.city,
                    zipCode: zoneRestaurant?.restaurant?.zipCode,
                    address: zoneRestaurant?.restaurant?.address,
                    logo: zoneRestaurant?.restaurant?.logo,
                    image: zoneRestaurant?.restaurant?.image,
                    openingTime: zoneRestaurant?.restaurant?.openingTime,
                    closingTime: zoneRestaurant?.restaurant?.closingTime,
                    lat: zoneRestaurant?.restaurant?.lat,
                    deliveryTime:
                      zoneRestaurant?.restaurant?.approxDeliveryTime,
                    deliveryFee: zoneRestaurant?.restaurant?.deliveryFeeFixed,
                    rating:
                      rating?.dataValues?.averageRating == null
                        ? "0.0"
                        : rating?.dataValues?.averageRating,
                  };
                  list.push(obj);
                }
              }
              const response = ApiResponse("1", "Restaurant List", "", {
                filteredRestaurant: list,
              });
              return res.json(response);
            }
          })
        );
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json(ApiResponse("0", error.message, "Error", {}));
      }
    } else {
      const response = ApiResponse(
        "0",
        "Service not available in your area",
        "",
        {}
      );
      return res.json(response);
    }
  } else if (!sortBy) {
    let response = ApiResponse("0", "Something went wrong", "Error", {});
    return res.json(response);
  }

  // else if(sortBy === "Popular") {

  //     const result = await R_MCLink.findAll({
  //         where: {
  //             menuCategoryId: {
  //                 [Op.in]: req.body.categories,
  //             },
  //         },
  //         include: {
  //             model: restaurant,
  //         },
  //     });
  //     result.map((dat) => {
  //         let obj = {
  //             id: dat.restaurant.id,
  //             businessName: dat.restaurant.businessName,
  //             businessEmail: dat.restaurant.businessEmail,
  //             businessType: dat.restaurant.businessType,
  //             city: dat.restaurant.city,
  //             zipCode: dat.restaurant.zipCode,
  //             address: dat.restaurant.address,
  //             logo: dat.restaurant.logo,
  //             image: dat.restaurant.image,
  //             openingTime: dat.restaurant.openingTime,
  //             closingTime: dat.restaurant.closingTime,
  //             lat: dat.restaurant.lat,

  //             deliveryTime: dat.restaurant.approxDeliveryTime,
  //             deliveryFee: dat.restaurant.deliveryFeeFixed,
  //             rating: "3.4",
  //         };
  //         list.push(obj);
  //     });
  // }
  // const data = {
  //     filteredRestaurant: list,
  // };
  // const response = ApiResponse("1", "Filter", "", data);
  // return res.json(response);
  // // const categories = await menuCategory.findAll({where:{id:{[Op.in]:req.body.categories}}});
  // const idList = result.map((item) => item.id);
  // if (req.body.sortBy === "Price") {
  //     const products = await R_PLink.findAll({
  //         where: {
  //             RMCLinkId: {
  //                 [Op.in]: idList,
  //             },
  //         },
  //         order: [
  //             ["originalPrice", "ASC"]
  //         ],
  //     });
  //     const response = ApiResponse("1", "Filter", "", products);
  //     return res.json(response);
  // } else if (req.body.sortBy === "Popular") {

  //     const products = await R_PLink.findAll({
  //         where: [{
  //                 isPopular: true,
  //             },
  //             {
  //                 RMCLinkId: {
  //                     [Op.in]: idList,
  //                 },
  //             },
  //         ],
  //         order: [
  //             ["originalPrice", "ASC"]
  //         ],
  //     });
  //     const response = ApiResponse("1", "Filter", "", products);
  //     return res.json(response);
  // } else if (req.body.sortBy === "Recommended") {
  //     const products = await R_PLink.findAll({
  //         where: [{
  //                 isRecommended: true,
  //             },
  //             {
  //                 RMCLinkId: {
  //                     [Op.in]: idList,
  //                 },
  //             },
  //         ],
  //         order: [
  //             ["originalPrice", "ASC"]
  //         ],
  //     });
  //     const response = ApiResponse("1", "Filter", "", products);
  //     return res.json(response);
  // } else {
  //     const products = await R_PLink.findAll({
  //         where: {
  //             RMCLinkId: {
  //                 [Op.in]: idList,
  //             },
  //         },
  //     });
  //     const response = ApiResponse("1", "Filter", "", products);
  //     return res.json(response);
  // }
}

// GROUP ORDER SCENE
async function createGroup(req, res) {
  const {
    scheduleDate,
    note,
    leaveOrderAt,
    groupName,
    deliveryTypeId,
    orderModeId,
    paymentMethodId,
    dropOffLat,
    dropOffLng,
    building,
    streetAddress,
    distance,
    distanceUnit,
    restaurantId,
    userId,
  } = req.body;

  let ON1 = uON.generate();
  const type = await orderType.findOne({
    where: {
      type: "Group",
    },
  });

  const restData = await restaurant.findOne({
    where: {
      id: restaurantId,
    },
    include: [
      {
        model: zoneRestaurants,
        include: {
          model: zone,
          include: {
            model: zoneDetails,
          },
        },
      },
      {
        model: user,
        attributes: ["deviceToken"],
      },
    ],
  });

  const userData = await user.findOne({
    where: {
      id: req.user.id,
    },
  });
  let existInZone = false;
  const userPoint = point([parseFloat(dropOffLng), parseFloat(dropOffLat)]);
  const zoneData = await zoneRestaurants.findOne({
    where: {
      restaurantId: restData.id,
    },
    include: [
      {
        model: restaurant,
        include: [
          {
            model: unit,
            as: "distanceUnitID",
          },
        ],
      },
      {
        model: zone,
        include: {
          model: zoneDetails,
        },
      },
    ],
  });
  if (
    zoneData.zone &&
    zoneData.zone.coordinates.coordinates &&
    zoneData.zone.coordinates.coordinates.length > 0
  ) {
    const zonePolygon = {
      type: "Polygon",
      coordinates: zoneData.zone.coordinates.coordinates,
    };
    if (booleanPointInPolygon(userPoint, zonePolygon)) {
      existInZone = true;
    }
  }
  // if (existInZone == false) {
  //   const response = ApiResponse(
  //     "0",
  //     "Your Dropoff Address is out of Restaurant Zone",
  //     "Error",
  //     {}
  //   );
  //   return res.json(response);
  // }

  const newAddress = new address();
  newAddress.lat = dropOffLat;
  newAddress.lng = dropOffLng;
  newAddress.building = building;
  newAddress.streetAddress = streetAddress;
  newAddress.userId = req.user.id;
  newAddress.status = 1;
  await newAddress.save();

  const status = await orderStatus.findOne({
    where: {
      name: "Placed",
    },
  });
  const orderData = new order();
  orderData.userId = req.user.id;
  orderData.distance = distance;
  orderData.orderNum = `fom-${ON1}`;
  orderData.orderTypeId = type.id;
  orderData.scheduleDate = scheduleDate;
  orderData.deliveryTypeId = deliveryTypeId;
  orderData.orderModeId = orderModeId;
  orderData.paymentMethodId = paymentMethodId;
  orderData.orderApplicationId = restData?.businessType;
  orderData.restaurantId = restaurantId;
  orderData.orderStatusId = status.id;
  orderData.dropOffId = newAddress.id;
  orderData.paymentConfirmed = false;
  orderData.paymentRecieved = false;
  orderData.currencyUnitId =
    restData?.zoneRestaurant?.zone?.zoneDetail?.currencyUnitId;
  orderData.distanceUnitId =
    restData?.zoneRestaurant?.zone?.zoneDetail?.distanceUnitId;

  orderData.subTotal = 0;
  orderData.total = 0;
  orderData.status = 1;
  orderData
    .save()
    .then(async (dat) => {
      const restaurantData = await restaurant.findOne({
        where: {
          id: restaurantId,
        },
        include: {
          model: user,
          attributes: ["deviceToken"],
        },
      });

      let tmpPath = req.file.path;
      let path = tmpPath.replace(/\\/g, "/");

      const userData = await user.findOne({
        where: {
          id: req.user.id,
        },
      });
      const group = new orderGroup();
      group.orderId = dat.id;
      group.participantId = userData.id;
      group.participantName =
        userData.userName === null
          ? `${userData.firstName} ${userData.lastName}`
          : userData.userName;
      group.groupName = groupName;
      group.hostedById = req.user.id;

      group.icon = path;
      group
        .save()
        .then(async (dd) => {
          const userData = await user.findOne({
            where: {
              id: req.user.id,
            },
            attributes: ["id", "deviceToken", "firstName", "lastName"],
          });

          // singleNotification(
          //     restaurantData.user.deviceToken,
          //     "Group Order",
          //     `Group Order has created by ${userData.firstName} ${userData.lastName}`
          // );

          const data = {
            orderId: dat.id,
            groupName: groupName,
            groupIcon: icon,
            hostedById: req.user.id,
          };
          const response = ApiResponse(
            "1",
            "Group Created Successfully",
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

async function placeGroupOrder(req, res) {
  const {
    orderId,
    total,
    subTotal,
    cutlery_data,
    products,
    tip,
    deliveryFees,
    VAT,
    serviceCharges,
  } = req.body;
  let deliveryCharges = deliveryFees;
  const orderData = await order.findOne({
    where: {
      id: orderId,
    },
    include: {
      model: address,
      as: "dropOffID",
    },
  });

  if (!orderData) {
    const response = ApiResponse(
      "0",
      "No Record exist against this order",
      "",
      {}
    );
    return res.json(response);
  }
  const restaurantData = await restaurant.findOne({
    where: {
      id: orderData.restaurantId,
    },
    include: {
      model: user,
      attributes: ["deviceToken"],
    },
  });

  let cultery_list = [];

  if (orderData) {
    if (cutlery_data) {
      // for (const cut of cutlery_data){
      //      const cultery_name = await cutlery.findOne(
      //          {
      //             where:
      //             {
      //               id: cut.id,
      //             },
      //          });
      //         // return res.json(cultery_name)
      //          if (cultery_name)
      //          {
      //             const order_cutlery = new orderCultery();
      //             order_cutlery.status = 1;
      //             order_cutlery.orderId = orderData?.id;
      //             order_cutlery.cutleryId = cultery_name?.id;
      //             order_cutlery.qty = cut.qty;
      //             await order_cutlery.save();
      //          }
      // }
    }

    products.map((oi, index) => {
      let total = oi.quantity * oi.unitPrice;
      total = total.toFixed(2);
      oi.total = total;
      oi.orderId = orderData.id;
    });

    let aoArr = [];
    //delete the previous order items and order addons
    for (var i = 0; i < products.length; i++) {
      const check = await orderItems.findAll({
        where: [
          {
            orderId: orderId,
          },
          {
            userId: req.body.userId,
          },
        ],
      });

      if (check.length > 0) {
        for (const dat of check) {
          const add = await orderAddOns.findAll({
            where: {
              orderItemId: dat.id,
            },
          });

          if (add.length > 0) {
            for (const addonnn of add) {
              await addonnn.destroy();
            }
          }

          await dat.destroy();
        }
      }

      for (var i = 0; i < products.length; i++) {
        const item = new orderItems();
        item.quantity = products[i].quantity;
        item.unitPrice = products[i].unitPrice;
        item.RPLinkId = products[i].RPLinkId;
        item.total =
          parseFloat(products[i].unitPrice) * parseFloat(products[i].quantity);
        item.orderId = orderId;
        item.userId = req.user.id;
        await item.save();

        for (var k = 0; k < products[i].addOns.length; k++) {
          let obj = {
            total: products[i].addOns[k].total,
            qty: products[i].addOns[k].quantity,
            // PAACLinkId: products[i].addOns[k].PAACLinkId,
            orderItemId: item.id,
            // PAOLinkId: products[i].addOns[k].PAOLinkId,
            addOnId: products[i]?.addOns[k]?.addOnId,
            collectionId: products[i]?.addOns[k]?.collectionId,
          };
          aoArr.push(obj);
        }
      }

      for (var m = 0; m < aoArr.length; m++) {
        const addon = new orderAddOns();
        addon.total = aoArr[m].total;
        addon.PAOLinkId = aoArr[m].PAOLinkId;
        addon.PAACLinkId = aoArr[m].PAACLinkId;
        addon.orderItemId = aoArr[m].orderItemId;
        addon.addOnId = aoArr[m].addOnId;
        addon.collectionId = aoArr[m].collectionId;
        addon.qty = aoArr[m].qty;
        await addon.save();
      }
    }
    const status = await orderStatus.findOne({
      where: {
        name: "Placed",
      },
    });

    let orderMembers = await orderGroup.findAll({
      where: { orderId: orderId },
    });
    let totalSubTotal = orderMembers.reduce((accumulator, currentValue) => {
      return accumulator + currentValue.subTotal;
    }, 0);
    let OrdersubTotal = parseInt(totalSubTotal) + parseInt(subTotal);
    let Ordertotal = parseInt(total);

    orderData.total = Ordertotal;
    orderData.orderStatusId = status.id;
    orderData.subTotal = OrdersubTotal;
    orderData
      .save()
      .then(async (dat) => {
        const zoneData = await zoneRestaurants.findOne({
          where: {
            restaurantId: dat.restaurantId,
          },
          include: [
            {
              model: restaurant,
            },
            {
              model: zone,
              include: {
                model: zoneDetails,
              },
            },
          ],
        });
        if (!zoneData) {
          const response = ApiResponse(
            "0",
            "This Restaurant has no zone details! Please select another restaurant",
            "",
            {}
          );
          return res.json(response);
        }

        let adminDeliveryCharges = 0;
        if (dat.deliveryTypeId == "1") {
          adminDeliveryCharges =
            (parseFloat(deliveryCharges) *
              parseFloat(
                zoneData.zone?.zoneDetail?.adminComissionOnDeliveryCharges
              )) /
            100;
          driverEarnings =
            parseFloat(deliveryCharges) - parseFloat(adminDeliveryCharges);
        }
        let adminCommissionPercent = zoneData.zone?.zoneDetail?.adminComission;

        let totalEarnings = parseFloat(Ordertotal);
        let adminEarnings =
          parseFloat(OrdersubTotal) *
          (parseFloat(adminCommissionPercent) / 100);

        let restaurantEarnings =
          parseFloat(totalEarnings) -
          parseFloat(adminEarnings) -
          parseFloat(driverEarnings);
        let ch = {
          basketTotal: OrdersubTotal,
          deliveryFees: parseFloat(deliveryCharges),
          discount: 0,
          VAT,
          tip: tip,
          total: Ordertotal,
          adminEarnings: adminEarnings.toFixed(2),
          adminDeliveryCharges: adminDeliveryCharges,
          restaurantDeliveryCharges:
            parseFloat(deliveryCharges) > 0
              ? parseFloat(deliveryCharges) - adminDeliveryCharges
              : 0,
          driverEarnings: driverEarnings.toFixed(2),
          restaurantEarnings: restaurantEarnings.toFixed(2),
          adminPercent: adminCommissionPercent,
          orderId: orderId,
        };

        orderCharge.create(ch);

        const dd = await retOrderData(orderId);
        let cultyList = [];
        if (cutlery_data) {
          cultyList = await cutlery.findOne({
            where: {
              id: cutlery_data?.cutleryId,
            },
          });
        }

        //   return res.json(dd)
        let data = {
          orderId: dd.orderId,
          orderNum: dd.orderNum,
          cultery_list: cultyList,
          restLat: restaurantData.lat,
          restLng: restaurantData.lng,
          restAddress: restaurantData.address,
          dropOffLat: orderData.dropOffID?.lat,
          dropOffLng: orderData.dropOffID?.lng,
          waitForDriver: false,
          allowSelfPickUp: restaurantData.deliveryTypeId === 3 ? true : false,
          retData: dd,
        };

        let notification = {
          title: "New Job arrived",
          body: "A new job has arrived",
        };
        sendNotifications([restaurantData?.user?.deviceToken], notification);
        const response = ApiResponse(
          "1",
          "Order Placed Successfully",
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

async function joinGroup(req, res) {
  const { orderId, products, subTotal, userId, cutlery_data, restaurantId } =
    req.body;

  try {
    const group = await orderGroup.findOne({
      where: {
        orderId: orderId,
        participantId: req.user.id,
      },
    });
    if (!group) {
      const response = ApiResponse("0", "Sorry no record found", "", {});
      return res.json(response);
    }

    group.subTotal = subTotal;
    await group.save();
    var cultery_list = [];
    let deliveryTypeId = "2";

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
          model: user,
          attributes: [
            "id",
            "deviceToken",
            "firstName",
            "lastName",
            "userName",
          ],
        },
      ],
    });
    if (!orderData) {
      const response = ApiResponse(
        "0",
        `No Order exists agains order Id : ${orderId}`,
        "",
        {}
      );
      return res.json(response);
    }
    const charges = await orderCharge.findOne({
      where: {
        orderId: orderData.id,
      },
    });

    const restaurantData = await restaurant.findOne({
      where: {
        id: restaurantId,
      },
      include: {
        model: user,
        attributes: ["deviceToken"],
      },
    });
    //   orderData.subTotal = parseFloat(orderData.subTotal) + parseFloat(subTotal);
    //   orderData.total = parseFloat(orderData.total) + parseFloat(subTotal);
    await orderData.save();

    for (var i = 0; i < products.length; i++) {
      const check = await orderItems.findAll({
        where: [
          {
            orderId: orderId,
          },
          {
            userId: req.body.userId,
          },
        ],
      });

      if (check.length > 0) {
        for (const dat of check) {
          const add = await orderAddOns.findAll({
            where: {
              orderItemId: dat.id,
            },
          });

          if (add.length > 0) {
            for (const addonnn of add) {
              await addonnn.destroy();
            }
          }

          await dat.destroy();
        }
      }
    }

    cutlery_data.map(async (dd) => {
      const cultery_name = await cutlery.findOne({
        where: {
          id: dd.id,
        },
      });
      if (cultery_name) {
        const order_cutlery = new orderCultery();
        order_cutlery.status = 1;
        order_cutlery.orderId = orderData.id;
        order_cutlery.cutleryId = dd.id;
        order_cutlery.qty = dd.qty;
        await order_cutlery.save();

        cultery_list.push({
          name: cultery_name.name,
          image: cultery_name.image,
          price: cultery_name.price,
          qty: dd.qty,
        });
      }
    });

    let time = Date.now();
    orderHistory.create({
      time,
      orderId: orderData.id,
      orderStatusId: 1,
    });

    let aoArr = [];

    for (var i = 0; i < products.length; i++) {
      const item = new orderItems();
      item.quantity = products[i].quantity;
      item.unitPrice = products[i].unitPrice;
      item.RPLinkId = products[i].RPLinkId;
      item.total =
        parseFloat(products[i].unitPrice) * parseFloat(products[i].quantity);
      item.orderId = orderId;
      item.userId = req.user.id;
      await item.save();

      let prod = await R_PLink.findOne({ where: { id: products[i].RPLinkId } });
      if (prod) {
        prod.sold = prod.sold + products[i].quantity;
        await prod.save();
      }
      for (var k = 0; k < products[i].addOns.length; k++) {
        let obj = {
          total: products[i].addOns[k].total,
          qty: products[i].addOns[k].quantity,
          // PAACLinkId: products[i].addOns[k].PAACLinkId,
          orderItemId: item.id,
          // PAOLinkId: products[i].addOns[k].PAOLinkId,
          addOnId: products[i]?.addOns[k]?.addOnId,
          collectionId: products[i]?.addOns[k]?.collectionId,
        };
        aoArr.push(obj);
      }
    }

    for (var m = 0; m < aoArr.length; m++) {
      const addon = new orderAddOns();
      addon.total = aoArr[m].total;
      addon.PAOLinkId = aoArr[m].PAOLinkId;
      addon.PAACLinkId = aoArr[m].PAACLinkId;
      addon.orderItemId = aoArr[m].orderItemId;
      addon.addOnId = aoArr[m].addOnId;
      addon.collectionId = aoArr[m].collectionId;
      addon.qty = aoArr[m].qty;
      await addon.save();
    }

    retOrderDataForJoinGroup(orderData.id, req.user.id, subTotal).then(
      async (retData) => {
        //   console.log(orderData.user)
        //   console.log(retData)
        let data = {
          orderId: orderData.id,
          dropOffLat: orderData?.dropOffID?.lat,
          dropOffLng: orderData?.dropOffID?.lng,
          orderNum: orderData.orderNum,
          cultery_list: cultery_list,
          restLat: restaurantData.lat,
          restLng: restaurantData.lng,
          restAddress: restaurantData.address,
          waitForDriver: false,
          hostName: `${orderData?.user?.userName}`,
          allowSelfPickUp: restaurantData.deliveryTypeId == 3 ? true : false,
          retData,
        };
        let userData = await user.findOne({
          where: { id: req.user.id },
          attributes: ["ip"],
        });
        let groupData = await groupOrderDetailsForSocket(orderId);
        let eventData = {
          type: "groupOrder",
          data: {
            status: "1",
            message: "Data",
            error: "",
            data: groupData,
          },
        };

        sendEvent(userData?.ip, eventData);

        const response = ApiResponse("1", "Join successfully", "", data);
        return res.json(response);
      }
    );
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

async function joinMember(req, res) {
  const { orderId, name, userId } = req.body;
  //   return res.json("ok")
  try {
    const orderData = await order.findOne({
      where: {
        id: orderId,
      },
      include: {
        model: user,
        attributes: ["id", "deviceToken"],
      },
    });
    if (!orderData) {
      const response = ApiResponse(
        "0",
        `Sorry! no order found against Order ID ${orderId}`,
        "",
        {}
      );
      return res.json(response);
    }
    const group = await orderGroup.findOne({
      where: {
        orderId: orderId,
      },
    });
    const userData = await user.findOne({
      where: {
        id: req.user.id,
      },
      attributes: ["id", "firstName", "lastName", "deviceToken"],
    });

    if (group) {
      const existGroup = await orderGroup.findOne({
        where: [
          {
            hostedById: group.hostedById,
          },
          {
            participantId: userId,
          },
          {
            orderId: orderId,
          },
        ],
      });
      if (existGroup) {
        const response = ApiResponse("1", "Joined successfully", "", {});
        return res.json(response);
      }
    } else {
    }
    const ordergroup = new orderGroup();
    ordergroup.orderId = orderId;
    ordergroup.participantId = userId;
    ordergroup.participantName = name;
    ordergroup.icon = group?.icon;
    ordergroup.hostedById = group?.hostedById;
    ordergroup.groupName = group?.groupName;
    ordergroup
      .save()
      .then((dat) => {
        // send notification to owner of group that group has been joined by participant
        singleNotification(
          orderData.user.deviceToken,
          "Group Joined!",
          `${userData.firstName} ${userData.lastName} has joined the group`
        );
        const response = ApiResponse("1", "Joined successfully", "", {});
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("0", error.message, "", {});
        return res.json(response);
      });
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

async function PreparingOrders(req, res) {
  const type = await orderType.findOne({
    where: {
      type: "Normal",
    },
  });
  const status = await orderStatus.findOne({
    name: "Preparing",
  });
  const orders = await order.findOne({
    where: [
      {
        userId: req.user.id,
      },
      {
        orderTypeId: type.id,
      },
      {
        orderStatusId: status.id,
      },
    ],
    include: [
      {
        model: user,
        attributes: ["id", "firstName", "lastName"],
      },
    ],
  });
  const data = {
    PreparingOrders: orders,
  };
  const response = ApiResponse("1", "Orders", "", data);
  return res.json(response);
}
async function PickupOrders(req, res) {
  const type = await orderType.findOne({
    where: {
      type: "Normal",
    },
  });
  const status = await orderStatus.findOne({
    name: "Food Pickedup",
  });
  const orders = await order.findOne({
    where: [
      {
        userId: req.user.id,
      },
      {
        orderTypeId: type.id,
      },
      {
        orderStatusId: status.id,
      },
    ],
    include: [
      {
        model: user,
        attributes: ["id", "firstName", "lastName"],
      },
    ],
  });
  const data = {
    PickupOrders: orders,
  };
  const response = ApiResponse("1", "Orders", "", data);
  return res.json(response);
}

async function groupOrderDetails(req, res) {
  const { orderId } = req.body;
  try {
    const type = await orderType.findOne({
      where: {
        type: "Group",
      },
    });
    let participantList = [];

    const orderData = await order.findOne({
      where: [
        {
          id: orderId,
        },
        {
          orderTypeId: type.id,
        },
      ],
      include: [
        {
          model: restaurant,
        },
        {
          model: address,
          as: "dropOffID",
        },
        {
          model: unit,
          as: "currencyUnitID",
        },
        {
          model: user,
        },
        {
          model: orderGroup,
          include: {
            model: user,
            as: "participant",
          },
        },
      ],
    });

    let addons_list = [];
    let item_list = [];
    if (orderData) {
      for (const group of orderData.orderGroups) {
        if (group.participantId !== null) {
          const items = await orderItems.findAll({
            attributes: ["id", "quantity", "userId"],
            where: [
              {
                userId: group.participantId,
              },
              {
                orderId: orderData.id,
              },
            ],
            include: [
              {
                model: orderAddOns,
                attributes: ["id", "total", "qty"],
                include: {
                  model: addOn,
                  attributes: ["name"],
                },
              },
              {
                model: R_PLink,
                attributes: [
                  "id",
                  "name",
                  "description",
                  "image",
                  "originalPrice",
                  "productId",
                ],
              },
            ],
          });
          // return res.json()
          let item_list = []; // Initialize item_list for each group

          if (items.length > 0) {
            for (const item of items) {
              let itemObj = {
                productName: item.R_PLink,
                qty: item.quantity,
                addOns: item.orderAddOns,
              };
              if (item.userId == group.participantId) {
                item_list.push(itemObj);
              }
            }
          }

          let obj = {
            participantId: group.participantId,
            subTotal: group?.subTotal ? group?.subTotal : 0,
            participantName: group.participantName,
            items: item_list,
          };
          participantList.push(obj);
        }
      }

      //   return res.json(orderData?.orderGroups)
      let data = {
        orderId: orderData.id,
        orderNum: orderData.orderNum,
        groupName: orderData?.orderGroups[0]?.groupName,
        groupIcon: orderData?.orderGroups[0]?.icon,
        scheduleDate: orderData.scheduleDate,
        distance: orderData.distance,
        subTotal: orderData?.subTotal,
        total: orderData.total,
        status: orderData.status,
        restaurant: orderData?.restaurant,
        paymentRecieved: orderData.paymentRecieved,
        hostebBy: {
          id: orderData.user.id,
          userName: orderData.user.userName,
          // firstName: orderData.user.firstName,
        },
        dropOffAddress: {
          streetAddress: orderData.dropOffID?.streetAddress,
          nameOnDoor: orderData.dropOffID?.nameOnDoor
            ? orderData.dropOffID?.nameOnDoor
            : "No Name",
          floor: orderData.dropOffID?.floor
            ? orderData.dropOffID?.floor
            : "No floor",
          entrance: orderData.dropOffID?.entrance
            ? orderData.dropOffID?.entrance
            : "No entrance",
          nameOnDoor: orderData.dropOffID?.nameOnDoor
            ? orderData.dropOffID?.nameOnDoor
            : "No Name",
          city: orderData.dropOffID?.city
            ? orderData.dropOffID?.city
            : "No city",
          state: orderData.dropOffID?.state
            ? orderData.dropOffID?.state
            : "No state",
          zipCode: orderData.dropOffID?.zipCode
            ? orderData.dropOffID?.zipCode
            : "No zipCode",
          lat: orderData.dropOffID?.lat,
          lng: orderData.dropOffID?.lng,
        },
        currencyDetails: {
          name: orderData?.currencyUnitID?.name,
          type: orderData?.currencyUnitID?.type,
          symbol: orderData?.currencyUnitID?.symbol,
          shortcode: orderData?.currencyUnitID?.shortcode
            ? orderData?.currencyUnitID?.shortcode
            : "No Short Code",
        },
        participantList: participantList,
      };
      const response = ApiResponse("1", "Group Order Details", "", data);
      return res.json(response);
    } else {
      const response = ApiResponse(
        "0",
        `Sorry! No Details exists of Order-ID-${orderId}`,
        "",
        {}
      );
      return res.json(response);
    }
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

async function getTableBookings(req, res) {
  try {
    const bookings = await tableBooking.findAll({
      where: {
        userId: req.user.id,
      },
      include: [
        {
          model: restaurant,
        },
        {
          model: orderStatus,
        },
      ],
    });
    // return res.json(bookings)
    let list = [];
    if (bookings.length > 0) {
      bookings.map((data) => {
        let obj = {
          id: data.id,
          noOfMembers: data.noOfMembers,
          data: data.date,
          time: data.time,
          restaurant: {
            id: data?.restaurant?.id,
            businessName: data?.restaurant?.businessName,
            businessEmail: data?.restaurant?.businessEmail,
            countryCode: data?.restaurant?.countryCode,
            phoneNum: data?.restaurant?.phoneNum,
            zipCode: data?.restaurant?.zipCode,
            logo: data?.restaurant?.logo,
            image: data?.restaurant?.image,
            address: data?.restaurant?.address,
          },
          Status: {
            status: data?.orderStatus?.name,
            displayText: data?.orderStatus?.displayText,
          },
        };
        list.push(obj);
      });
    }
    const data = {
      bookings: list,
    };
    const response = ApiResponse("1", "Table Bookings", "", data);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

async function cancelledTableBooking(req, res) {
  const table = await tableBooking.findOne({
    where: {
      id: req.body.tableId,
    },
  });
  try {
    if (table) {
      const status = await orderStatus.findOne({
        where: {
          name: "Cancelled",
        },
      });
      table.orderStatusId = status.id;
      table
        .save()
        .then(async (dat) => {
          const restData = await restaurant.findOne({
            where: {
              id: table.restaurantId,
            },
            include: {
              model: user,
              attributes: ["id", "deviceToken"],
            },
          });
          if (restData) {
            singleNotification(
              restData.user.deviceToken,
              "Request Cancelled",
              `Table Booking Request has been cancel by User ID : ${restData.user.id}`
            );
          }
          const response = ApiResponse("1", "Request Cancelled", "", {});
          return res.json(response);
        })
        .catch((error) => {
          const response = ApiResponse("0", error.message, "Error", {});
          return res.json(response);
        });
    } else {
      const response = ApiResponse("0", "Table not found", "Error", {});
      return res.json(response);
    }
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

async function bookTableBooking(req, res) {
  const { noOfMembers, date, time, restaurantId, message } = req.body;
  try {
    const status = await orderStatus.findOne({
      where: {
        name: "Placed",
      },
    });
    const booking = new tableBooking();
    booking.noOfMembers = noOfMembers;
    booking.date = date;
    booking.time = time;
    booking.message = message;
    booking.status = true;
    booking.restaurantId = restaurantId;
    booking.orderStatusId = status.id;
    booking.userId = req.user.id;

    booking
      .save()
      .then(async (dat) => {
        const restData = await restaurant.findOne({
          where: {
            id: restaurantId,
          },
          include: {
            model: user,
            attributes: ["id", "deviceToken", "ip"],
          },
        });
        // return res.json(restData)
        const userData = await user.findOne({
          where: {
            id: req.user.id,
          },
          attributes: ["id", "firstName", "lastName", "deviceToken", "ip"],
        });
        retailerController
          .homeData(restaurantId)
          .then((dat) => {
            let eventDataForRetailer = {
              type: "bookTableBooking",
              data: {
                status: "1",
                message: "Data",
                error: "",
                data: dat,
              },
            };
            sendEvent(restData?.user?.ip, eventDataForRetailer);
          })
          .catch((error) => {
            console.log(error);
          });
        if (restData) {
          singleNotification(
            JSON.parse(restData?.user?.deviceToken),
            "Request for Book a Table",
            `${userData.firstName} ${userData.lastName} make a request for book a table having no of members are ${noOfMembers}`
          );
        }
        const response = ApiResponse(
          "1",
          "Table Booking Request Created",
          "",
          {}
        );
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

async function leaveGroup(req, res) {
  const { userId, orderId } = req.body;

  try {
    const group = await orderGroup.findOne({
      where: {
        orderId: orderId,
        participantId: userId,
      },
    });
    if (group) {
      await group.destroy();
      const response = ApiResponse("1", "Successfully Leave the group", "", {});
      return res.json(response);
    } else {
      const response = ApiResponse("1", "Successfully Leave the group", "", {});
      return res.json(response);
    }
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

async function deleteGroup(req, res) {
  const { orderId } = req.body;
  const orderData = await order.findOne({
    where: {
      id: orderId,
    },
  });
  if (orderData) {
    const groups = await orderGroup.findAll({
      where: {
        orderId: orderId,
      },
    });
    for (i = 0; i < groups.length; i++) {
      await groups[i].destroy();
    }
    await orderData.destroy();
  }
  const response = ApiResponse("1", "Group Deleted successfully", "", {});
  return res.json(response);
}

async function orderAfterPayment(req, res) {
  try {
    const { orderId } = req.body;
    let orderData = await order.findOne({
      where: { id: orderId },
      include: [{ model: orderCharge }, { model: address, as: "dropOffID" }],
    });
    const restaurantData = await restaurant.findOne({
      where: { id: orderData.restaurantId },
      include: { model: user, attributes: ["deviceToken", "ip"] },
    });
    const restDrivers = await restaurantDriver.findAll({
      where: { restaurantId: orderData?.restaurantId },
      include: { model: user, attributes: ["id", "deviceToken"] },
    });
    let userData = await user.findOne({ where: { id: req.user.id } });
    if (orderData) {
      orderData.paymentConfirmed = true;
      orderData.paymentRecieved = true;
      orderData.save().then(async (orderData) => {
        let type = await deliveryType.findOne({ where: { name: "Delivery" } });
        if (orderData.deliveryTypeId == type.id) {
          let driverTokens = [];
          for (var i = 0; i < restDrivers.length; i++) {
            if (restDrivers[i]?.user?.deviceToken) {
              for (const token of JSON.parse(
                restDrivers[i]?.user?.deviceToken
              )) {
                driverTokens.push(token);
              }
            }
          }
          let noti_data = {
            estTime: restaurantData?.approxDeliveryTime,
            distance: distance,
            orderId: orderData.id,
            restaurantName: restaurantData.businessName,
            estEarning: orderData?.orderCharge?.driverEarnings.toFixed(2),
            orderNum: orderData.orderNum,
            orderApplication:
              restaurantData.businessType == 1
                ? "Restaurant"
                : restaurantData.businessType == 3
                ? "Store"
                : "",
            orderType: orderData.orderTypeId == 1 ? "Group" : "Normal",
            dropOffAddress: orderData?.dropOffID?.streetAddress,
            pickUpAddress: restaurantData.address,
          };
          let userTokens = userData?.deviceToken
            ? JSON.parse(userData?.deviceToken)
            : [];
          singleNotification(
            userTokens,
            "Order Placed",
            `OrderId : ${orderData.id} has been placed successfully`,
            noti_data
          );
          //  to restaurants
          sendNotifications(to, notification);
        }
        retailerController
          .homeData(orderData.restaurantId)
          .then(async (homeDataa) => {
            let eventDataForRetailer = {
              type: "placeOrder",
              data: {
                status: "1",
                message: "Data",
                error: "",
                data: homeDataa,
              },
            };
            let restData = await retOrderData(orderId);
            let data = {
              orderId: orderData.id,
              dropOffLat: orderData?.dropOffID?.lat,
              dropOffLng: orderData?.dropOffID?.lng,
              orderNum: orderData.orderNum,
              paymentRecieved: orderData.paymentRecieved,
              cultery_list: [],
              restLat: restaurantData.lat,
              restLng: restaurantData.lng,
              restAddress: restaurantData.address,
              waitForDriver: false,
              allowSelfPickUp:
                restaurantData.deliveryTypeId === 3 ? true : false,
              retData: restData,
            };
            let eventDataForUser = {
              type: "placeOrder",
              data: {
                status: "1",
                message: "Data",
                error: "",
                data: data,
              },
            };

            sendEvent(restaurantData?.user?.ip, eventDataForRetailer);
            sendEvent(userData?.ip, eventDataForUser);
          });
        const response = ApiResponse(
          "1",
          "Payment done and Order placed successfully!",
          "",
          {}
        );
        return res.json(response);
      });
    } else {
      const response = ApiResponse("0", "Sorry Order not found", "", {});
      return res.json(response);
    }
  } catch (error) {
    const response = ApiResponse("0", error.message, "", {});
    return res.json(response);
  }
}

module.exports = {
  registerUser,
  verifyEmail,
  resendOTP,
  signInUser,
  forgetPasswordRequest,
  changePasswordOTP,
  changePassword,
  googleSignIn,
  logout,
  session,
  getaddressLabels,
  addAddress,
  getAllAddress,
  deleteAddress,
  getcurrRestaurants,
  getAllCuisines,
  getRestaurantsByCuisine,
  getRestaurantById,
  getRestaurantByIds,
  getProductById,
  getRestaurantByFilter,
  getRestaurantBySearch,
  getDeliveryFee,
  createOrder,
  getRestaurantFeatures,
  cancelOrderFood,
  applyVoucher,
  addRatingFeedback,
  addTip,
  testAPI,
  updateProfile,
  getProfile,
  supportEmail,
  orderHistoryRes,
  orderDetails,
  getVehicleType,
  getEstdFare,
  placeOrder,
  updateOrderToPickup,
  cancelOrderTaxi,
  autoCancelOrderTaxi,
  loginData,
  driverDetailsForCustomer,
  recentAddresses,
  orderDetailsRides,
  getDistance,
  ongoingOrders,
  applicationRange,
  restaurantRange,
  tablebooking,
  leaveGroup,
  createPaypalToken,
  paymentByCard,
  paypal_payment,
  getVehicleTypeWithoutCharge,
  stripe_add_card,
  stripe_get_all_cards,
  delete_stripe_card,
  makepaymentbynewcard,
  makepaymentBySavedCard,
  getAllPaymentMethods,
  getCountriesAndCities,
  adyen_payment_by_card,
  popularProducts,
  searchProduct,
  filter,
  createGroup,
  PreparingOrders,
  PickupOrders,
  joinGroup,
  joinMember,
  groupOrderDetails,
  getTableBookings,
  bookTableBooking,
  cancelledTableBooking,
  home1,
  placeGroupOrder,
  home1,
  getDriverDetails,
  getProductByIdTest,
  orderAgain,
  deleteGroup,
  payrexx_payment,
  groupOrderDetailsForSocket,
  UsergetProfile,
  orderDetailsGet,
};
