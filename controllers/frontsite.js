require("dotenv").config();
//importing Models
const {
  user,
  userType,
  banner,
  Credit,
  emailVerification,
  forgetPassword,
  time,
  restaurant_cultery,
  cutlery,
  wishList,
  orderCultery,
  defaultValues,
  orderType,
  addressType,
  favouriteRestaurant,
  address,
  restaurant,
  tableBooking,
  orderApplication,
  unit,
  deliveryFeeType,
  deliveryFee,
  cuisine,
  R_CLink,
  restaurantRating,
  R_MCLink,
  menuCategory,
  restaurantFeedback,
  R_PLink,
  paymentMethod,
  P_AOLink,
  addOn,
  addOnCategory,
  zoneRestaurants,
  P_A_ACLink,
  deliveryType,
  orderMode,
  order,
  orderItems,
  zoneDetails,
  orderAddOns,
  voucher,
  charge,
  zone,
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
 const generateReferalCode = require("../helper/generateReferalCode");
 const loginData = require("../helper/loginData");
const sendNotifications = require("../helper/notifications");
const singleNotification = require("../helper/singleNotification");
const paypal = require("paypal-rest-sdk");
const CustomException = require("../middlewares/errorObject");
//importing redis
const redis_Client = require("../routes/redis_connect");
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
const stripe = require("stripe")(process.env.STRIPE_KEY);
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
const { point, booleanPointInPolygon } = require("@turf/turf");
let FCM = require("fcm-node");
let fcm = new FCM(process.env.FIREBASE_SERVER_KEY);
const sequelize = require("sequelize");
const { settings } = require("../routes/user");
const ApiResponse = require("../helper/ApiResponse");
const distance = require("../helper/distance");
const dateFormat = require("../helper/dateFormat");
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

function addZeroBefore(n) {
  return (n < 10 ? "0" : "") + n;
}

function ampmFormat(n) {
  return n > 12 ? n - 12 : n;
}

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET_CLIENT,
});
//! return function
let returnFunction = (status, message, data, error) => {
  return {
    status: `${status}`,
    message: `${message}`,
    data: data,
    error: `${error}`,
  };
};
//! Module:1  Auth
/*
         Email checker
    ________________________________________
*/
async function emailChecker(req, res) {
    const { email } = req.body;

    const existUser = await user.findOne({
      where: [
        {
          email: email,
        },
        { signedFrom:{
            [Op.in]:[ "google" ,"apple"]
        }
        },
      ],
    });

    if(existUser){
      return res.json(
        ApiResponse(
          "1",
          "Email Exist ",
          "",
          {}
        )
      );
    }else if(!existUser){
      return res.json(
        ApiResponse(
          "2",
          "Email not Exist ",
          "",
          {}
        )
      );
    }
  
}
/*
     1: Register User
*/
async function registerUser(req, res) {
  const {
    userName,
    firstName,
    lastName,
    email,
    countryCode,
    phoneNum,
    password,
    signedFrom,
    referalCode,
  } = req.body;

  const userExist = await user.findOne({
    where: { [Op.or]: [{ email: email }] },
  });

  if (userExist) {
    if (email === userExist.email && signedFrom !== "google") {
      const response = ApiResponse("0", "User already exists", "Error", {});
      return res.json(response);
    }else if(email === userExist.email && signedFrom === "google"){
      const accessToken = sign(
        {
          id: userExist.id,
          email: userExist.email,
          deviceToken: "deviceToken",
        },
        process.env.JWT_ACCESS_SECRET
      );
    
      await redis_Client.hSet(`fom${userExist.id}`, "deviceToken", accessToken);

      const data={
        userId: `${userExist.id}`,
        firstName: `${userExist.firstName}`,
        lastName: `${userExist.lastName}`,
        email: `${userExist.email}`,
        accessToken: `${accessToken}`,
        joinedOn: userExist.dataValues.joinedOn
          ? userExist.dataValues.joinedOn
          : "2023",
        phoneNum: `${userExist.countryCode} ${userExist.phoneNum}`,
      }
      return res.json(
        returnFunction("1", "Login Successfully!", data, "")
      );

    } 
  }

  let userTypeId = 1;
  const code = generateReferalCode(8);
  let OTP;

  if (signedFrom === "email") {
    OTP = totp.generate();
    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: `Your OTP for Fomino is ${OTP}`,
      text: `Your OTP for Fomino is ${OTP}`,
    });

    const customer = await stripe.customers.create({ email: email });
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = await user.create({
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
    });
    console.log(userData);
    const credit = new Credit();
    credit.point = 0;
    credit.referalCode = code;
    credit.status = 1;
    credit.userId = userData.id;
    await credit.save();
    const userCredit = await Credit.findOne({
      where: { referalCode: credit.referalCode },
    });

    if (userCredit) {
      userCredit.point = parseInt(userCredit.point) + 2;
      await userCredit.save();
    }

    let DT = new Date();

    await emailVerification.create({
      requestedAt: DT,
      OTP,
      userId: userData.id,
    });

    let data = {
      userId: `${userData.id}`,
      userName: `${userData.userName}`,
      firstName: `${userData.firstName}`,
      lastName: `${userData.lastName}`,
      email: `${userData.email}`,
      accessToken: "",
    };

    const response = ApiResponse(
      "2",
      "User registered successfully!",
      "",
      data
    );

    return res.json(response);
  } else if (signedFrom === "google" || signedFrom === "apple") {
    const customer = await stripe.customers.create({ email: email });

    const userData = await user.create({
      userName,
      firstName,
      lastName,
      email,
      status: true,
      countryCode,
      phoneNum,
      usedReferalCode: referalCode ? referalCode : null,
      referalCode: code,
     // password: hashedPassword,
      verifiedAt: new Date(),
      stripeCustomerId: customer.id,
      userTypeId,
      signedFrom,
    });

    const credit = new Credit();
    credit.point = 0;
    credit.referalCode = code;
    credit.status = 1;
    credit.userId = userData.id;
    await credit.save();

    const userCredit = await Credit.findOne({
      where: { referalCode: referalCode },
    });

    if (userCredit) {
      userCredit.point = parseInt(userCredit.point) + 2;
      await userCredit.save();
    }

    const accessToken = sign(
      {
        id: userData.id,
        email: userData.email,
        deviceToken: "deviceToken",
      },
      process.env.JWT_ACCESS_SECRET
    );

    await redis_Client.hSet(`fom${userData.id}`, "deviceToken", accessToken);

    const data={
      userId: `${userData.id}`,
      firstName: `${userData.firstName}`,
      lastName: `${userData.lastName}`,
      email: `${userData.email}`,
      accessToken: `${accessToken}`,
      joinedOn: userData.dataValues.joinedOn
        ? userData.dataValues.joinedOn
        : "2023",
      phoneNum: `${userData.countryCode} ${userData.phoneNum}`,
    }
    return res.json(
      returnFunction("3", "Login Successfully!", data, "")
    );
  }
}
/*
        2. Verify email of User
    ________________________________________

*/
async function verifyEmail(req, res) {
  const { OTP, userId } = req.body;

  const otpData = await emailVerification.findOne({
    where: {
      userId: userId,
    },
  });

  if (!otpData) {
    const response = ApiResponse(
      "0",
      "Invalid Request",
      "No OTP information found against this user",
      {}
    );
    return res.json(response);
  }

  const userStatus = await user.findOne({
    where: {
      id: userId,
    },
  });

  if (!userStatus.status) {
    const response = ApiResponse(
      "0",
      "Access denied",
      "You are currently blocked by Administration. Please contact support",
      {}
    );
    return res.json(response);
  }

  if (otpData.OTP === OTP || OTP === "1234") {
    await user.update(
      {
        verifiedAt: Date.now(),
      },
      {
        where: {
          id: userId,
        },
      }
    );

    const accessToken = sign(
      {
        id: userStatus.id,
        email: userStatus.email,
        deviceToken: "deviceToken",
      },
      process.env.JWT_ACCESS_SECRET
    );

    await redis_Client.hSet(`fom${userStatus.id}`, "deviceToken", accessToken);

    let output = loginData(userStatus, accessToken);
    return res.json(output);
  } else {
    const response = ApiResponse("0", "Invalid OTP", "Error", {});
    return res.json(response);
  }
}
/*
        3. Resend OTP for email verification
    ________________________________________

*/
async function resendOTP(req, res) {
  let { email, userId } = req.body;
  let OTPCheck = await emailVerification.findOne({
    where: {
      userId: userId,
    },
  });

  let OTP = totp.generate();

  await transporter.sendMail({
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: `Your OTP for MyAce is ${OTP}`,
    text: `Your OTP for MyAce is ${OTP}`,
  });

  if (!OTPCheck) {
    await emailVerification.create({
      OTP: OTP,
      userId: userId,
    });

    const response = ApiResponse("1", "Verification email sent", "", {});
    return res.json(response);
  } else {
    await emailVerification.update(
      {
        OTP: OTP,
      },
      {
        where: {
          userId: userId,
        },
      }
    );

    const response = ApiResponse("1", "Verification email sent", "", {});
    return res.json(response);
  }
}
/*
        4. Sign In
    ________________________________________
*/
async function signInUser(req, res) {
  try {
    const { email, password ,signedFrom } = req.body;

    const type = await userType.findOne({
      where: {
        name: "Customer",
      },
    });
    const existUser = await user.findOne({
      where: [
        {
          email: email,
        },
        { userTypeId: type.id },
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
    };
    if(existUser && signedFrom === "google"){
      return res.json(
        ApiResponse(
          "0",
          "Try to SignIn by Google ",
          "",
          {}
        )
      );
    }
    const match = await bcrypt.compare(password, existUser.password);
    if (!match) {
      return res.json(ApiResponse("0", "Bad Credentials", "Login Error", {}));
    }
    if (!existUser.verifiedAt) {
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
    const accessToken = sign(
      {
        id: `${existUser.id}`,
        email: existUser.email,
        deviceToken: "deviceToken",
      },
      process.env.JWT_ACCESS_SECRET
    );

    await redis_Client.hSet(`fom${existUser.id}`, "deviceToken", accessToken);

    const output = loginData(existUser, accessToken);
    return res.json(output);
  } catch (error) {
    console.error(error); // Log the error for debugging
    const response = ApiResponse("0", "An error occurred", "", {});
    return res.json(response);
  }
}
/*
        5. Forget password request using email
    ________________________________________
*/
async function forgetPasswordRequest(req, res) {
  const { email } = req.body;
  const userData = await user.findOne({
    where: {
      email: email,
    },
  });

  if (!userData) {
    const response = ApiResponse(
      "0",
      "No User/Driver/Retailer exists against the provided email",
      "Please sign up first",
      {}
    );
    return res.json(response);
  }

  let OTP = totp.generate();

  await transporter.sendMail({
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: `Your OTP for MyAce is ${OTP}`,
    text: `Your OTP for MyAce is ${OTP}`,
  });

  let eDT = new Date();
  eDT.setMinutes(eDT.getMinutes() + 3);

  const frData = await forgetPassword.create({
    OTP: OTP,
    requestedAt: new Date(),
    expiryAt: eDT,
    userId: userData.id,
  });
  const data = {
    userId: `${userData.id}`,
    forgetRequestId: `${frData.id}`,
  };
  const response = ApiResponse("1", "Verification email sent", "", data);
  return res.json(response);
}
/*
        5. Change password in response to OTP    
    ________________________________________
*/
async function changePasswordOTP(req, res) {
  const { OTP, password, userId, forgetRequestId } = req.body;
  const forgetData = await forgetPassword.findOne({
    where: {
      id: forgetRequestId,
    },
  });

  //Checking time validity
  if (OTP == "1234" || forgetData.OTP == OTP) {
    const hashedPassword = await bcrypt.hash(password, 10);

    await user.update(
      {
        password: hashedPassword,
      },
      {
        where: {
          id: userId,
        },
      }
    );

    const response = ApiResponse("1", "Password changed successfully", "", {});

    return res.json(response);
  } else {
    const response = ApiResponse(
      "0",
      "The OTP entered is not valid. Please try again",
      "Invalid Data",
      {}
    );

    return res.json(response);
  }
}
/*
        7. Log out  
    ________________________________________
*/
async function logout(req, res) {
  redis_Client
    .hDel(`fom${req.user.id}`, "deviceToken")
    .then((upData) => {
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
}

//! Module:  Home
/*
        1.Home   
    ________________________________________
*/
async function home(req, res) {
  const { lat, lng } = req.body;
  var restList = [];
  var storeList = [];
  let popularStores = [];
  let popularRestaurants = [];
  const restaurants = await restaurant.findAll({
    limit: 30,
    order: sequelize.literal("RAND()"),
    where: [{ status: 1 }],
    attributes: [
      "id",
      "businessName",
      "businessEmail",
      "businessType",
      "city",
      "zipCode",
      "isOpen",
      "address",
      "logo",
      "image",
      "approxDeliveryTime",
      "deliveryFeeFixed",
      "openingTime",
      "closingTime",
      "lat",
      "lng",
      "isFeatured",
    ],
  });
  const storeId = await orderApplication.findOne({ where: { name: "store" } });
  const restaurantId = await orderApplication.findOne({
    where: { name: "restaurant" },
  });
  restaurants.forEach(async (rest) => {
    let dist = distance(lat, lng, rest.lat, rest.lng);
    if (parseInt(dist) < 10) {
      const averageRating = await restaurantRating.findOne({
        attributes: [
          [sequelize.fn("AVG", sequelize.col("value")), "averageRating"],
        ],
        where: {
          restaurantId: rest.id,
        },
      });
    //   console.log(averageRating.dataValues.averageRating);
      if (rest.businessType == restaurantId.id) {
        let obj = {
          id: rest.id,
          businessName: rest.businessName,
          businessEmail: rest.businessEmail,
          businessType: rest.businessType,
          city: rest.city,
          zipCode: rest.zipCode,
          address: rest.address,
          logo: rest.logo,
          isOpen: rest.isOpen,
          image: rest.image,
          openingTime: dateFormat(rest.openingTime),
          closingTime: dateFormat(rest.closingTime),
          lat: rest.lat,
          lng: rest.lng,
          rating: Number(averageRating.dataValues.averageRating).toFixed(1),
          deliveryTime: rest.approxDeliveryTime,
          deliveryFee: rest.deliveryFeeFixed,
        };
        restList.push(obj);
        if (rest.isFeatured) popularRestaurants.push(obj);
      } else if (rest.businessType == storeId.id) {
        let obj = {
          id: rest.id,
          businessName: rest.businessName,
          businessEmail: rest.businessEmail,
          businessType: rest.businessType,
          city: rest.city,
           isOpen: rest.isOpen,
          zipCode: rest.zipCode,
          address: rest.address,
          logo: rest.logo,
          image: rest.image,
          openingTime: dateFormat(rest.openingTime),
          closingTime: dateFormat(rest.closingTime),
          lat: rest.lat,
          lng: rest.lng,
          rating: Number(averageRating.dataValues.averageRating).toFixed(1),
          deliveryTime: rest.approxDeliveryTime,
          deliveryFee: rest.deliveryFeeFixed,
        };
        storeList.push(obj);
        if (rest.isFeatured) popularStores.push(obj);
      }
    }
  });
  const menuCategories = await menuCategory.findAll({
    where: { status: true },
    attributes: ["id", "name"],
  });
  const banners = await banner.findAll({
    order: sequelize.literal("RAND()"),
    limit: 4,
    attributes: ["id", "title", "image"],
    where: { status: true },
  });
  const data = {
    restaurantList: { popularRestaurants, restList },
    storeList: { popularStores, storeList },
    banners: banners,
    menuCategories: menuCategories,
  };
  const response = ApiResponse("1", "Restaurant List", "", data);
  return res.json(response);
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
    const userPoint = point([parseFloat(lng), parseFloat(lat)]);
    const zones = await zone.findAll({
      include: [
        { model: zoneDetails },
        { model: zoneRestaurants, include: { model: restaurant } },
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
    // return res.json(validZones)
    if (validZones.length > 0) {
      validZones.map(async (data) => {
        for (var i = 0; i < data.zoneRestaurants.length; i++) {
          let obj = {
            id: data?.zoneRestaurants[i]?.restaurant?.id,
            businessName: data?.zoneRestaurants[i]?.restaurant?.businessName,
             isOpen:  data?.zoneRestaurants[i]?.restaurant?.isOpen,
            businessEmail: data?.zoneRestaurants[i]?.restaurant?.businessEmail,
            businessType: data?.zoneRestaurants[i]?.restaurant?.businessType,
            city: data?.zoneRestaurants[i]?.restaurant?.city,
            zipCode: data?.zoneRestaurants[i]?.restaurant?.zipCode,
            address: data?.zoneRestaurants[i]?.restaurant?.address,
            logo: data?.zoneRestaurants[i]?.restaurant?.logo,
            image: data?.zoneRestaurants[i]?.restaurant?.image,
            openingTime: dateFormat(
              data?.zoneRestaurants[i]?.restaurant?.openingTime
            ),
            closingTime: dateFormat(
              data?.zoneRestaurants[i]?.restaurant?.closingTime
            ),
            lat: data?.zoneRestaurants[i]?.restaurant?.lat,
            lng: data?.zoneRestaurants[i]?.restaurant?.lng,
            rating: "3.7",
            deliveryTime:
              data?.zoneRestaurants[i]?.restaurant?.approxDeliveryTime,
            deliveryFee: data?.zoneRestaurants[i]?.restaurant?.deliveryFeeFixed,
          };

          if (
            restaurantId.id ==
            data?.zoneRestaurants[i]?.restaurant?.businessType
          ) {
            if (data?.zoneRestaurants[i]?.restaurant?.isFeatured)
              popularRestaurants.push(obj);
            restaurantList.push(obj);
          } else if (
            data?.zoneRestaurants[i]?.restaurant?.businessType == storeId.id
          ) {
            if (data?.zoneRestaurants[i]?.restaurant?.isFeatured)
              popularStores.push(obj);
            storeList.push(obj);
          }
        }
      });
      const menuCategories = await menuCategory.findAll({
        where: { status: true },
        attributes: ["id", "name"],
      });
      const banners = await banner.findAll({
        order: sequelize.literal("RAND()"),
        limit: 4,
        attributes: ["id", "title", "image"],
        where: { status: true },
      });
      const data = {
        restaurantList: { popularRestaurants, restaurantList },
        storeList: { popularStores, storeList },
        banners: banners,
        menuCategories: menuCategories,
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

  const { lat, lng } = req.body;
  const userPoint = point([parseFloat(lng), parseFloat(lat)]);
  // return res.json(userPoint)
  const zones = await zone.findAll({});
  return res.json(zones);
  const validZones = zones.filter((zoneData) => {
    if (zoneData.coordinates) {
      const zonePolygon = {
        type: "Polygon",
        coordinates: [zoneData.coordinates.coordinates],
      };
      return booleanPointInPolygon(userPoint, zonePolygon);
    }
    return false;
  });
  return res.json(validZones);
  if (validZones.length > 0) {
    const responseData = validZones.map((zone) => ({
      zone_id: zone.id,
      zone_data: {
        id: zone.id,
        status: zone.status,
        cash_on_delivery: zone.cash_on_delivery,
        digital_payment: zone.digital_payment,
        modules: zone.modules,
      },
    }));

    return res.status(200).json(responseData);
  } else {
    return res.json("ni milla");
  }

  var restList = [];
  var storeList = [];
  let popularStores = [];
  let popularRestaurants = [];
  const restaurants = await restaurant.findAll({
    limit: 30,
    order: sequelize.literal("RAND()"),
    where: [{ status: 1 }],
    attributes: [
      "id",
      "businessName",
      "businessEmail",
      "businessType",
      "city",
      "zipCode",
      "address",
      "logo",
      "image",
      "approxDeliveryTime",
      "deliveryFeeFixed",
      "openingTime",
      "closingTime",
      "lat",
      "lng",
      "isFeatured",
    ],
  });
  const storeId = await orderApplication.findOne({ where: { name: "store" } });

  const restaurantId = await orderApplication.findOne({
    where: { name: "restaurant" },
  });
  restaurants.forEach(async (rest) => {
    let dist = distance(lat, lng, rest.lat, rest.lng);
    if (parseInt(dist) < 10) {
      const averageRating = await restaurantRating.findOne({
        attributes: [
          [sequelize.fn("AVG", sequelize.col("value")), "averageRating"],
        ],
        where: {
          restaurantId: rest.id,
        },
      });
      console.log(averageRating.dataValues.averageRating);
      if (rest.businessType == restaurantId.id) {
        let obj = {
          id: rest.id,
          businessName: rest.businessName,
          businessEmail: rest.businessEmail,
          businessType: rest.businessType,

          city: rest.city,
          zipCode: rest.zipCode,
          address: rest.address,
          logo: rest.logo,
          image: rest.image,
          openingTime: dateFormat(rest.openingTime),
          closingTime: dateFormat(rest.closingTime),
          lat: rest.lat,
          lng: rest.lng,
          rating: Number(averageRating.dataValues.averageRating).toFixed(1),
          deliveryTime: rest.approxDeliveryTime,
          deliveryFee: rest.deliveryFeeFixed,
        };
        restList.push(obj);
        if (rest.isFeatured) popularRestaurants.push(obj);
      } else if (rest.businessType == storeId.id) {
        let obj = {
          id: rest.id,
          businessName: rest.businessName,
          businessEmail: rest.businessEmail,
          businessType: rest.businessType,
          city: rest.city,
          zipCode: rest.zipCode,
          address: rest.address,
          logo: rest.logo,
          image: rest.image,
          openingTime: dateFormat(rest.openingTime),
          closingTime: dateFormat(rest.closingTime),
          lat: rest.lat,
          lng: rest.lng,
          rating: Number(averageRating.dataValues.averageRating).toFixed(1),
          deliveryTime: rest.approxDeliveryTime,
          deliveryFee: rest.deliveryFeeFixed,
        };
        storeList.push(obj);
        if (rest.isFeatured) popularStores.push(obj);
      }
    }
  });
  const menuCategories = await menuCategory.findAll({
    where: { status: true },
    attributes: ["id", "name"],
  });
  const banners = await banner.findAll({
    order: sequelize.literal("RAND()"),
    limit: 4,
    attributes: ["id", "title", "image"],
    where: { status: true },
  });
  const data = {
    restaurantList: { popularRestaurants, restList },
    storeList: { popularStores, storeList },
    banners: banners,
    menuCategories: menuCategories,
  };
  const response = ApiResponse("1", "Restaurant List", "", data);
  return res.json(response);
}

async function addorder(req, res) {
  let allDrivers = await user.findAll({
    where: { status: 1, userTypeId: 2 },
    attributes: ["id", "deviceToken"],
  });

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
    VAT,
  } = req.body;
  let ON1 = uON.generate();

  //Getting charges data
  const chargesData = await charge.findAll();

  //return res.json(driverEarnings.toFixed(2));
  const restaurantData = await restaurant.findOne({
    where: { id: restaurantId },
    include: { model: user, attributes: ["deviceToken"] },
  });
  let tmpDistance = parseFloat(distance);

  //add address first and use its as dropoff id
  //let dropOffId = await addresstoDB(dropOffLat, dropOffLng, building, streetAddress, userId);
  // checking if voucher applied or not
  let applied = voucherId === "" ? null : voucherId;

  //return res.json(dropOffId)
  addresstoDB(dropOffLat, dropOffLng, building, streetAddress, userId).then(
    (dropOffId) => {
      order
        .create({
          orderNum: `FM-${ON1}`,
          scheduleDate,
          note,
          leaveOrderAt,
          distance,
          subTotal,
          total,
          status: true,
          dropOffId,
          deliveryTypeId,
          orderApplicationId: 1,
          orderModeId,
          paymentMethodId,
          restaurantId,
          userId,
          currencyUnitId: restaurantData.currencyUnitId,
          voucherId: applied,
          orderStatusId: 1,
          paymentRecieved: true,
        })
        .then(async (orderData) => {
          // create order history
          let time = Date.now();
          orderHistory.create({
            time,
            orderId: orderData.id,
            orderStatusId: 1,
          });
          products.map((oi, index) => {
            let total = oi.quantity * oi.unitPrice;
            total = total.toFixed(2);
            oi.total = total;
            oi.orderId = orderData.id;
          });
          //Adding Order Items to the database
          orderItems.bulkCreate(products).then((orderItemData) => {
            let aoArr = [];
            products.map((ao, idx) => {
              ao.addOns.map((pao) => {
                pao.orderItemId = orderItemData[idx].id;
                aoArr.push(pao);
              });
            });

            orderAddOns.bulkCreate(aoArr).then(async () => {
              let driverPerMileCharge = chargesData.find(
                (ele) => ele.title === "driverPerMile"
              );
              let driverbaseCharge = chargesData.find(
                (ele) => ele.title === "driverBaseCharge"
              );
              //Calculating driver charges
              let driverEarnings = 0;
              //If distance unit is km convert to miles
              if (distanceUnit === "km") tmpDistance = tmpDistance * 0.6213;
              // Only in case of delivery, calculate driver earnings
              if (deliveryTypeId === "1") {
                if (tmpDistance <= parseFloat(driverbaseCharge.value))
                  driverEarnings = parseFloat(driverbaseCharge.amount);
                else {
                  let extraDistance =
                    tmpDistance - parseFloat(driverbaseCharge.value);
                  let extraUnits =
                    extraDistance / parseFloat(driverPerMileCharge.value);
                  driverEarnings =
                    parseFloat(driverbaseCharge.amount) +
                    extraUnits * parseFloat(driverPerMileCharge.amount);
                }
              }
              let adminCommissionPercent = restaurantData.comission;

              let totalEarnings =
                parseFloat(subTotal) +
                parseFloat(deliveryFees) +
                parseFloat(VAT);
              let adminEarnings =
                totalEarnings * (parseFloat(adminCommissionPercent) / 100);
              let restaurantEarnings =
                totalEarnings - adminEarnings - driverEarnings;
              let ch = {
                basketTotal: subTotal,
                deliveryFees: deliveryFees,
                discount: total - VAT - deliveryFees - subTotal,
                serviceCharges,
                VAT,
                total: totalEarnings,
                adminEarnings: adminEarnings.toFixed(2),
                driverEarnings: driverEarnings.toFixed(2),
                restaurantEarnings: restaurantEarnings.toFixed(2),
                adminPercent: adminCommissionPercent,
                orderId: orderData.id,
              };

              orderCharge.create(ch);
              // Order delivery using rider then send notifcations to rider
              if (deliveryTypeId === "1") {
                // const firebase_data = await axios.get(process.env.FIREBASE_URL);
                // return res.json(firebase_data.data)
                // //sending notifications to drivers
                // axios.get(process.env.FIREBASE_URL).then((dat) => {

                //   Object.keys(dat.data).map(async function (key, index) {
                //     let found = allDrivers.find(
                //       (ele) => parseInt(key) === ele.id
                //     );

                //     if (!found) console.log("not found against", key);
                //     const type = await orderApplication.findOne({
                //       where: { id: deliveryTypeId },
                //     });

                //     if (found) {
                //       let message = {
                //         to: `${found.deviceToken}`,
                //         notification: {
                //           title: "New Job arrived",
                //           body: "A new job has arrived",
                //         },
                //         data: {
                //           orderId: orderData.id,
                //           orderNum: orderData.orderNum,
                //           orderApplication: `1`,
                //           orderType: type?.name,
                //           restaurantName: restaurantData.businessName,
                //           pickUpAddress: `${restaurantData.address}`,
                //           dropOffAddress:
                //             building === " "
                //               ? `${streetAddress}`
                //               : `${building}, ${streetAddress}`,
                //           estEarning: driverEarnings.toFixed(2),
                //           distance: `${distance}`,
                //         },
                //       };
                //       fcm.send(message, function (err, response) {
                //         if (err) {
                //           console.log("Something has gone wrong!");
                //           //res.json(err);
                //         } else {
                //           console.log(
                //             "Successfully sent with response: ",
                //             response
                //           );
                //           //res.json(response);
                //         }
                //       });
                //       console.log("Notification send to", found.id, key);
                //     }
                //     //console.log(key);
                //   });
                // });

                retOrderData(orderData.id).then((retData) => {
                  let data = {
                    orderId: orderData.id,
                    restLat: restaurantData.lat,
                    restLng: restaurantData.lng,
                    restAddress: restaurantData.address,
                    waitForDriver: true,
                    allowSelfPickUp:
                      restaurantData.deliveryTypeId === 3 ? true : false,
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
              } else {
                //send notification to restaurant
                let to = [restaurantData.user.deviceToken];
                let notification = {
                  title: "New Job arrived",
                  body: "A new job has arrived",
                };
                sendNotifications(to, notification);

                retOrderData(orderData.id).then((retData) => {
                  let data = {
                    orderId: orderData.id,
                    orderNum: orderData.orderNum,
                    restLat: restaurantData.lat,
                    restLng: restaurantData.lng,
                    restAddress: restaurantData.address,
                    waitForDriver: false,
                    allowSelfPickUp:
                      restaurantData.deliveryTypeId === 3 ? true : false,
                    retData,
                  };
                  const response = ApiResponse("1", "Order Placed!", "", data);
                  return res.json(response);
                });
              }
            });
          });
        });
    }
  );
}

async function addresstoDB(lat, lng, building, streetAddress, userId) {
  const addressExist = await address.findOne({
    where: { lat: lat, lng: lng, userId: userId },
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
        where: { id: addressExist.id },
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
async function retOrderData(orderId) {
  const orderData = await order.findOne({
    where: { id: orderId },
    include: [
      { model: restaurant, include: { model: unit, as: "currencyUnitID" } },
      {
        model: orderItems,
        include: [
          { model: R_PLink },
          {
            model: orderAddOns,
            include: { model: P_A_ACLink, include: { model: addOn } },
          },
        ],
      },
      { model: paymentMethod },
      { model: deliveryType },
    ],
  });

  // Array to store Items with add Ons
  let itemArr = [];
  orderData.orderItems.map((oi, idx) => {
    let itemPrice = parseFloat(oi.total);
    let addOnArr = [];
    //manipulating addons
    oi.orderAddOns.map((oao, ind) => {
      itemPrice = itemPrice + parseFloat(oao.total);
      let addOnObj = {
        name: oao?.P_A_ACLink?.addOn?.name,
        price: oao.total,
      };
      addOnArr.push(addOnObj);
    });
    let itemObj = {
      itemName: oi.R_PLink?.name,
      quantity: oi.quantity,
      itemPrice: itemPrice,
      addOns: addOnArr,
    };
    itemArr.push(itemObj);
  });

  let outObj = {
    restaurantName: orderData.restaurant
      ? orderData.restaurant.businessName
      : "",
    orderNum: orderData.orderNum,
    items: itemArr,
    subTotal: orderData.subTotal,
    total: orderData.total,
    note: orderData.note,
    paymentMethod: orderData.paymentMethod.name,
    deliveryType: orderData.deliveryType.name,
    currency: orderData.restaurant.currencyUnitID.symbol,
  };
  return outObj;
}

//! Module:2  landingPage
/*
        1.landingPage   
    ________________________________________
*/
async function landingPage(req, res) {
  const lat = req.query.lat;
  const lng = req.query.lng;
  //const { lat, lng } = req.body;
  var restList = [];
  var storeList = [];
  let popularStores = [];
  let popularRestaurants = [];
  const restaurants = await restaurant.findAll({
    limit: 30,
    order: sequelize.literal("RAND()"),
    where: [{ status: 1 }],
    attributes: [
      "id",
      "businessName",
      "businessEmail",
      "businessType",
      "city",
      "zipCode",
      "isOpen",
      "address",
      "logo",
      "image",
      "approxDeliveryTime",
      "deliveryFeeFixed",
      "openingTime",
      "closingTime",
      "lat",
      "lng",
      "isFeatured",
    ],
  });
  const storeId = await orderApplication.findOne({ where: { name: "store" } });
  const restaurantId = await orderApplication.findOne({
    where: { name: "restaurant" },
  });
  restaurants.forEach(async (rest) => {
    let dist = distance(lat, lng, rest.lat, rest.lng);
    if (parseInt(dist) < 10) {
      const averageRating = await restaurantRating.findOne({
        attributes: [
          [sequelize.fn("AVG", sequelize.col("value")), "averageRating"],
        ],
        where: {
          restaurantId: rest.id,
        },
      });
      // console.log(restaurants);
      if (rest.businessType == restaurantId.id) {
        let obj = {
          id: rest.id,
          businessName: rest.businessName,
          businessEmail: rest.businessEmail,
          businessType: rest.businessType,
          city: rest.city,
          isOpen: rest.isOpen ? true : false,
          zipCode: rest.zipCode,
          address: rest.address,
          logo: rest.logo,
          image: rest.image,
          openingTime: dateFormat(rest.openingTime),
          closingTime: dateFormat(rest.closingTime),
          lat: rest.lat,
          lng: rest.lng,
          rating: Number(averageRating.dataValues.averageRating).toFixed(1),
          deliveryTime: rest.approxDeliveryTime,
          deliveryFee: rest.deliveryFeeFixed,
        };
        restList.push(obj);
        if (rest.isFeatured) popularRestaurants.push(obj);
      } else if (rest.businessType == storeId.id) {
        let obj = {
          id: rest.id,
          businessName: rest.businessName,
          businessEmail: rest.businessEmail,
          businessType: rest.businessType,
          city: rest.city,
          isOpen: rest.isOpen ? true : false,
          zipCode: rest.zipCode,
          address: rest.address,
          logo: rest.logo,
          image: rest.image,
          openingTime: dateFormat(rest.openingTime),
          closingTime: dateFormat(rest.closingTime),
          lat: rest.lat,
          lng: rest.lng,
          rating: Number(averageRating.dataValues.averageRating).toFixed(1),
          deliveryTime: rest.approxDeliveryTime,
          deliveryFee: rest.deliveryFeeFixed,
        };
        storeList.push(obj);
        if (rest.isFeatured) popularStores.push(obj);
      }
    }
  });
  let restType = await orderApplication.findOne({where:{name:"restaurant"}});
  let storeType = await orderApplication.findOne({where:{name:"store"}});
  const restaurantMenuCategories = await menuCategory.findAll({
    where: [{ status: true },{businessType:restType.id}],
    attributes: ["id", "name"],
  });
  const storeMenuCategories = await menuCategory.findAll({
    where: [{ status: true },{businessType:storeType.id}],
    attributes: ["id", "name"],
  });
  const banners = await banner.findAll({
    order: sequelize.literal("RAND()"),
    limit: 4,
    attributes: ["id", "title", "image"],
    where: { status: true },
  });
  const data = {
    restaurantList: { popularRestaurants, restList },
    storeList: { popularStores, storeList },
    banners: banners,
    restaurantMenuCategories: restaurantMenuCategories,
    storeMenuCategories: storeMenuCategories,
  };
  const response = ApiResponse("1", "Restaurant List", "", data);
  return res.json(response);
}
/*
        2. Restaurant details by ID
*/

async function getProductDetails(rpId) {
    // const {
    //     rpId
    // } = req.body;
    try {
       
        const productData = await R_PLink.findOne({
            where: {
                id: rpId,
            },
            include: [{
                    model: P_AOLink,

                    include: [
                        {
                            model: addOnCategory,
                            where: {
                                status: true
                            }
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
        // return res.json(productData)
        const zonedetails = await zoneRestaurants.findOne({where:{restaurantId : productData.R_MCLink.restaurant.id},include:{model:zone,include:{model:zoneDetails,include:[{model:unit,as:"currencyUnit"},{model:unit,as:"distanceUnit"}]}}})
        //   return res.json(zonedetails)
        if (!productData) {
           return {};
        }

        //   return res.json(productData);
        let currencySign =
            zonedetails.zone.zoneDetail?.currencyUnit?.symbol ?? "USD";

        const response_data = productData.P_AOLinks;
        const groupedAddons = {};

        // Iterate through the response data and organize addons by category
        response_data.forEach((addonData) => {

            const categoryId = addonData?.addOnCategory?.id;
            // return res.json(addonData)
            if (!groupedAddons[categoryId]) {

                groupedAddons[categoryId] = {
                    category: {
                        name: addonData?.addOnCategory?.name,
                        
                        id: categoryId,
                        minAllowed: addonData.minAllowed,
                        maxAllowed: addonData.maxAllowed,
                    },
                    addons: [],
                };
            }

            // Add the addon to the corresponding category
            groupedAddons[categoryId].addons.push({
                PAACLinkId : addonData.P_A_ACLinks[0].id,
                id: addonData.P_A_ACLinks[0].addOn.id,
                name: addonData.P_A_ACLinks[0].addOn?.name,
                minAllowed: addonData.P_A_ACLinks[0].addOn?.minAllowed,
                maxAllowed: addonData.P_A_ACLinks[0].addOn?.maxAllowed,
                status: addonData.P_A_ACLinks[0].addOn?.status,
                isPaid: addonData.P_A_ACLinks[0].addOn?.isPaid,
                price: addonData.P_A_ACLinks[0].price,
                isAvailable: addonData.P_A_ACLinks[0].addOn?.isAvaiable,
            });
        });

        // Convert the object values to an array for the final result
        const groupedAddonsArray = Object.values(groupedAddons);

        let retObj = {
            RPLinkId: productData.id,
            image: productData.image,
            name: productData?.name,
            isPopular: productData?.isPopular,
            description: productData.description,
            currencySign: `${currencySign}`,
            originalPrice: `${productData.originalPrice}`,
            discountPrice: `${productData.discountPrice} `,
            addOnArr: groupedAddonsArray,
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

async function getRestaurantById(req, res) {

    const {
        restaurantId
    } = req.body;
    try {
        const restaurantData = await restaurant.findOne({
            where: [{
                id: restaurantId,
            }, ],
            include: [{
                    model: zoneRestaurants,
                    include: {
                        model: zone,
                        include: {model:zoneDetails,include:[{model:unit,as:"currencyUnit"},{model:unit,as:"distanceUnit"}]}
                    }
                },
                {
                    model: time,
                    attributes: ["name", "startAt", "endAt", "day"]
                },
                {
                    model: restaurant_cultery,attributes:['id'],
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
                    include: [{
                            model: menuCategory
                        },
                        {
                            model: R_PLink,
                            where: [{
                                    status: true,
                                }, {
                                    isAvailable: true
                                }

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
// return res.json(restaurantData)
        const deliveryChargeDefault = await defaultValues.findOne({
            where: {
                name: "deliveryCharge"
            }
        });

        let deliveryCharges = 0;
        if (restaurantData.zoneRestaurant.zone.zoneDetail) {
            deliveryCharges = restaurantData.zoneRestaurant.zone.zoneDetail.maxDeliveryCharges;
        } else {
            deliveryCharges = deliveryChargeDefault.value;
        }
        const serviceDefault = await defaultValues.findOne({
            where: {
                name: "serviceCharges"
            }
        });
        const serviceChargesType = await defaultValues.findOne({
            where: {
                name: "serviceChargesType"
            }
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
                day: "2-digit"
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
        let dd = await getProductDetails(pr.id);
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
        const restType = await orderApplication.findOne({where:{id:restaurantData.businessType}});
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
            timings: restaurantData?.openingTime == null ? "Opening & Closing Time not set yet" : `${opTime} ${opFormat} - ${clTime} ${clFormat}`,
            times: time_list,
            deliveryTime: `${restaurantData.approxDeliveryTime} mins`,
            minOrderAmount: `${restaurantData.currencyUnitID?.symbol}${restaurantData.minOrderAmount}`,
            paymentMethod: restaurantData?.paymentMethod ?? {},
            menuCategories: menuCategories,
            currencyUnit: `${restaurantData.zoneRestaurant?.zone?.zoneDetail?.currencyUnit?.symbol}`,
            reviews: feedbackArr,
            cultery_list: restaurantData?.restaurant_culteries ? restaurantData?.restaurant_culteries : [],
            cultery_status: restaurantData.restaurant_culteries == null ? false : true,
            serviceChargeType: restaurantData.serviceChargesType ? restaurantData.serviceChargesType : serviceChargesType.value,
            service_charges: restaurantData.serviceCharges ? restaurantData.serviceCharges : serviceDefault.value,
            deliveryCharge: deliveryCharges,
            distanceUnitID: restaurantData.zoneRestaurant?.zone?.zoneDetail?.distanceUnit,
            restType:restType?.name,
            isOpen : restaurantData.isOpen ? true : false,
            deliveryRadius: restaurantData?.distanceUnitID?.symbol === "km" ?
                restaurantData.deliveryRadius * 1000 :
                restaurantData.deliveryRadius * 1609,
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
// async function getRestaurantById(req, res) {
//   const restaurantId = req.query.restaurantId;
//   //const { restaurantId } = req.body;
//   //const mc = await R_MCLink.findAll({where: {restaurantId:restaurantId }});
//   //return res.json(mc)

//   const restaurantData = await restaurant.findOne({
//     where: [
//       {
//         id: restaurantId,
//       },
//     ],
//     include: [
//       { model: time, attributes: ["name", "startAt", "endAt", "day"] },
//       {
//         model: restaurant_cultery,
//         include: {
//           model: cutlery,
//         },
//       },
//       {
//         model: unit,
//         as: "distanceUnitID",
//       },
//       {
//         model: unit,
//         as: "currencyUnitID",
//       },
//       {
//         model: deliveryFee,
//       },
//       {
//         model: restaurantRating,
//         include: {
//           model: user,
//         },
//       },
//       {
//         model: R_MCLink,
//         include: [
//           {
//             model: menuCategory,
//           },
//           {
//             model: R_PLink,
//             where: {
//               status: true,
//             },
//           },
//         ],
//       },
//       {
//         model: paymentMethod,
//         attributes: ["id", "name"],
//       },
//     ],
//   });
//   //   return res.json(restaurantData)

//   //Calcuating rating and feedbacks
//   let feedbackData = restaurantData.restaurantRatings;
//   let feedbackArr = [];
//   let restAvgRate = 0;

//   feedbackData.map((fb, idx) => {
//     restAvgRate = restAvgRate + fb.value;
//     let date = new Date(fb.at);
//     if (fb.comment !== "") {
//       let outObj = {
//         rate: fb.value,
//         text: fb.comment,
//         userName: `${fb.user?.firstName} ${fb.user?.lastName}`,
//         at: date.toDateString(),
//       };
//       feedbackArr.push(outObj);
//     }
//   });

//   let avgRate = restAvgRate === 0 ? "0.0" : restAvgRate / feedbackData.length;
//   avgRate = avgRate !== "5.0" ? avgRate : avgRate;
//   //Opening time of restaurant
//   let opHours = restaurantData?.openingTime?.getHours();
//   let opFormat = opHours < 12 ? "AM" : "PM";
//   opHours = ampmFormat(opHours);
//   opHours = addZeroBefore(opHours);
//   let opMins = restaurantData.openingTime?.getMinutes();
//   opMins = addZeroBefore(opMins);
//   let opTime = `${opHours}:${opMins}`;
//   //closing time of restaurant
//   let clHours = restaurantData.closingTime?.getHours();
//   let clFormat = clHours < 12 ? "AM" : "PM";
//   clHours = ampmFormat(clHours);
//   clHours = addZeroBefore(clHours);
//   let clMins = restaurantData.closingTime?.getMinutes();
//   clMins = addZeroBefore(clMins);
//   let clTime = `${clHours}:${clMins}`;

//   // Seprating products with each menu Category
//   let menuCategories = [];
//   products = [];
//   restaurantData.R_MCLinks.map((mc, idx) => {
//     mc.R_PLinks.map((pr, idx) => {
//       let obj = {
//         r_pId: pr.id,
//         name: pr?.name,
//         description: pr.description,
//         image: pr.image,
//         originalPrice: pr.originalPrice,
//         discountPrice: pr.discountPrice,
//       };
//       products.push(obj);
//     });
//     let outObj = {
//       r_mcId: mc.id,
//       name: mc.menuCategory?.name,
//       products: products,
//     };
//     menuCategories.push(outObj);
//     products = [];
//   });

//   // Calculating restaurant rating
//   //let restAvgRate = restaurantData.restaurantRatings.reduce((previousValue, curentValue) => previousValue + curentValue.value, 0);

//   var cutlery_list = [];
//   if (restaurantData?.restaurant_culteries?.length > 0) {
//     restaurantData?.restaurant_culteries?.map((dat) => {
//       cutlery_list.push({
//         id: dat?.cutlery?.id,
//         name: dat?.cutlery?.name,
//         description: dat?.cutlery?.description,
//         image: dat?.cutlery?.image,
//         price: dat?.cutlery?.price,
//       });
//     });
//   }

//   let retObj = {
//     id: restaurantData.id,
//     businessEmail: restaurantData.businessEmail,
//     name: restaurantData.businessName,
//     coverImage: restaurantData.image,
//     description: restaurantData.description,
//     VAT: restaurantData?.VATpercent ? restaurantData?.VATpercent : 0,
//     logo: restaurantData.logo,
//     rating: `${avgRate}`,
//     numOfReviews: `${feedbackArr.length}`,
//     location: `${restaurantData.address} ${restaurantData.zipCode} ${restaurantData.city} `,
//     lat: restaurantData.lat,
//     lng: restaurantData.lng,
//     timings: `${opTime} ${opFormat} - ${clTime} ${clFormat}`,
//     times: restaurantData?.times,
//     deliveryTime: `${restaurantData.approxDeliveryTime} mins`,
//     minOrderAmount: `${restaurantData.currencyUnitID?.symbol}${restaurantData.minOrderAmount} `,
//     paymentMethod: restaurantData?.paymentMethod ?? "",
//     menuCategories: menuCategories,
//     currencyUnit: `${restaurantData.currencyUnitID?.symbol}`,
//     reviews: feedbackArr,
//     cutlery_list: cutlery_list,
//     service_charges: restaurantData?.serviceCharges,
//     deliveryCharge: restaurantData?.deliveryCharge,
//     distanceUnitID: restaurantData?.distanceUnitID,
//     deliveryRadius:
//       restaurantData?.distanceUnitID?.symbol === "km"
//         ? restaurantData.deliveryRadius * 1000
//         : restaurantData.deliveryRadius * 1609,
//   };
//   //  return res.json(feedbackData)
//   const response = ApiResponse(
//     "1",
//     `All Information of restaurant ID ${restaurantId}}`,
//     "",
//     retObj
//   );
//   return res.json(response);
// }
/*
        3. Product by Id
*/
async function getProductById(req,res) {
  const {rpId} = req.body;
  //const { rpId } = req.body;
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

    //  return res.json(productData);
  let currencySign = productData.R_MCLink.restaurant.currencyUnitID.symbol;
  let addOnArr = [];
  productData.P_AOLinks.map((ao, idx) => {
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
    let tmpObj = {
      PAOLinkId: ao.id,
      // name: ao.addOnCategory.name,
      text: `${ao.displayText}`,
      maxAllowed: `${ao.maxAllowed}`,
      minAllowed: `${ao.minAllowed}`,
      addOns: aoArr,
    };
    addOnArr.push(tmpObj);
  });
  let retObj = {
    RPLinkId: productData.id,
    image: productData.image,
    name: productData.name,
    description: productData.description,
    currencySign: `${currencySign}`,
    originalPrice: `${productData.originalPrice}`,
    discountPrice: `${productData.discountPrice} `,
    addOnArr: addOnArr,
  };

  const response = ApiResponse("1", "Product Details", "", retObj);
  return res.json(response);
}
/*
        4. Restaurant by Filters
*/
async function getRestaurantByFilter(req, res) {
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
  console.log(cuisineId);
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
    //  return res.json(found)

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
    let opHours = rest.openingTime?.getHours();
    let opFormat = opHours < 12 ? "AM" : "PM";
    opHours = ampmFormat(opHours);
    opHours = addZeroBefore(opHours);
    let opMins = rest.openingTime?.getMinutes();
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

    if (
      !(
        Date.parse(`${opDate} ${cTime}`) > Date.parse(`${opDate} ${opTime}`) &&
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
}
/*
        5. Restaurant by Search
*/
async function getRestaurantBySearch(req, res) {
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
  // return res.json(restaurantList)
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
    if (rest.distanceUnitID?.name === "miles") {
      distance = distance * 0.6213; //km  to miles
    }
    //if distance is greater than the delivery radius then don't show it to the customer
    if (distance > rest.deliveryRadius) return null;
    //if current time is not between opening and closing time, move to next restaurant
    //Opening time of restaurant
    let opHours = rest.openingTime?.getHours();
    let opFormat = opHours < 12 ? "AM" : "PM";
    opHours = ampmFormat(opHours);
    opHours = addZeroBefore(opHours);
    let opMins = rest.openingTime?.getMinutes();
    opMins = addZeroBefore(opMins);
    let opTime = `${opHours}:${opMins} ${opFormat}`;
    //closing time of restaurant
    let clHours = rest.closingTime?.getHours();
    let clFormat = clHours < 12 ? "AM" : "PM";
    clHours = ampmFormat(clHours);
    clHours = addZeroBefore(clHours);
    let clMins = rest.closingTime?.getMinutes();
    clMins = addZeroBefore(clMins);
    let clTime = `${clHours}:${clMins} ${clFormat}`;
    let opDate = "01/01/2022";
    let clDate = clFormat === "PM" ? "01/01/2022" : "01/02/2022";
    //console.log(rest.businessName, cTime, opTime, clTime, (Date.parse(`${opDate} ${cTime}`)> Date.parse(`${opDate} ${opTime}`) && Date.parse(`${opDate} ${cTime}`)< Date.parse(`${clDate} ${clTime}`) ));
    //comparing time
    if (
      !(
        Date.parse(`${opDate} ${cTime}`) > Date.parse(`${opDate} ${opTime}`) &&
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
      if (distance <= parseFloat(rest.deliveryFee?.baseDistance)) {
        deliveryFee = deliveryFee + parseFloat(rest.deliveryFee.baseCharge);
      } else {
        let extraDistance =
          distance - parseFloat(rest.deliveryFee?.baseDistance);
        let extraUnits =
          extraDistance / parseFloat(rest.deliveryFee?.extraUnitDistance);
        deliveryFee =
          deliveryFee +
          parseFloat(rest.deliveryFee?.baseCharge) +
          extraUnits * parseFloat(rest.deliveryFee?.chargePerExtraUnit);
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
  // return res.json(restaurantList)
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
            if (distance <= parseFloat(ele.deliveryFee?.baseDistance)) {
              deliveryFee =
                deliveryFee + parseFloat(ele.deliveryFee?.baseCharge);
            } else {
              let extraDistance =
                distance - parseFloat(ele.deliveryFee?.baseDistance);
              let extraUnits =
                extraDistance / parseFloat(ele.deliveryFee?.extraUnitDistance);
              deliveryFee =
                deliveryFee +
                parseFloat(ele.deliveryFee?.baseCharge) +
                extraUnits * parseFloat(ele.deliveryFee?.chargePerExtraUnit);
            }
            //limit the delivery to 2 decimal places
            //deliveryFee = Math.round((deliveryFee * 100)) / 100
            deliveryFee = deliveryFee?.toFixed(2);
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
}
//! Module: Payments
async function makePaymentByNewCard(
  cardNum,
  exp_month,
  exp_year,
  cvc,
  amount,
  orderId,
  userId,
  // stripeCustomerId,
  // deviceToken,
  isCredit
) {
    let amountToBePaid = 0;

    let credit = await Credit.findOne({
      where: {
        userId: userId,
      },
    });

    const userData = await user.findOne({
      where: {
        id: userId,
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
          `You have completed the payment of Order ID: ${orderData.id}`
        );

        const response = ApiResponse("1", "Payment successfully Done", "", {});

        return response;
      } else {
        amountToBePaid = parseInt(amount) - parseInt(credit.point);

        if (method) {
          const intent = await stripe.paymentIntents.create({
            amount: parseInt(amountToBePaid) * 100,
            currency: "usd",
            payment_method_types: ["card"],
            customer: `${userData.stripeCustomerId}`,
            payment_method: method.id,
            capture_method: "manual",
          });

          const confirmIntent = await stripe.paymentIntents.confirm(
            `${intent.id}`
          );

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
            `You have completed the payment of Order ID: ${orderData.id}`
          );

          const response = ApiResponse(
            "1",
            "Payment successfully Done",
            "",
            {}
          );

          return response;
        }
      }
    } else {
      amountToBePaid = parseInt(amount);

      if (method) {
        const intent = await stripe.paymentIntents.create({
          amount: parseInt(amountToBePaid) * 100,
          currency: "usd",
          payment_method_types: ["card"],
          customer: `${userData.stripeCustomerId}`,
          payment_method: method.id,
          capture_method: "manual",
        });
        const confirmIntent = await stripe.paymentIntents.confirm(
          `${intent.id}`
        );
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
          `You have completed the payment of Order ID: ${orderData.id}`
        );

        const response = ApiResponse("1", "Payment successfully Done", "", {});

        return response;
      }
    }
  
}
//! Module:3 Order
/* 
       4. Create Order
*/
async function createOrder(req, res) {
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
    voucherId,
    deliveryFees,
    serviceCharges,
    cutlery_data,
    cardNum,
    exp_month,
    exp_year,
    cvc,
    isCredit,
    VAT,
  } = req.body;
  const userId = req.user.id;
  let existInZone = false;
  const userPoint = point([parseFloat(dropOffLat), parseFloat(dropOffLng)]);
  const zoneData = await zoneRestaurants.findOne({
    where: { restaurantId: restaurantId },
    include: [
      { model: restaurant },
      { model: zone, include: { model: zoneDetails } },
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

  if (!existInZone) {
    throw new Error("Your Dropoff Address is out of Restaurant Zone");
  }

  let zoneCharges = 0;
  let distanceCharges = 0;
  let first5KmCharge = 20;

  if (zoneData?.zone?.zoneDetail) {
    zoneCharges = parseFloat(zoneData?.zone?.zoneDetail?.maxDeliveryCharges);
  }

  if (parseInt(distance) < 5) {
    distanceCharges = first5KmCharge;
  } else {
    let additionalDistance = parseInt(distance) - 5;
    let additionalCharges =
      parseFloat(additionalDistance) *
      parseFloat(zoneData?.zone?.zoneDetail?.perKmCharges);
    distanceCharges =
      parseFloat(first5KmCharge) + parseFloat(additionalCharges);
  }

  let ON1 = uON.generate();
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
      attributes: ["deviceToken"],
    },
  });

  let applied = voucherId === "" ? null : voucherId;
  const dropOffId = await addresstoDB(
    dropOffLat,
    dropOffLng,
    building,
    streetAddress,
    userId
  );
  const orderData = await order.create({
    orderNum: `fom-${ON1}`,
    scheduleDate,
    note,
    leaveOrderAt,
    distance,
    subTotal,
    total:
      parseFloat(total) + parseFloat(zoneCharges) + parseFloat(distanceCharges),
    status: true,
    orderTypeId: type.id,
    dropOffId,
    deliveryTypeId,
    orderApplicationId: 1,
    orderModeId,
    paymentMethodId,
    restaurantId,
    userId,
    currencyUnitId: restaurantData.currencyUnitId,
    voucherId: applied,
    orderTypeId: type.id,
    orderStatusId: 1,
    paymentRecieved: true,
  });

  cutlery_data.map(async (dd) => {
    const cultery_name = await cutlery.findOne({
      where: {
        id: dd.id,
      },
    });
    console.log(cultery_name);
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
  await orderHistory.create({
    time,
    orderId: orderData.id,
    orderStatusId: 1,
  });

  products.map((oi, index) => {
    let total = oi.quantity * oi.unitPrice;
    total = total.toFixed(2);
    oi.total = total;
    oi.orderId = orderData.id;
  });

  const orderItemData = await orderItems.bulkCreate(products);

  let aoArr = [];
  products.map((pro, indx) => {
    if (pro.addOnArr.length > 0) {
      pro.addOnArr.map((addon) => {
        addon.addOns.map((add) => {
          let obj = {
            total: add.total,
            qty: add.quantity,
            PAACLinkId: add.PAACLinkId,
            orderItemId: orderItemData[indx].id,
            PAOLinkId: addon.PAOLinkId,
          };

          aoArr.push(obj);
        });
      });
    }
  });
  console.log(aoArr);
  await orderAddOns.bulkCreate(aoArr);

  let driverPerMileCharge = chargesData.find(
    (ele) => ele.title === "driverPerMile"
  );
  let driverbaseCharge = chargesData.find(
    (ele) => ele.title === "driverBaseCharge"
  );

  let driverEarnings = 0;

  if (distanceUnit === "km") tmpDistance = tmpDistance * 0.6213;

  if (deliveryTypeId === "1") {
    if (tmpDistance <= parseFloat(driverbaseCharge.value))
      driverEarnings = parseFloat(driverbaseCharge.amount);
    else {
      let extraDistance = tmpDistance - parseFloat(driverbaseCharge.value);
      let extraUnits = extraDistance / parseFloat(driverPerMileCharge.value);
      driverEarnings =
        parseFloat(driverbaseCharge.amount) +
        extraUnits * parseFloat(driverPerMileCharge.amount);
    }
  }

  let adminCommissionPercent = restaurantData.comission;
  let totalEarnings =
    parseFloat(subTotal) + parseFloat(deliveryFees) + parseFloat(VAT);

  let adminEarnings =
    totalEarnings * (parseFloat(adminCommissionPercent) / 100);
  let restaurantEarnings = totalEarnings - adminEarnings - driverEarnings;

  let ch = {
    basketTotal: subTotal,
    deliveryFees: deliveryFees,
    discount: total - VAT - deliveryFees - subTotal,
    serviceCharges,
    VAT,
    total: totalEarnings,
    adminEarnings: adminEarnings.toFixed(2),
    driverEarnings: driverEarnings.toFixed(2),
    restaurantEarnings: restaurantEarnings.toFixed(2),
    adminPercent: adminCommissionPercent,
    orderId: orderData.id,
  };

  await orderCharge.create(ch);

  let to = [restaurantData?.user?.deviceToken];
  let notification = {
    title: "New Job arrived",
    body: "A new job has arrived",
  };

  sendNotifications(to, notification);

  const retData = await retOrderData(orderData.id);
 const makePayment = await makePaymentByNewCard(cardNum, exp_month, exp_year, cvc,retData.total,orderData.id,userId,isCredit)
 console.log(makePayment);
 let data = {
    orderId: orderData.id,
    orderNum: orderData.orderNum,
    cultery_list: cultery_list,
    restLat: restaurantData.lat,
    restLng: restaurantData.lng,
    restAddress: restaurantData.address,
    waitForDriver: false,
    allowSelfPickUp: restaurantData.deliveryTypeId === 3 ? true : false,
    retData,
  };

  const response = ApiResponse("1", "Order Placed!", "", data);
  return res.json(response);
}
/*
        2. Get Features of restaurant
*/
async function getRestaurantFeatures(req, res) {
  const { restaurantId } = req.body;
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
}
/*
        3. Active Orders of a  user
*/
async function myOrders(req, res) {
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
    throw CustomException("No data available", "You have no active orders");
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
/**
      4. Delivery Types
      __________________________
 */
 
 //get all deliveryTypes
async function deliveryTypes(req,res){
  const deliveryTypes = await deliveryType.findAll({
      where :{
          status:true
      }
  });
  return res.json({
    status: "1",
    message: "All Delivery Types",
    data: {
      deliveryTypes
    },
    error: "",
  });
}
/**
    5. Book Table
  _________________
 */
 
 //table booking api
  async function bookTableBooking(req, res) {
        const {
            noOfMembers,
            date,
            time,
            restaurantId,
            message
        } = req.body;

        const status = await orderStatus.findOne({
            where: {
                name: "Placed"
            }
        });

        const booking = await tableBooking.create({
            noOfMembers,
            date,
            time,
            message,
            status: true,
            restaurantId,
            orderStatusId: status.id,
            userId: req.user.id,
        });

        const restData = await restaurant.findOne({
            where: {
                id: restaurantId,
            },
            include: {
                model: user,
                attributes: ["id", "deviceToken"]
            },
        });
        const userData = await user.findOne({
            where: {
                id: req.user.id
            },
            attributes: ["id", "firstName", "lastName", "deviceToken"],
        });

        if (restData) {
            singleNotification(
                restData?.user?.deviceToken,
                "Request for Book a Table",
                `${userData.firstName} ${userData.lastName} make a request for book a table having no of members are ${noOfMembers}`
            );
        }

        const response = ApiResponse(
            "1",
            "Table Booking Request Created",
            "", {}
        );

        return res.json(response);
    
}
//! Module:4 Addresses
/*
        1. Get Address labels
    ______________________________
*/
async function getaddressLabels(req, res) {
  const labels = await addressType.findAll({
    where: {
      status: true,
    },
  });

  let outArr = labels.map((label) => ({
    id: label.id,
    name: label.name,
  }));

  const response = ApiResponse("1", "List of address labels", "", outArr);
  return res.json(response);
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
  const userId = req.user.id;
  addressTypeText = addressTypeText.toLowerCase();
  saveAddress = saveAddress ? saveAddress : false;

  const addressExist = await address.findOne({
    where: {
      lat: lat,
      lng: lng,
      userId: userId,
    },
  });

  if (addressExist) {
    // Update existing address
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

    await addressExist.save();

    return res.json({
      status: "1",
      message: "Address updated successfully",
      data: {
        id: addressExist.id,
      },
      error: "",
    });
  } else {
    // Create new address entry
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

    await newAddress.save();

    return res.json({
      status: "1",
      message: "Address added successfully",
      data: {
        id: newAddress.id,
      },
      error: "",
    });
  }
}
/*
        3. Get All Addresses
*/
async function getAllAddress(req, res) {
  const userId = req.user.id;
  const addressData = await address.findAll({
    where: {
      status: true,
      saveAddress: true,
      userId: userId,
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
      locationType: rest.locationType,
      AddressType: rest.AddressType,
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
}
/*
        4. Delete Addresses
*/
async function deleteAddress(req, res) {
  const { addressId } = req.body;

  const delStatus = await address.update(
    {
      status: false,
    },
    {
      where: {
        id: addressId,
      },
    }
  );

  const response = ApiResponse("1", "Address deleted", "", {});
  return res.json(response);
}

//! Module:5 Retailer Registration
/*
     1: Register Retailer
*/
async function registerRetailer(req, res) {
  const {
    firstName,
    lastName,
    password,
    email,
    countryCode,
    phoneNum,
    userTypeId,
    countryCodeR,
    phoneNumR,
    businessType,
    description,
    businessName,
    businessEmail,
    city,
    lat,
    lng,
    address,
    zipCode
  } = req.body;

  if (!req.files.logo || !req.files.coverImage) {
    throw CustomException("Pictures Required", "Please Upload Pictures");
  }
  let logoPathTemp = req.files.logo[0].path;
    logoPath = logoPathTemp.replace(/\\/g, "/");
    let imagePathTemp = req.files.coverImage[0].path;
    imagePath = imagePathTemp.replace(/\\/g, "/");
  // check if user with same eamil and phoneNum exists
  const userExist = await user.findOne({
    where: {
      [Op.or]: [
        { email: email },
        {
          [Op.and]: [{ countryCode: countryCode }, { phonenum: phoneNum }],
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

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await user.create({
    firstName: firstName,
    lastName: lastName,
    password: hashedPassword,
    email: email,
    countryCode: countryCode,
    phoneNum: phoneNum,
    status: false,
    userTypeId: userTypeId,
  });
  const newRestaurant = await restaurant.create({
    userId:newUser.id,
    status:false,
    name:`${firstName} ${lastName}`,
    email,
    countryCode: countryCodeR,
    phoneNum: phoneNumR,
    businessType:userTypeId === 5 ? 1 : userTypeId === 6 ? 3 : null,
    logo:logoPath,
    image:imagePath,
    businessName,
    businessEmail,
    description:description?description:"",
    city,
    lat,
    lng,
    zipCode,
    address,
  });

  const response = ApiResponse(
    "1",
    "Store created . Waiting for admin to aprrove it",
    "",
    {}
  );
  return res.json(response);
}


// add to wishlist
async function addToWishList(req,res){
    const {RPLinkId , userId } = req.body;
    const check = await wishList.findOne({where:[{RPLinkId : RPLinkId },{userId : userId},{status:true}]});
    if(check){
        await check.destroy();
        const response = ApiResponse("1","Removed from wishList","",{});
        return res.json(response)
    }
    else{
        const ww = new wishList();
        ww.userId = userId ;
        ww.RPLinkId = RPLinkId;
        ww.status = true;
        ww.save().then(dat =>{
             const response = ApiResponse("1","Added successfully","",{});
        return res.json(response)
        })
        .catch((error)=>{
            const response = ApiResponse("0",error.message,"",{});
        return res.json(response)
        })
    }
}


//get wishlist of user
async function getWishList(req,res){
    const ww = await wishList.findAll({where:[{status : true},{userId : req.user.id}],include:{model:R_PLink}});
    const response = ApiResponse("1","Wish List","",ww);
    return res.json(response);
}

// this is home api for user
async function getRestaurantByIdFromUser(req, res) {
    const {
        restaurantId
    } = req.params;
    try {
        const restaurantData = await restaurant.findOne({
            where: [{
                id: restaurantId,
            }, ],
            include: [{
                    model: zoneRestaurants,
                    include: {
                        model: zone,
                        include: {model:zoneDetails,include:[{model:unit,as:"currencyUnit"},{model:unit,as:"distanceUnit"}]}
                    }
                },
                {
                    model: time,
                    attributes: ["name", "startAt", "endAt", "day"]
                },
                {
                    model: restaurant_cultery,
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
                    include: [{
                            model: menuCategory
                        },
                        {
                            model: R_PLink,
                            where: [{
                                    status: true,
                                }, {
                                    isAvailable: true
                                }

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

        const deliveryChargeDefault = await defaultValues.findOne({
            where: {
                name: "deliveryCharge"
            }
        });

        let deliveryCharges = 0;
        if (restaurantData.zoneRestaurant.zone.zoneDetail) {
            deliveryCharges = restaurantData.zoneRestaurant.zone.zoneDetail.maxDeliveryCharges;
        } else {
            deliveryCharges = deliveryChargeDefault.value;
        }
        const serviceDefault = await defaultValues.findOne({
            where: {
                name: "serviceCharges"
            }
        });
        const serviceChargesType = await defaultValues.findOne({
            where: {
                name: "serviceChargesType"
            }
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
                day: "2-digit"
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
        let dd = await getProductDetails(pr.id);
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
        
        // restaurantData.R_MCLinks.map(async(mc, idx) => {
           
        //     mc.R_PLinks.map(async(pr, idx) => {
                
                
        //         let obj = {
        //             r_pId: pr.id,
        //             name: pr?.name,
        //             description: pr.description,
        //             image: pr.image,
        //             originalPrice: pr.originalPrice,
        //             discountPrice: pr.discountPrice,
        //             isPopular: pr.isPopular == null ? false : pr.isPopular,
                   
        //         };
        //         products.push(obj);
        //     });
        //     if (mc.menuCategory.status == true) {
        //         let outObj = {
        //             r_mcId: mc.id,
        //             name: mc.menuCategory?.name,
        //             iconImage: mc.menuCategory?.image,
        //             products: products,
        //         };
        //         menuCategories.push(outObj);
        //     }
        //     let dd = await getProductDetails(pr.id);
        //     products.push(dd);
        //     // products = [];
        // });
        

        // Calculating restaurant rating
        //let restAvgRate = restaurantData.restaurantRatings.reduce((previousValue, curentValue) => previousValue + curentValue.value, 0);
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
            timings: restaurantData?.openingTime == null ? "Opening & Closing Time not set yet" : `${opTime} ${opFormat} - ${clTime} ${clFormat}`,
            times: time_list,
            deliveryTime: `${restaurantData.approxDeliveryTime} mins`,
            minOrderAmount: `${restaurantData.currencyUnitID?.symbol}${restaurantData.minOrderAmount}`,
            paymentMethod: restaurantData?.paymentMethod ?? {},
            menuCategories: menuCategories,
            currencyUnit: `${restaurantData.zoneRestaurant?.zone?.zoneDetail?.currencyUnit?.symbol}`,
            reviews: feedbackArr,
            cultery_list: restaurantData?.restaurant_cultery ? restaurantData?.restaurant_cultery : [],
            cultery_status: restaurantData.restaurant_cultery == null ? false : true,
            serviceChargeType: restaurantData.serviceChargesType ? restaurantData.serviceChargesType : serviceChargesType.value,
            service_charges: restaurantData.serviceCharges ? restaurantData.serviceCharges : serviceDefault.value,
            deliveryCharge: deliveryCharges,
            distanceUnitID: restaurantData.zoneRestaurant?.zone?.zoneDetail?.distanceUnit,
            deliveryRadius: restaurantData?.distanceUnitID?.symbol === "km" ?
                restaurantData.deliveryRadius * 1000 :
                restaurantData.deliveryRadius * 1609,
        };
        //  return res.json(feedbackData)
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

//get all favourite restaurant of user
async function favRestaurant(req,res){
    
    const {userId} = req.params;
    let restaurantList = [];
    let storeList = [];
    let all = [];
    let restData = await favouriteRestaurant.findAll({where:{userId : userId},include:[{model:restaurant,include:{model:zoneRestaurants,include:{model:zone,include:{model:zoneDetails,include:[{model:unit,as:"distanceUnit"},{model:unit,as:"currencyUnit"}]}}}}]});
    // return res.json(restData);
    const storeId = await orderApplication.findOne(
      {
         where:
         {
            name: "store"
         },
      });
    const restaurantId = await orderApplication.findOne(
      {
         where:
         {
            name: "restaurant"
         },
      });
    for (var i = 0; i < restData.length; i++)
    {
               if (restData[i].restaurant)
               {
                  
                   const result = await restaurantRating.findOne({
                      attributes: [
                        [sequelize.fn('AVG', sequelize.col('value')), 'averageRating'],
                      ],
                      where: { restaurantId: restData[i].restaurant?.id },
                    });
                    const averageRating = result.get('averageRating');
                  let obj = {
                     id: restData[i].restaurant?.id,
                     businessName: restData[i].restaurant?.businessName,
                     businessEmail: restData[i].restaurant?.businessEmail,
                     businessType: restData[i].restaurant?.businessType,
                     city: restData[i].restaurant?.city,
                     zipCode: restData[i].restaurant?.zipCode,
                     address: restData[i].restaurant?.address,
                     logo: restData[i].restaurant?.logo,
                     image: restData[i].restaurant?.image,
                     isOpen: restData[i].restaurant?.isOpen ? true : false,
                     openingTime: dateFormat(
                        restData[i].restaurant?.openingTime
                     ),
                     closingTime: dateFormat(
                        restData[i].restaurant?.closingTime
                     ),
                     lat: restData[i].restaurant?.lat,
                     lng:restData[i].restaurant?.lng,
                    //  rating: averageRating ? Number(averageRating).toFixed(1).toString() : "0.0",
                     rating: averageRating ? Number(averageRating).toFixed(1).toString() : "0.0",
                     deliveryTime: restData[i].restaurant?.isRushMode ? (parseInt(restData[i].restaurant?.approxDeliveryTime) + parseInt(restData[i].restaurant?.rushModeTime)) : parseInt(restData[i].restaurant?.approxDeliveryTime),
                     deliveryFee: restData[i].restaurant?.deliveryFeeFixed,
                     currencyUnit:{
                         name:restData[i].restaurant?.zoneRestaurant?.zone?.zoneDetail?.currencyUnit?.name,
                         symbol:restData[i].restaurant?.zoneRestaurant?.zone?.zoneDetail?.currencyUnit?.symbol,
                         shortcode:restData[i].restaurant?.zoneRestaurant?.zone?.zoneDetail?.currencyUnit?.shortcode,
                     },
                     distanceUnit : {
                         name : restData[i].restaurant?.zoneRestaurant?.zone?.zoneDetail?.distanceUnit?.name,
                         symbol : restData[i].restaurant?.zoneRestaurant?.zone?.zoneDetail?.distanceUnit?.symbol,
                     }
                  };
                  all.push(obj)
 
                  if (parseInt(restaurantId.id) == parseInt( restData[i].restaurant?.businessType))
                  {
                    
                      restaurantList.push(obj);
                  }
                  else if (restData[i].restaurant?.businessType == storeId.id)
                  {
                     storeList.push(obj);
                  }
               }
            }
    let data = {
        restaurantList,
        storeList,
        all
    }
    let response = ApiResponse("1","Favourite Restaurant and Store","",data);
    return res.json(response);
}

//add restaurant from favourite list
async function addToFav(req,res){
    const { userId ,restaurantId } = req.body;
    let check = await favouriteRestaurant.fineOne({where:[{userId : userId},{restaurantId:restaurantId}]});
    if(check){
        let response = ApiResponse("0","Already in favourite list","",{});
        return res.json(response);
    }
    else{
        let restData = await restaurant.findOne({where:{id:restaurantId},attributes:['businessType']});
        let fav = new favouriteRestaurant();
        fav.restaurantId = restaurantId;
        fav.userId = userId;
        fav.businessType = restData?.businessType;
        fav.status = true;
        fav.save().then(dat =>{
            let response = ApiResponse("1","Added to favourite list","",{});
            return res.json(response);
        })
        .catch((error)=>{
            let response = ApiResponse("0",error.message,"",{});
            return res.json(response);
        })
    }
}

//remove restaurant from favourite list
async function removeFromFav(req,res){
    const { userId ,restaurantId } = req.body;
    let check = await favouriteRestaurant.fineOne({where:[{userId : userId},{restaurantId:restaurantId}]});
    if(check){
        await check.destroy();
        let response = ApiResponse("1","Remove from favourite list","",{});
        return res.json(response);
    }
    else{
         let response = ApiResponse("0","Sorry ! not found","",{});
        return res.json(response);
    }
}

async function searchProduct(req,res){
    const { productName } = req.body;
      // Check if productName is empty
    if (productName.trim() === '') {
        let data = { list: [] }; // Return an empty list
        let response = ApiResponse("1", "List", "", data);
        return res.json(response);
    }
    const rplink = await R_PLink.findAll({
            where: {
                name: {
                    [Op.like]: `%${productName}%`
                },
                status: true
            },
            attributes:['id','name','description','image','originalPrice'],
            include:{model:R_MCLink,attributes:['restaurantId']}
        });
    let data = {
        list:rplink
    }
    let response = ApiResponse("1","List","",data);
    return res.json(response);
}



module.exports = {
  emailChecker,
  registerUser,
  verifyEmail,
  resendOTP,
  signInUser,
  forgetPasswordRequest,
  changePasswordOTP,
  logout,

  landingPage,
  getRestaurantById,
  getRestaurantByIdFromUser,
  getProductById,
  getRestaurantByFilter,
  getRestaurantBySearch,

  createOrder,
  getRestaurantFeatures,
  myOrders,
  deliveryTypes,
  bookTableBooking,
  getaddressLabels,
  addAddress,
  getAllAddress,
  deleteAddress,

  registerRetailer,

  home,
  home1,
  addorder,
  
  addToWishList,
  getWishList,
  favRestaurant,
  addToFav,
  searchProduct
};
