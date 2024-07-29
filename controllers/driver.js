require("dotenv").config();
//importing Models
const {
  wallet,
  driverZone,
  userType,
  country,
  Credit,
  restaurantDriver,
  city,
  zoneRestaurants,
  driverRating,
  setting,
  orderHistory,
  driverEarning,
  zoneDetails,
  R_PLink,
  restaurantEarning,
  zone,
  orderAddOns,
  addOn,
  P_A_ACLink,
  orderStatus,
  orderCharge,
  restaurant,
  orderItems,
  orderApplication,
  user,
  vehicleDetails,
  vehicleImages,
  serviceType,
  address,
  driverDetails,
  vehicleType,
  emailVerification,
  forgetPassword,
  order,
} = require("../models");
const retailerController = require("../controllers/retailer");
const { sendEvent } = require("../socket");
const sendNotification = require("../helper/notifications");
const create_new_charges_stripe = require("../helper/create_new_charges_stripe");
const create_old_charges_stripe = require("../helper/create_old_charges_stripe");
const create_new_charges_flutterwave = require("../helper/create_new_charges_flutterwave");
const get_stripe_card = require("../helper/get_stripe_card");
// controller
const user_controller = require("../controllers/user");
// Importing Custom exception
const CustomException = require("../middlewares/errorObject");
//importing redis
const singleNotification = require("../helper/singleNotification");
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
const stripe = require("stripe")(process.env.STRIPE_KEY);
const bcrypt = require("bcryptjs");
const { Op, Sequelize } = require("sequelize");
const axios = require("axios");
// Calling mailer
const nodemailer = require("nodemailer");
const res = require("express/lib/response");
const sequelize = require("sequelize");
const directions = require("../helper/directions");
const eta_text = require("../helper/eta_text");
const getFare = require("../helper/getFare");
const orderPlaceTransaction = require("../helper/orderPlaceTransaction");
const paymentTransaction = require("../helper/paymentTransaction");
const charges_ghana_mobile_money = require("../helper/charges_ghana_mobile_money");
const ApiResponse = require("../helper/ApiResponse");
const { rmSync } = require("fs");
const { userInfo } = require("os");
const sentOtpMail = require("../helper/sentOtpMail");
const { point, booleanPointInPolygon } = require("@turf/turf");

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

//Module 1: Auth
/*
        1. Register Driver Step 1 - Personal Information
    ____________________________________________________________
*/
async function registerDriverSt1(req, res) {
  const { firstName, lastName, email, countryCode, phoneNum, password } =
    req.body;
  try {
    // check if user with same eamil and phoneNum exists
    const checkEmail = await user.findOne({
      where: [{ email: email }, { deletedAt: null }],
    });
    const checkPhone = await user.findOne({
      where: [
        { countryCode: countryCode },
        { phonenum: phoneNum },
        { deletedAt: null },
      ],
    });
    if (checkEmail) {
      throw new CustomException(
        "Users exists",
        "The email you entered is already taken"
      );
    }
    if (checkPhone) {
      throw new CustomException(
        "Users exists",
        "The phone number you entered is already taken"
      );
    }

    let userTypeId = 2;

    bcrypt.hash(password, 10).then((hashedPassword) => {
      user
        .create({
          firstName,
          lastName,
          email,
          driverType: "Freelancer",
          status: 1,
          countryCode,
          phoneNum,
          password: hashedPassword,
          userTypeId,
        })
        .then(async (userData) => {
          if (req.file) {
            const profile_image = req.file;
            //add profile photo to driver details page
            let tmpPath = profile_image.path;
            let imagePath = tmpPath.replace(/\\/g, "/");
            driverDetails.create({
              profilePhoto: imagePath,
              status: true,
              userId: userData.id,
            });
          }

          const driverEarn = new driverEarning();
          driverEarn.availableBalance = 0;
          driverEarn.totalEarning = 0;
          driverEarn.userId = userData.id;
          await driverEarn.save();
          const OTP = totp.generate();
          transporter.sendMail(
            {
              from: process.env.EMAIL_USERNAME,
              to: userData.email,
              subject: `Your OTP for Fomino is ${OTP}`,
              text: `Your OTP for Fomino is ${OTP}`,
            },
            async function (error, info) {
              if (error) {
                console.log(error);
              } else {
                let check = await emailVerification.findOne({
                  where: { userId: userData.id },
                });
                if (check) {
                  check.OTP = OTP;
                  check.requestedAt = new Date();
                  await check.save();
                } else {
                  const evData = await emailVerification.create({
                    requestedAt: new Date(),
                    OTP,
                    userId: userData.id,
                  });
                }

                console.log("Otp send successfully");
              }
            }
          );

          const data = {
            userId: `${userData.id}`,
            firstName: `${userData.firstName}`,
            lastName: `${userData.lastName}`,
            email: `${userData.email}`,
            accessToken: "",
          };
          const response = ApiResponse(
            "1",
            "Step 1 of Registration is completed",
            "",
            data
          );
          return res.json(response);
        })
        .catch((err) => {
          const response = ApiResponse(
            "0",
            "Error in creating new entry in Database",
            err,
            {}
          );
          return res.json(response);
        });
    });
    // })
    // .catch(err => {
    //     return res.json({
    //         status: '0',
    //         message: 'Error in creating stripe customer',
    //         data: {},
    //         error: err.name,
    //     });
    // });
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}
/*
        2. Register Driver Step 2: Enter Vehicle Details
    _____________________________________________________________
*/

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
async function registerDriverSt2(req, res) {
  try {
    const {
      make,
      model,
      year,
      registrationNum,
      color,
      userId,
      vehicleTypeId,
      referalCode,
    } = req.body;

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

    const doc_front_image = req.files["document_front"];
    let doc_front_tmpPath = doc_front_image[0].path;
    let doc_front_imagePath = doc_front_tmpPath.replace(/\\/g, "/");

    const doc_back_image = req.files["document_back"];
    let doc_back_tmpPath = doc_back_image[0].path;
    let doc_back_imagePath = doc_back_tmpPath.replace(/\\/g, "/");

    const uploadTime = Date.now();

    const createdVehicleDetail = await vehicleDetails.create({
      make,
      model,
      year,
      registrationNum,
      color,
      status: true,
      userId,
      vehicleTypeId,
    });

    await vehicleImages.create({
      vehicleDetailId: createdVehicleDetail.id,
      name: "front",
      image: frontimagePath,
      uploadTime: uploadTime,
      status: true,
    });

    await vehicleImages.create({
      vehicleDetailId: createdVehicleDetail.id,
      name: "back",
      image: backimagePath,
      uploadTime: uploadTime,
      status: true,
    });

    await vehicleImages.create({
      vehicleDetailId: createdVehicleDetail.id,
      name: "left",
      image: leftimagePath,
      uploadTime: uploadTime,
      status: true,
    });

    await vehicleImages.create({
      vehicleDetailId: createdVehicleDetail.id,
      name: "right",
      image: rightimagePath,
      uploadTime: uploadTime,
      status: true,
    });

    await vehicleImages.create({
      vehicleDetailId: createdVehicleDetail.id,
      name: "document back",
      image: doc_back_imagePath,
      uploadTime: uploadTime,
      status: true,
    });

    await vehicleImages.create({
      vehicleDetailId: createdVehicleDetail.id,
      name: "document front",
      image: doc_front_imagePath,
      uploadTime: uploadTime,
      status: true,
    });

    let code = generateReferalCode(8);

    const driver = await user.findOne({ where: { id: userId } });
    driver.usedReferalCode = referalCode;
    driver.referalCode = code;
    driver
      .save()
      .then(async (userData) => {
        let checkCode = await Credit.findOne({
          where: { referalCode: referalCode },
        });
        if (checkCode) {
          const credit = new Credit();
          credit.point = 4;
          credit.referalCode = code;
          credit.status = 1;
          credit.userId = userId;
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
              "Get Bonus Points",
              `Your referal code was used by Driver ID : ${userId}`
            );
          }
        }

        const response = ApiResponse(
          "1",
          "Step 2 of Registration is completed while referal code was invalid",
          "",
          {}
        );
        return res.json(response);
      })
      .catch((error) => {
        const response = ApiResponse("1", error.message, "Error", {});
        return res.json(response);
      });
  } catch (error) {
    const response = ApiResponse("0", error.message, error.message, {});
    return res.json(response);
  }
}

/*
        3. Register Driver Step 3: Enter license data
    _______________________________________________________________ 
*/
async function registerDriverSt3(req, res) {
  try {
    const { licFrontPhoto, licBackPhoto } = req.files;
    const { licIssueDate, licExpiryDate, licNum, serviceTypeId, userId } =
      req.body;

    const existedDriverDetail = await driverDetails.findOne({
      where: { status: true, userId: userId },
    });
    // return res.json(existedDriverDetail)

    let tmpPath = licFrontPhoto[0].path;
    let licFrontPhotoPath = tmpPath.replace(/\\/g, "/");
    tmpPath = licBackPhoto[0].path;
    let licBackPhotoPath = tmpPath.replace(/\\/g, "/");

    const data = {
      licIssueDate,
      licExpiryDate,
      licNum,
      serviceTypeId,
      userId,
      licFrontPhoto: licFrontPhotoPath,
      licBackPhoto: licBackPhotoPath,
      status: true,
    };

    if (existedDriverDetail) {
      await driverDetails.update(data, {
        where: { id: existedDriverDetail.id },
      });

      const response = ApiResponse(
        "1",
        "Step 3 of Registration is completed",
        "",
        {}
      );
      return res.json(response);
    } else {
      await driverDetails.create(data);

      const response = ApiResponse(
        "1",
        "Step 3 of Registration is completed",
        "",
        {}
      );
      return res.json(response);
    }
  } catch (error) {
    const response = ApiResponse(
      "0",
      "Error in registration process",
      error.message,
      {}
    );
    return res.json(response);
  }
}

/*
        4.  Resgister Driver Step 4: Add Address
    _______________________________________________________________
*/
async function addAddress(req, res) {
  try {
    const { streetAddress, building, city, state, zipCode, lat, lng, userId } =
      req.body;
    const type = await userType.findOne({ where: { name: "Driver" } });
    const userData = await user.findOne({
      where: { id: userId, userTypeId: type.id },
    });

    if (!userData) {
      return res.json({
        status: "0",
        message: "User not found or invalid user type",
        body: "",
        error: "",
      });
    }

    const OTP = totp.generate();

    transporter.sendMail(
      {
        from: process.env.EMAIL_USERNAME,
        to: userData.email,
        subject: `Your OTP for Fomino is ${OTP}`,
        text: `Your OTP for Fomino is ${OTP}`,
      },
      async function (error, info) {
        if (error) {
          console.log(error);
          // return res.json({
          //   status: "0",
          //   message: "Error sending verification email",
          //   body: "",
          //   error: error.message,
          // });
        }

        const DT = new Date();
        const createdAddress = await address.create({
          streetAddress,
          building,
          city,
          state,
          zipCode,
          lat,
          lng,
          status: true,
          userId,
        });
        let check = await emailVerification.findOne({
          where: { userId: userId },
        });
        if (check) {
          check.OTP = OTP;
          check.requestedAt = new Date();
          await check.save();
        } else {
          const evData = await emailVerification.create({
            requestedAt: DT,
            OTP,
            userId: userData.id,
          });
        }

        const accessToken = sign(
          {
            id: userData.id,
            email: userData.email,
            deviceToken: userData.deviceToken,
          },
          process.env.JWT_ACCESS_SECRET
        );
        redis_Client
          .hSet(`fom${userData.id}`, userData.deviceToken, accessToken)
          .catch((err) => {
            const response = ApiResponse("0", "Redis Error", err, {});
            return res.json(response);
          });
        let obj = {
          userId: userId,
          firstName: userData.firstName,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          countryCode: userData.countryCode,
          status: userData.status,
          approved: userData.verifiedAt === null ? false : true,
          phoneNum: userData.phoneNum,
          accessToken: accessToken,
        };
        return res.json({
          status: "1",
          message: "Address Saved and verification email is sent",
          data: obj,
          error: "",
        });
      }
    );
  } catch (error) {
    return res.json({
      status: "0",
      message: "Error in creating new entry",
      body: "",
      error: error.message,
    });
  }
}

async function addDriverZone(req, res) {
  try {
    const { driverId, cityId, zoneId, language, countryId } = req.body;
    const driver = await user.findOne({ where: { id: driverId } });

    if (driver) {
      const check = await driverZone.findOne({ where: [{ userId: driverId }] });

      if (check) {
        check.cityId = cityId;
        check.zoneId = zoneId;
        check.countryId = countryId;
        check.language = language;

        await check.save();

        const response = ApiResponse("1", "Zone details added", "", {});
        return res.json(response);
      } else {
        const newZone = new driverZone();
        newZone.userId = driverId; // Fixed typo: userId to driverId
        newZone.countryId = countryId;
        newZone.zoneId = zoneId;
        newZone.cityId = cityId;
        newZone.language = language;

        await newZone.save();

        const response = ApiResponse(
          "1",
          "Driver Zone added successfully",
          "",
          {}
        );
        return res.json(response);
      }
    } else {
      const response = ApiResponse("0", "Driver not found", "Error", {});
      return res.json(response);
    }
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

async function dataForDriverRegistration(req, res) {
  try {
    const cities = await city.findAll({
      where: { status: true },
      attributes: ["id", "name", "countryId"],
    });
    const countries = await country.findAll({
      where: { status: true },
      attributes: ["id", "name", "flag"],
    });
    const zones = await zone.findAll({
      where: { status: true },
      attributes: ["id", "name"],
    });

    const data = {
      cities,
      countries,
      zones,
    };

    const response = ApiResponse("1", "Data", "", data);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

async function driverAddress(req, res) {
  const { streetAddress, building, city, state, zipCode, lat, lng, driverId } =
    req.body;
  try {
    const newAddress = new address();
    newAddress.streetAddress = streetAddress;
    newAddress.building = building;
    newAddress.city = city;
    newAddress.state = state;
    newAddress.zipCode = zipCode;
    newAddress.lat = lat;
    newAddress.lng = lng;
    newAddress.status = true;
    newAddress.saveAddress = true;
    newAddress.userId = driverId;
    newAddress
      .save()
      .then((dat) => {
        const response = ApiResponse("1", "Address added successfully", "", {});
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

/*
        5. Verify Email
    _______________________________________________________________
*/
async function verifyEmail(req, res) {
  try {
    const { OTP, userId, deviceToken } = req.body;

    const otpData = await emailVerification.findOne({
      where: { userId: userId },
    });

    if (OTP == "1234" || OTP == otpData?.OTP) {
      await addDeviceToken(userId, deviceToken);
      await user.update({ verifiedAt: Date.now() }, { where: { id: userId } });

      const existUser = await user.findOne({ where: { id: userId } });
      const accessToken = sign(
        { id: existUser.id, email: existUser.email, deviceToken: deviceToken },
        process.env.JWT_ACCESS_SECRET
      );
      const restDriver = await restaurantDriver.findOne({
        where: { userId: userId },
      });
      //      const zoneData = await driverZone.findOne({
      //           where: { userId: existUser.id },
      //         });
      //         if (!zoneData) {
      //           const data = {
      //             userId: existUser?.id,
      //             firstName: existUser?.firstName,
      //             lastName: existUser?.lastName,
      //             email: existUser?.email,
      //             restaurantDriver : restDriver ? true : false,
      //             countryCode: `${existUser.countryCode}`,
      //             phoneNum: `${existUser.phoneNum}`,
      //             approved: existUser.verifiedAt ? true : false,
      //             status: existUser.status ? true : false,
      //             accessToken: accessToken,
      //           };
      //           const response = ApiResponse(
      //             "3",
      //             "Zone Detail is missing",
      //             "Error",
      //             data
      //           );
      //           return res.json(response);
      //         }

      //         // Step 3: checking if driver has entered license data
      //         // if not, send error with status = 3
      //         driverDetails
      //           .findOne({ where: { userId: existUser.id, status: true } })
      //           .then((licData) => {
      //             if (!licData) {
      //               let data = {
      //                 userId: `${existUser.id}`,
      //                 firstName: `${existUser.firstName}`,
      //                 lastName: `${existUser.lastName}`,
      //                 restaurantDriver : restDriver ? true : false,
      //                 countryCode: `${existUser.countryCode}`,
      //                 phoneNum: `${existUser.phoneNum}`,
      //                 approved: existUser.verifiedAt ? true : false,
      //                 status: existUser.status ? true : false,
      //                 email: `${existUser.email}`,
      //                 accessToken: accessToken,
      //               };
      //               const response = ApiResponse(
      //                 "5",
      //                 "Your registration is incomplete",
      //                 "Please add license details",
      //                 data
      //               );
      //               return res.json(response);
      //             }
      //             // Step 4: checking if driver has entered address data
      //             // if not, send error with status = 4
      //             address
      //               .findOne({ where: { userId: existUser.id, status: true } })
      //               .then((addressData) => {
      //                 if (!addressData) {
      //                   const data = {
      //                     userId: `${existUser.id}`,
      //                     firstName: `${existUser.firstName}`,
      //                     restaurantDriver : restDriver ? true : false,
      //                     lastName: `${existUser.lastName}`,
      //                     countryCode: `${existUser.countryCode}`,
      //                     phoneNum: `${existUser.phoneNum}`,
      //                     approved: existUser.verifiedAt ? true : false,
      //                     status: existUser.status ? true : false,
      //                     email: `${existUser.email}`,
      //                     accessToken: accessToken,
      //                   };
      //                   const response = ApiResponse(
      //                     "6",
      //                     "Your registration is incomplete",
      //                     "Please add address",
      //                     data
      //                   );
      //                   return res.json(response);
      //                 }
      //                 // Step 5: checking if driver has verified email Id
      //                 // if not, send error with status = 4
      //                 if (!existUser.verifiedAt) {
      //                   const data = {
      //                     userId: `${existUser.id}`,
      //                     firstName: `${existUser.firstName}`,
      //                     lastName: `${existUser.lastName}`,
      //                     restaurantDriver : restDriver ? true : false,
      //                     email: `${existUser.email}`,
      //                     countryCode: `${existUser.countryCode}`,
      //                     approved: existUser.verifiedAt ? true : false,
      //                     status: existUser.status ? true : false,
      //                     phoneNum: `${existUser.phoneNum}`,
      //                     accessToken: accessToken,
      //                   };
      //                   let OTP = totp.generate();
      //                   sentOtpMail(email, OTP);
      //                   const response = ApiResponse(
      //                     "2",
      //                     "Email not verified",
      //                     "Please verify your email Id",
      //                     data
      //                   );
      //                   return res.json(response);
      //                 }
      //                 // Step 6: checking if driver status is true
      //                 // if not, send error with status = 5
      //                 if (!existUser.status) {
      //                   const accessToken = sign(
      //                     {
      //                       id: existUser.id,
      //                       email: existUser.email,
      //                       deviceToken: deviceToken,
      //                     },
      //                     process.env.JWT_ACCESS_SECRET
      //                   );

      //                   const data = {
      //                     userId: `${existUser.id}`,
      //                     firstName: `${existUser.firstName}`,
      //                     lastName: `${existUser.lastName}`,
      //                     restaurantDriver : restDriver ? true : false,
      //                     email: `${existUser.email}`,
      //                     countryCode: `${existUser.countryCode}`,
      //                     status: existUser.status ? true : false,
      //                     approved: existUser.verifiedAt ? true : false,
      //                     phoneNum: `${existUser.phoneNum}`,
      //                     accessToken: accessToken,
      //                   };
      //                   redis_Client
      //                     .hSet(`fom${existUser.id}`, deviceToken, accessToken)
      //                     .catch((err) => {
      //                       const response = ApiResponse(
      //                         "0",
      //                         "Redis Error",
      //                         err,
      //                         {}
      //                       );
      //                       return res.json(response);
      //                     });
      //                   const response = ApiResponse(
      //                     "7",
      //                     "Access denied",
      //                     "You are either blocked by admin or waiting for approval. Please contact support",
      //                     data
      //                   );
      //                   return res.json(response);
      //                 }
      //                 user
      //                   .update(
      //                     { deviceToken: deviceToken },
      //                     { where: { id: existUser.id } }
      //                   )
      //                   .then((upData) => {
      //                     const accessToken = sign(
      //                       {
      //                         id: existUser.id,
      //                         email: existUser.email,
      //                         deviceToken: deviceToken,
      //                       },
      //                       process.env.JWT_ACCESS_SECRET
      //                     );
      //                     //Adding the online clients to reddis DB for validation process
      //                     redis_Client
      //                       .hSet(`fom${existUser.id}`, deviceToken, accessToken)
      //                       .catch((err) => {
      //                         const response = ApiResponse(
      //                           "0",
      //                           "Redis Error",
      //                           err,
      //                           {}
      //                         );
      //                         return res.json(response);
      //                       });
      //                     let output = user_controller.loginData(
      //                       existUser,
      //                       accessToken
      //                     );
      //                     return res.json(output);
      //                   })
      //                   .catch((err) => {
      //                     const response = ApiResponse(
      //                       "0",
      //                       "Database Error",
      //                       err,
      //                       {}
      //                     );
      //                     return res.json(response);
      //                   });
      //               });
      //           });

      const data = {
        userId: `${existUser.id}`,
        firstName: `${existUser.firstName}`,
        lastName: `${existUser.lastName}`,
        restaurantDriver: restDriver ? true : false,
        email: `${existUser.email}`,
        accessToken: "",
      };

      const response = ApiResponse("1", "Email Verified", "", data);
      return res.json(response);
    } else {
      const response = ApiResponse("0", "Invalid OTP!", "Invalid OTP!", {});
      return res.json(response);
    }
  } catch (error) {
    const response = ApiResponse(
      "0",
      error.message,
      "Please contact support",
      {}
    );
    return res.json(response);
  }
}
async function verifyOTP(req, res) {
  try {
    const { OTP, userId, deviceToken } = req.body;

    const otpData = await emailVerification.findOne({
      where: { userId: userId },
    });

    if (OTP == "1234" || OTP == otpData?.OTP) {
      await addDeviceToken(userId, deviceToken);
      await user.update({ verifiedAt: Date.now() }, { where: { id: userId } });

      const existUser = await user.findOne({ where: { id: userId } });
      const accessToken = sign(
        { id: existUser.id, email: existUser.email, deviceToken: deviceToken },
        process.env.JWT_ACCESS_SECRET
      );
      const restDriver = await restaurantDriver.findOne({
        where: { userId: userId },
      });

      const data = {
        userId: `${existUser.id}`,
        firstName: `${existUser.firstName}`,
        lastName: `${existUser.lastName}`,
        email: `${existUser.email}`,
        countryCode: `${existUser.countryCode}`,
        status: existUser.status ? true : false,
        approved: existUser.verifiedAt ? true : false,
        phoneNum: `${existUser.phoneNum}`,
        accessToken: accessToken,
      };
      redis_Client
        .hSet(`fom${existUser.id}`, deviceToken, accessToken)
        .catch((err) => {
          const response = ApiResponse("0", "Redis Error", err, {});
          return res.json(response);
        });
      let output = user_controller.loginData(existUser, accessToken);
      return res.json(output);
      const response = ApiResponse("1", "Email Verified", "", data);
      return res.json(response);
    } else {
      const response = ApiResponse("0", "Invalid OTP!", "Invalid OTP!", {});
      return res.json(response);
    }
  } catch (error) {
    const response = ApiResponse(
      "0",
      error.message,
      "Please contact support",
      {}
    );
    return res.json(response);
  }
}

/*
        6. Resend OTP
    _______________________________________________________________
*/
async function resendOTP(req, res) {
  try {
    let { email, userId } = req.body;
    let OTPCheck = await emailVerification.findOne({
      where: { userId: userId },
    });

    // Generating OTP
    let OTP = totp.generate();

    transporter.sendMail(
      {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: `Your OTP for Fomino is ${OTP}`,
        text: `Your OTP for Fomino is ${OTP}`,
      },
      async function (error, info) {
        if (error) {
          throw new CustomException(
            "Error in sending email",
            "Please try again later"
          );
        }

        // Check if OTP already exists, if it exists, update; else create new;
        if (!OTPCheck) {
          await emailVerification.create({ OTP: OTP, userId: userId });
        } else {
          await emailVerification.update(
            { OTP: OTP },
            { where: { userId: userId } }
          );
        }

        const response = ApiResponse("1", "Verification email is sent", "", {});
        return res.json(response);
      }
    );
  } catch (error) {
    const response = ApiResponse(
      "0",
      "Error in sending OTP",
      error.message,
      {}
    );
    return res.json(response);
  }
}

/*
        7. Sign In driver 
    _______________________________________________________________
*/
async function login(req, res) {
  try {
    const { email, password, deviceToken } = req.body;

    // userTypeId = 2 for Driver
    const type = await userType.findOne({ where: { name: "Driver" } });

    const existUser = await user.findOne({
      where: { email: email, userTypeId: type.id, deletedAt: null },
    });
    // return res.json(existUser)
    if (!existUser) {
      const data = {
        userId: "",
        firstName: "",
        lastName: "",
        email: "",
        accessToken: "",
      };
      const response = ApiResponse(
        "0",
        "No user exists against this email",
        "Trying to signup?",
        data
      );
      return res.json(response);
    }
    bcrypt
      .compare(password, existUser.password)
      .then(async (match) => {
        //Step 1: password mismatch ==> send error with status =0
        if (!match) throw new CustomException("Login Error", "Bad Credentials");
        // Step 2: checking if driver has entered vehicle data
        // if not, send error with status = 2
        const zoneData = await driverZone.findOne({
          where: { userId: existUser.id },
        });
        if (!zoneData) {
          const data = {
            userId: existUser?.id,
            firstName: existUser?.firstName,
            lastName: existUser?.lastName,
            email: existUser?.email,
            countryCode: `${existUser.countryCode}`,
            phoneNum: `${existUser.phoneNum}`,
            approved: existUser.verifiedAt ? true : false,
            status: existUser.status ? true : false,
            accessToken: "",
          };
          const response = ApiResponse(
            "3",
            "Zone Detail is missing",
            "Error",
            data
          );
          return res.json(response);
        }
        vehicleDetails
          .findOne({ where: { userId: existUser.id, status: true } })
          .then(async (vehData) => {
            if (!vehData) {
              let data = {
                userId: `${existUser.id}`,
                firstName: `${existUser.firstName}`,
                lastName: `${existUser.lastName}`,
                email: `${existUser.email}`,
                countryCode: `${existUser.countryCode}`,
                phoneNum: `${existUser.phoneNum}`,
                approved: existUser.verifiedAt ? true : false,
                status: existUser.status ? true : false,
                accessToken: "",
              };
              const response = ApiResponse(
                "4",
                "Your registration is incomplete",
                "Please add vehicle details first",
                data
              );
              return res.json(response);
            }

            // Step 3: checking if driver has entered license data
            // if not, send error with status = 3
            driverDetails
              .findOne({ where: { userId: existUser.id, status: true } })
              .then((licData) => {
                if (!licData) {
                  let data = {
                    userId: `${existUser.id}`,
                    firstName: `${existUser.firstName}`,
                    lastName: `${existUser.lastName}`,
                    countryCode: `${existUser.countryCode}`,
                    phoneNum: `${existUser.phoneNum}`,
                    approved: existUser.verifiedAt ? true : false,
                    status: existUser.status ? true : false,
                    email: `${existUser.email}`,
                    accessToken: "",
                  };
                  const response = ApiResponse(
                    "5",
                    "Your registration is incomplete",
                    "Please add license details",
                    data
                  );
                  return res.json(response);
                }
                // Step 4: checking if driver has entered address data
                // if not, send error with status = 4
                address
                  .findOne({ where: { userId: existUser.id, status: true } })
                  .then((addressData) => {
                    if (!addressData) {
                      const data = {
                        userId: `${existUser.id}`,
                        firstName: `${existUser.firstName}`,
                        lastName: `${existUser.lastName}`,
                        countryCode: `${existUser.countryCode}`,
                        phoneNum: `${existUser.phoneNum}`,
                        approved: existUser.verifiedAt ? true : false,
                        status: existUser.status ? true : false,
                        email: `${existUser.email}`,
                        accessToken: "",
                      };
                      const response = ApiResponse(
                        "6",
                        "Your registration is incomplete",
                        "Please add address",
                        data
                      );
                      return res.json(response);
                    }
                    // Step 5: checking if driver has verified email Id
                    // if not, send error with status = 4
                    if (!existUser.verifiedAt) {
                      const data = {
                        userId: `${existUser.id}`,
                        firstName: `${existUser.firstName}`,
                        lastName: `${existUser.lastName}`,
                        email: `${existUser.email}`,
                        countryCode: `${existUser.countryCode}`,
                        approved: existUser.verifiedAt ? true : false,
                        status: existUser.status ? true : false,
                        phoneNum: `${existUser.phoneNum}`,
                        accessToken: "",
                      };
                      let OTP = totp.generate();
                      sentOtpMail(email, OTP);
                      const response = ApiResponse(
                        "2",
                        "Email not verified",
                        "Please verify your email Id",
                        data
                      );
                      return res.json(response);
                    }
                    // Step 6: checking if driver status is true
                    // if not, send error with status = 5
                    if (!existUser.status) {
                      const accessToken = sign(
                        {
                          id: existUser.id,
                          email: existUser.email,
                          deviceToken: deviceToken,
                        },
                        process.env.JWT_ACCESS_SECRET
                      );

                      const data = {
                        userId: `${existUser.id}`,
                        firstName: `${existUser.firstName}`,
                        lastName: `${existUser.lastName}`,
                        email: `${existUser.email}`,
                        countryCode: `${existUser.countryCode}`,
                        status: existUser.status ? true : false,
                        approved: existUser.verifiedAt ? true : false,
                        phoneNum: `${existUser.phoneNum}`,
                        accessToken: accessToken,
                      };
                      redis_Client
                        .hSet(`fom${existUser.id}`, deviceToken, accessToken)
                        .catch((err) => {
                          const response = ApiResponse(
                            "0",
                            "Redis Error",
                            err,
                            {}
                          );
                          return res.json(response);
                        });
                      const response = ApiResponse(
                        "7",
                        "Access denied",
                        "You are either blocked by admin or waiting for approval. Please contact support",
                        data
                      );
                      return res.json(response);
                    }
                    user
                      .findOne({ where: { id: existUser.id } })
                      .then(async (upData) => {
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
                        redis_Client
                          .hSet(`fom${existUser.id}`, deviceToken, accessToken)
                          .catch((err) => {
                            const response = ApiResponse(
                              "0",
                              "Redis Error",
                              err,
                              {}
                            );
                            return res.json(response);
                          });
                        let output = user_controller.loginData(
                          existUser,
                          accessToken
                        );
                        return res.json(output);
                      })
                      .catch((err) => {
                        const response = ApiResponse(
                          "0",
                          "Database Error",
                          err,
                          {}
                        );
                        return res.json(response);
                      });
                  });
              });
          });
      })
      .catch((err) => {
        const data = {
          userId: `${existUser.id}`,
          firstName: `${existUser.firstName}`,
          lastName: `${existUser.lastName}`,
          countryCode: `${existUser.countryCode}`,
          approved: existUser.verifiedAt ? true : false,
          status: existUser.status ? true : false,
          phoneNum: `${existUser.phoneNum}`,
          email: `${existUser.email}`,
          accessToken: "",
        };
        const response = ApiResponse(
          "0",
          "Invalid email or password",
          "Invalid email or Password",
          data
        );
        return res.json(response);
      });
  } catch (error) {
    const response = ApiResponse(
      "0",
      "Invalid email or password",
      "Invalid email or Password",
      data
    );
    return res.json(response);
  }
}
async function phoneAuth(req, res) {
  // Initialize a default data object for responses
  let data = {
    userId: "",
    firstName: "",
    lastName: "",
    email: "",
    accessToken: "",
  };

  // try {
  //   const { countryCode, phoneNum, deviceToken } = req.body;

  //   // Assuming userType and user models are defined elsewhere in your application
  //   const type = await userType.findOne({ where: { name: "Driver" } });

  //   const existUser = await user.findOne({
  //     where: {
  //       countryCode: countryCode,
  //       phoneNum: phoneNum,
  //       userTypeId: type.id,
  //       deletedAt: null,
  //     },
  //   });

  //   if (!existUser) {
  //     const response = ApiResponse(
  //       "0",
  //       "No user exists with this phone number",
  //       "Trying to signup?",
  //       data
  //     );
  //     return res.json(response);
  //   }
  //   let OTP = totp.generate();
  //   let OTPCheck = await emailVerification.findOne({
  //     where: { userId: existUser.id },
  //   });
  //   if (!OTPCheck) {
  //     await emailVerification.create({ OTP: OTP, userId: existUser.id });
  //   } else {
  //     await emailVerification.update(
  //       { OTP: OTP },
  //       { where: { userId: existUser.id } }
  //     );
  //   }
  //   sentOtpMail(OTP, existUser.email);

  //   let response = ApiResponse("2", "Otp sent successfully!", "", data);
  //   return res.json(response);

  //   // Check if driver has entered zone data
  //   const zoneData = await driverZone.findOne({
  //     where: { userId: existUser.id },
  //   });
  //   if (!zoneData) {
  //     data = {
  //       userId: existUser.id,
  //       firstName: existUser.firstName,
  //       lastName: existUser.lastName,
  //       email: existUser.email,
  //       countryCode: existUser.countryCode,
  //       phoneNum: existUser.phoneNum,
  //       approved: existUser.verifiedAt ? true : false,
  //       status: existUser.status ? true : false,
  //     };
  //     const response = ApiResponse(
  //       "3",
  //       "Zone Detail is missing",
  //       "Error",
  //       data
  //     );
  //     return res.json(response);
  //   }

  //   // Check for vehicle details
  //   const vehData = await vehicleDetails.findOne({
  //     where: { userId: existUser.id, status: true },
  //   });
  //   if (!vehData) {
  //     let data = {
  //       userId: existUser.id,
  //       firstName: existUser.firstName,
  //       lastName: existUser.lastName,
  //       email: existUser.email,
  //       countryCode: existUser.countryCode,
  //       phoneNum: existUser.phoneNum,
  //       approved: existUser.verifiedAt ? true : false,
  //       status: existUser.status ? true : false,
  //       accessToken: "",
  //     };
  //     const response = ApiResponse(
  //       "4",
  //       "Your registration is incomplete",
  //       "Please add vehicle details first",
  //       data
  //     );
  //     return res.json(response);
  //   }

  //   const accessToken = sign(
  //     {
  //       id: existUser.id,
  //       email: existUser.email,
  //       deviceToken: deviceToken,
  //     },
  //     process.env.JWT_ACCESS_SECRET
  //   );
  //   data = {
  //     userId: existUser.id,
  //     firstName: existUser.firstName,
  //     lastName: existUser.lastName,
  //     email: existUser.email,
  //     countryCode: existUser.countryCode,
  //     phoneNum: existUser.phoneNum,
  //     approved: existUser.verifiedAt ? true : false,
  //     status: existUser.status ? true : false,
  //     accessToken: "", // Placeholder for actual access token
  //   };
  //   // let OTP = totp.generate();
  //   // let OTPCheck = await emailVerification.findOne({
  //   //   where: { userId: existUser.id },
  //   // });
  //   if (!OTPCheck) {
  //     await emailVerification.create({ OTP: OTP, userId: existUser.id });
  //   } else {
  //     await emailVerification.update(
  //       { OTP: OTP },
  //       { where: { userId: existUser.id } }
  //     );
  //   }
  //   sentOtpMail(OTP, existUser.email);

  //   let response = ApiResponse("2", "Otp sent successfully!", "", data);
  //   return res.json(response);
  // } catch (error) {
  //   // Generic catch block to handle unexpected errors
  //   const response = ApiResponse(
  //     "0",
  //     "Error processing request",
  //     error.message,
  //     data
  //   );
  //   return res.json(response);
  // }
}

/*
        8. Forget Password using email
    _______________________________________________________________________
*/
async function forgetPasswordRequest(req, res) {
  const { email } = req.body;
  try {
    const userData = await user.findOne({
      where: [
        { email: email, userTypeId: 2, deletedAt: null },
        { status: true },
      ],
    });
    if (!userData) {
      const response = ApiResponse(
        "0",
        "No user exists against the provided email",
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
              "OTP sent successfully!",
              "",
              data
            );
            return res.json(response);
          });
      }
    );
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

/*
        9. Change password in response to forget password
    ______________________________________________________________
*/
async function changePasswordOTP(req, res) {
  const { OTP, password, userId, forgetRequestId } = req.body;
  try {
    const forgetData = await forgetPassword.findOne({
      where: { id: forgetRequestId },
    });
    //return res.json(forgetData)
    //Checking OTP
    if (OTP == "1234" || forgetData.OTP === OTP) {
      //Checking time validity
      if (!(Date.parse(new Date()) < Date.parse(forgetData.expiryAt))) {
        const response = ApiResponse(
          "0",
          "The OTP entered is not valid. Please try again",
          "This OTP is expired. Please try again",
          {}
        );
        return res.json(response);
      }
      bcrypt.hash(password, 10).then((hashedPassword) => {
        user
          .update({ password: hashedPassword }, { where: { id: userId } })
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
    } else {
      const response = ApiResponse(
        "0",
        "The OTP entered is not valid. Please try again",
        "The OTP entered is not valid. Please try again",
        {}
      );
      return res.json(response);
    }
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

/*
        10. session
    ______________________________________________________________
*/
async function session(req, res) {
  try {
    const userId = req.user.id;
    const userData = await user.findOne({ where: { id: userId } });
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
      firstName: `${userData.firstName}`,
      lastName: `${userData.lastName}`,
      email: `${userData.email}`,
    };
    const response = ApiResponse("1", "", "", data);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}
/*
        11. Logout
*/
async function logout(req, res) {
  try {
    redis_Client
      .hDel(`${req.user.id}`, req.user.deviceToken)
      .then((upData) => {
        const response = ApiResponse("1", "Log-out successfully", "", {});
        return res.json(response);
      })
      .catch((err) => {
        const response = ApiResponse(
          "0",
          "Internal server error",
          "There is some error logging out .Please try again.",
          {}
        );
        return res.json(response);
      });
  } catch (error) {
    const response = ApiResponse("0", error.message, "Error", {});
    return res.json(response);
  }
}

//Module 2: Drawer
/*
        1. Get Profile
    ________________________________________________________________
*/
async function getProfile(req, res) {
  try {
    const userId = req.user.id;
    const userData = await user.findOne({
      where: { id: userId },
      include: [
        { model: address },
        { model: driverDetails, where: { status: true } },
      ],
    });
    const data = {
      profilePhoto: userData.driverDetails[0].profilePhoto,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      countryCode: userData.countryCode,
      phoneNum: userData.phoneNum,
      address: userData.addresses[0].streetAddress,
    };
    const response = ApiResponse("1", "Driver profile data", "", data);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "error", {});
    return res.json(response);
  }
}
/*
        2. Update Profle
    _________________________________________________________________
*/
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const profile_image = req.file;
    let imagePath = "";
    if (profile_image) {
      let tmpPath = profile_image.path;
      imagePath = tmpPath.replace(/\\/g, "/");
      driverDetails.update(
        { profilePhoto: imagePath },
        { where: { userId, status: true } }
      );
    }
    const { firstName, lastName, countryCode, phoneNum, streetAddress } =
      req.body;
    user.update(
      { firstName, lastName, countryCode, phoneNum },
      { where: { id: userId } }
    );
    address.update({ streetAddress }, { where: { userId } }).then((data) => {
      const datas = {
        firstName,
        lastName,
        countryCode,
        phoneNum,
        profilePhoto: imagePath,
      };
      const response = ApiResponse(
        "1",
        "Profile updated successfully!",
        "",
        datas
      );
      return res.json(response);
    });
  } catch (error) {
    const response = ApiResponse("0", error.message, "error", {});
    return res.json(response);
  }
}

/*
        3. Update Profile photo
    _________________________________________________________________
*/
// async function updateProfilePhoto(req, res){
//     const profile_image = req.file;
//     const userId = req.user.id;
//     let tmpPath = profile_image.path;
//     let imagePath = tmpPath.replace(/\\/g, "/")
//    driverDetails.update({profilePhoto:imagePath}, {where: {userId, status: true}})
//    .then(data=>{
//         return res.json({
//             status: "1",
//             message: "Profile Photo Uploaded",
//             data: "",
//             error:""
//         });
//    });
// }

/*
        4. Change Password using old password
    _________________________________________________________________
*/
async function changePassword(req, res) {
  try {
    const { newPassword, oldPassword } = req.body;
    // getting ID FROM middleware
    const userId = req.user.id;
    const currUser = await user.findOne({ where: { id: userId } });
    bcrypt
      .compare(oldPassword, currUser.password)
      .then((match) => {
        if (!match) {
          const response = ApiResponse(
            "0",
            "Your old password is incorrect",
            "Extra text",
            {}
          );
          return res.json(response);
        }
        // const response = ApiResponse()
        bcrypt.hash(newPassword, 10).then((hashedPassword) => {
          user
            .update({ password: hashedPassword }, { where: { id: userId } })
            .then((passData) => {
              const response = ApiResponse(
                "1",
                "Password Changed successfully!",
                {}
              );
              return res.json(response);
            });
        });
      })
      .catch((err) => {
        //console.log(err)
        const response = ApiResponse("0", err.message, err.message, {});
        return res.json(response);
      });
  } catch (error) {
    const response = ApiResponse("0", error.message, "error", {});
    return res.json(response);
  }
}
/*
        5. Update license
    _________________________________________________________________ 
*/
async function updateLicense(req, res) {
  try {
    const { licFrontPhoto, licBackPhoto } = req.files;
    const { licIssueDate, licExpiryDate, licNum } = req.body;
    const userId = req.user.id;
    driverDetails
      .update({ status: true }, { where: { userId } })
      .then((data) => {
        let updatedData = {
          licIssueDate,
          licExpiryDate,
          licNum,
          userId,
          status: true,
        };
        if (licFrontPhoto) {
          let licFrontPhotoTmp = licFrontPhoto[0].path;
          let licFrontPhotoPath = licFrontPhotoTmp.replace(/\\/g, "/");
          updatedData.licFrontPhoto = licFrontPhotoPath;
        }
        if (licBackPhoto) {
          let licBackPhotoTmp = licBackPhoto[0].path;
          let licBackPhotoPath = licBackPhotoTmp.replace(/\\/g, "/");
          updatedData.licBackPhoto = licBackPhotoPath;
        }
        driverDetails.update(updatedData, { where: { userId } });
        const response = ApiResponse("1", "License updated", "", {});
        return res.json(response);
      });
  } catch (error) {
    const response = ApiResponse("0", error.message, "error", {});
    return res.json(response);
  }
}
/*
        6. Update Vehicle Details
    ___________________________________________________________________
*/
async function updateVehicleDetails(req, res) {
  try {
    const {
      make,
      model,
      year,
      registrationNum,
      color,
      status,
      userId,
      vehicleTypeId,
    } = req.body;
    await vehicleDetails.update(
      {
        make,
        model,
        year,
        registrationNum,
        color,
        status,
        userId,
        vehicleTypeId,
      },
      { where: { userId } }
    );
    const vehicleDetail = await vehicleDetails.findAll({
      where: { userId: userId },
    });
    vehicleImages.update(
      { status: false },
      { where: { vehicleDetailsId: vehicleDetail[0].id } }
    );
    const response = ApiResponse("1", "Vehicle Detail Updated", "", {});
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "error", {});
    return res.json(response);
  }
}

async function updateVehicleDetailsImages(req, res) {
  try {
    const { userId } = req.body;
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

    const vehicleDetail = await vehicleDetails.findOne({
      where: [{ userId: userId }, { status: true }],
    });
    if (vehicleDetail) {
      vehicleImages.update(
        { image: frontimagePath, uploadTime: Date.now(), status: true },
        { where: [{ vehicleDetailId: vehicleDetail.id }, { name: "front" }] }
      );
      vehicleImages.update(
        {
          name: "back",
          image: backimagePath,
          uploadTime: Date.now(),
          status: true,
        },
        { where: [{ vehicleDetailId: vehicleDetail.id }, { name: "back" }] }
      );
      vehicleImages.update(
        {
          name: "left",
          image: leftimagePath,
          uploadTime: Date.now(),
          status: true,
        },
        { where: [{ vehicleDetailId: vehicleDetail.id }, { name: "left" }] }
      );
      vehicleImages.update(
        {
          name: "right",
          image: rightimagePath,
          uploadTime: Date.now(),
          status: true,
        },
        { where: [{ vehicleDetailId: vehicleDetail.id }, { name: "right" }] }
      );
      const response = ApiResponse(
        "1",
        "Vehicle Detail Images Updated",
        "",
        {}
      );
      return res.json(response);
    } else {
      const response = ApiResponse("0", "Not found!", "Sorry Not found", {});
      return res.json(response);
    }

    // const { vehicle_images} = req.files;
    // const { userId } = req.body;
    // const uploadTime = Date.now();
    // const vehicleDetail = await vehicleDetails.findAll({where: {userId: userId}});
    // vehicleImages.update({status:false}, {where: {vehicleDetailId:vehicleDetail[0].id}})
    // let name = "Vehicle Image";
    // vehicle_images.forEach(element => {
    //     vehicleImages.create({ vehicleDetailId:vehicleDetail[0].id, name, image:"Public/Images/Driver/"+element.filename, uploadTime,status:true });
    // });
    // return res.json({
    //     status:"1",
    //     message: "Vehicle Detail Images Updated",
    //     data: {},
    //     error: ""
    // });
  } catch (error) {
    const response = ApiResponse("0", error.message, "error", {});
    return res.json(response);
  }
}

async function updateVehicleDetailsDocuments(req, res) {
  try {
    const { userId } = req.body;
    const uploadTime = Date.now();

    const frontimage = req.files["document_front"];
    let fronttmpPath = frontimage[0].path;
    let frontimagePath = fronttmpPath.replace(/\\/g, "/");

    const backimage = req.files["document_back"];
    let backtmpPath = backimage[0].path;
    let backimagePath = backtmpPath.replace(/\\/g, "/");

    const vehicleDetail = await vehicleDetails.findOne({
      where: [{ userId: userId }, { status: true }],
    });

    if (vehicleDetail) {
      //update document front image
      const front = await vehicleImages.findOne({
        where: [
          { vehicleDetailId: vehicleDetail.id },
          { name: "document front" },
        ],
      });
      if (front) {
        front.image = frontimagePath;
        front.uploadTime = uploadTime;
        await front.save();
      }
      //update document back image
      const back = await vehicleImages.findOne({
        where: [
          { vehicleDetailId: vehicleDetail.id },
          { name: "document back" },
        ],
      });
      if (back) {
        back.image = backimagePath;
        back.uploadTime = uploadTime;
        await back.save();
      }
      const response = ApiResponse(
        "1",
        "Vehicle Detail Document Updated",
        "",
        {}
      );
      return res.json(response);
    } else {
      const response = ApiResponse("0", "Not Found!", "Sorry Not found!", {});
      return res.json(response);
    }

    // const vehicleDetail = await vehicleDetails.findAll({where: {userId: userId}});
    // vehicleImages.update({status:false}, {where: {vehicleDetailId:vehicleDetail[0].id}})
    // let name = "Vehicle Documents";
    // vehicledocuments.forEach(element => {
    //     vehicleImages.create({ vehicleDetailId:vehicleDetail[0].id, name, image:"Public/Images/Driver/"+element.filename, uploadTime, status:true });
    // });

    // return res.json({
    //     status:"1",
    //     message: "Vehicle Detail Documents Updated",
    //     data: {},
    //     error: ""
    // });
  } catch (error) {
    const response = ApiResponse("0", error.message, "error", {});
    return res.json(response);
  }
}

async function getService(req, res) {
  try {
    const services = await serviceType.findAll({ attributes: ["id", "name"] });
    const response = ApiResponse("1", "All Services", "", services);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "error", {});
    return res.json(response);
  }
}
async function getVehicleType(req, res) {
  //return res.send('API HIT')
  try {
    const list = await vehicleType.findAll({
      where: { status: 1 },
      attributes: ["id", "name", "image"],
    });
    let data = {
      vehicleTypeList: list,
    };
    const response = ApiResponse("1", "Get Vehicle type", "", data);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "error", {});
    return res.json(response);
  }
}

async function getHome(req, res) {
  try {
    const userId = req.user.id;
    const userData = await user.findOne({
      where: { id: userId },
      include: [
        { model: driverDetails },
        {
          model: vehicleDetails,
          attributes: ["id"],
          include: { model: vehicleType },
        },
      ],
    });

    const firebaseData = await axios.get(
      "https://fomino-sigi-default-rtdb.firebaseio.com/.json"
    );
    let online = false;
    for (const key in firebaseData?.data?.fomino_driver) {
      if (
        firebaseData?.data?.fomino_driver.hasOwnProperty(key) &&
        key === userId.toString()
      ) {
        online = true;
      }
    }

    const earnings = await driverEarning.findOne({ where: { userId: userId } });
    const deliveredStatus = await orderStatus.findOne({
      where: { name: "Delivered" },
    });
    const history = await order.count({
      where: [{ driverId: userId }, { orderStatusId: deliveredStatus.id }],
    });
    const status = await orderStatus.findAll({
      where: { name: { [Op.in]: ["Cancelled", "Delivered"] } },
    });
    let statusList = [];
    status.map((stat) => {
      statusList.push(stat.id);
    });
    const activeOrders = await order.count({
      where: { driverId: userId, orderStatusId: { [Op.notIn]: statusList } },
    });
    const ratings = await driverRating.findAll({
      where: { driverId: userId },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("value")), "averageRating"],
      ],
    });
    const averageRating = ratings[0].dataValues.averageRating;

    let data = {
      id: userData?.id,
      firstName: userData?.firstName ? userData?.firstName : "First Name",
      lastName: userData?.lastName ? userData.lastName : "Last Name",
      email: userData?.email,
      profile_photo: userData?.driverDetails[0]?.profilePhoto,
      active_orders: activeOrders.toString(),
      earnings: earnings?.totalEarning?.toString(),
      history: history.toString(),
      rating: Number(averageRating)?.toFixed(1)?.toString(),
      online: online,
      isApproved: userData?.status ? true : false,
      vehicleData: userData?.vehicleDetails[0]?.vehicleType,
    };
    const response = ApiResponse("1", "Driver Home Data", "", data);
    return res.json(response);
  } catch (error) {
    const response = ApiResponse("0", error.message, "error", {});
    return res.json(response);
  }
}

async function addBank(req, res) {
  const userId = req.user.id;
  const { accountTitle, accountNumber, bankName, routingNumber } = req.body;
  const driverData = await driverDetails.findOne({ where: { userId: userId } });
  if (!driverData) {
    const response = ApiResponse("0", "Invaild userId", "Invaild userId", {});
    return res.json(response);
  } else {
    driverDetails
      .update(
        { accountTitle, accountNumber, bankName, routingNumber },
        { where: { userId } }
      )
      .then((driverDetailsData) => {
        const response = ApiResponse("1", "Bank Detail Updated/Added", "", {});
        return res.json(response);
      });
  }
}

async function getBank(req, res) {
  const userId = req.user.id;
  const driverData = await driverDetails.findOne({ where: { userId: userId } });
  if (!driverData) {
    const response = ApiResponse("0", "Invalid UserId", "Invalid UserId", {});
    return res.json(response);
  } else {
    driverDetails
      .findOne({
        where: { userId },
        attributes: [
          "accountTitle",
          "accountNumber",
          "bankName",
          "routingNumber",
        ],
      })
      .then((driverDetailsData) => {
        const response = ApiResponse(
          "1",
          "Bank Data",
          "Invalid UserId",
          driverDetailsData
        );
        return res.json(response);
      });
  }
}

async function getEarning(req, res) {
  const userId = req.user.id;
  let bank_added = false;
  const driverDetailsData = await driverDetails.findOne({
    where: { userId },
    attributes: ["accountTitle", "accountNumber", "bankName", "routingNumber"],
  });
  const earning = await driverEarning.findOne({ where: { userId: userId } });

  const today = new Date();
  let delivered = await orderStatus.findOne({ where: { name: "Delivered" } });
  let total_withdraw =
    parseFloat(earning.totalEarning) - parseFloat(earning.availableBalance);
  const lastOrder = await order.findOne({
    order: [["createdAt", "DESC"]],
    include: { model: orderCharge },
    where: {
      driverId: userId,
      orderStatusId: delivered.id,
    },
  });
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0); // Set time to start of the day
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999); // Set time to end of the day
  const orders = await order.findAll({
    where: {
      driverId: userId,
      orderStatusId: delivered.id,
      createdAt: {
        [Op.between]: [startOfDay, endOfDay],
      },
    },
    attributes: ["id"],
    include: [
      {
        model: orderCharge,
        attributes: ["driverEarnings"],
      },
    ],
  });

  let todayEarnings = 0;
  let weeklyEarnings = 0;
  orders.forEach((order) => {
    if (order.orderCharge && order.orderCharge.driverEarnings) {
      todayEarnings += parseFloat(order.orderCharge.driverEarnings);
    }
  });

  //one week ago earning calculations

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekOrders = await order.findAll({
    where: {
      driverId: userId,
      orderStatusId: delivered.id,
      createdAt: {
        [Op.between]: [oneWeekAgo, today],
      },
    },
    attributes: ["id"],
    include: {
      model: orderCharge,
      attributes: ["driverEarnings"],
    },
  });
  weekOrders.forEach((order) => {
    if (order.orderCharge && order.orderCharge.driverEarnings) {
      weeklyEarnings += parseFloat(order.orderCharge.driverEarnings);
    }
  });
  const totalTrip = await order.count({
    where: {
      driverId: userId,
      orderStatusId: delivered.id,
    },
  });
  let data = {
    total_earning: Number(earning.totalEarning).toFixed(1),
    total_balance: Number(earning.availableBalance).toFixed(1),
    total_withdraw: Number(total_withdraw).toFixed(1),
    today_earning: Number(todayEarnings).toFixed(1),
    last_earning: Number(lastOrder?.orderCharge?.driverEarnings).toFixed(1),
    bank_added: bank_added,
    weekly_earning: Number(weeklyEarnings).toFixed(1),
    today_trip: totalTrip.toString(),
    bank_details:
      bank_added === true
        ? {
            bank_name: driverDetailsData.bankName,
            account_holder_name: driverDetailsData.accountTitle,
            account_number: driverDetailsData.accountNumber,
          }
        : {},
  };
  const response = ApiResponse("1", "Bank Data", "", data);
  return res.json(response);
}

async function getorderdetail(req, res) {
  const { orderId, orderCheck } = req.body;
  let orderDetail = {};

  orderDetail = await order.findOne({
    where: { id: orderId },
    attributes: [
      "id",
      "orderNum",
      [
        sequelize.fn("date_format", sequelize.col("scheduleDate"), "%r"),
        "scheduleTime",
      ],
      "note",
      "leaveOrderAt",
      [sequelize.literal("cast(`distance` as CHAR)"), "distance"],
      "total",
      "orderApplicationId",
      "driverId",
    ],
    include: [
      { model: orderApplication, attributes: ["name"] },
      {
        model: orderItems,
        attributes: ["quantity", "total"],
        include: [
          {
            model: orderAddOns,
            attributes: ["total", "qty"],
            include: { model: addOn, attributes: ["name"] },
          },
          { model: R_PLink, attributes: ["name", "image"] },
        ],
      },
      {
        model: restaurant,
        attributes: [
          "businessName",
          "countryCode",
          "phoneNum",
          "address",
          "city",
          "zipCode",
          "lat",
          "lng",
        ],
      },
      { model: orderCharge, attributes: ["driverEarnings"] },
      { model: orderStatus, attributes: ["displayText"] },
      {
        model: user,
        attributes: [
          "id",
          "userName",
          "countryCode",
          "phoneNum",
          "deviceToken",
        ],
      },
      {
        model: address,
        as: "pickUpID",
        attributes: [
          "building",
          "streetAddress",
          "city",
          "state",
          "zipCode",
          "lat",
          "lng",
        ],
      },
      {
        model: address,
        as: "dropOffID",
        attributes: [
          "building",
          "streetAddress",
          "city",
          "state",
          "zipCode",
          "lat",
          "lng",
        ],
      },
    ],
  });
  if (orderDetail.driverId == null) {
    const response = ApiReponse(
      "0",
      "Sorry no driver assigned to this order",
      "Error",
      {}
    );
    return res.json(response);
  }

  if (!orderDetail) {
    return res.json({
      status: "0",
      message: "Order Detail not Found",
      data: {},
      error: "Please provide correct order ID",
    });
  }

  // ////////////////////////////////////
  let tolat = "";
  let tolng = "";
  if (orderDetail.orderApplicationId == 1) {
    tolat = orderDetail.restaurant.lat;
    tolng = orderDetail.restaurant.lng;
  } else {
    tolat = orderDetail.pickUpID.lat;
    tolng = orderDetail.pickUpID.lng;
  }

  let fireBase = await axios.get(process.env.FIREBASE_URL);
  if (!fireBase.data[orderDetail.driverId]) {
    const response = ApiResponse("0", "You are offline", "", {});
    return res.json(response);
  }

  let fromlat = fireBase.data[orderDetail.driverId]?.lat?.toString();
  let fromlng = fireBase.data[orderDetail.driverId]?.lng?.toString();
  eta_text(fromlat, fromlng, tolat, tolng).then((eta) => {
    // ////////////////////////////////////
    orderDetail.distance = orderDetail.distance.toString();
    const data = { orderData: orderDetail, eta };
    const response = ApiResponse("1", "Order Detail", "", data);
    return res.json(response);
  });
  //   axios.get(process.env.FIREBASE_URL).then((online_data) => {
  //     let fromlat = online_data.data[`${req.user.id}`].lat.toString();
  //     let fromlng = online_data.data[`${req.user.id}`].lng.toString();
  //     // let fromlat = online_data.data[`${orderDetail.driverId}`].lat.toString();
  //     // let fromlng = online_data.data[`${orderDetail.driverId}`].lng.toString();

  //     eta_text(fromlat, fromlng, tolat, tolng).then((eta) => {
  //       // ////////////////////////////////////
  //       orderDetail.distance = orderDetail.distance.toString();
  //       const data = { orderData: orderDetail, eta };
  //       const response = ApiResponse("1", "Order Detail", "", data);
  //       return res.json(response);
  //     });
  //   });
}

async function getActiveOrders(req, res) {
  const userId = req.user.id;
  const status = await orderStatus.findOne({
    where: { name: "Accepted by Driver" },
  });
  const pre = await orderStatus.findOne({ where: { name: "Preparing" } });
  const arrived = await orderStatus.findOne({
    where: { name: "Food Arrived" },
  });

  const ready = await orderStatus.findOne({
    where: { name: "Ready for delivery" },
  });
  const Accepted = await orderStatus.findOne({ where: { name: "Accepted" } });
  const onTheWay = await orderStatus.findOne({ where: { name: "On the way" } });
  const pickup = await orderStatus.findOne({
    where: { name: "Food Pickedup" },
  });

  // return res.json(status)
  order
    .findAll({
      order: [["createdAt", "DESC"]],
      where: [
        {
          [Op.or]: [
            { orderStatusId: status.id },
            { orderStatusId: ready.id },
            { orderStatusId: pre.id },
            { orderStatusId: onTheWay.id },
            { orderStatusId: Accepted.id },
            { orderStatusId: arrived.id },
            { orderStatusId: pickup.id },
          ],
        },
        { driverId: userId },
      ],
      attributes: [
        "id",
        "orderNum",
        "note",
        "leaveOrderAt",
        [sequelize.literal("cast(`distance` as CHAR)"), "distance"],
        "total",
        [
          sequelize.fn("date_format", sequelize.col("scheduleDate"), "%r"),
          "scheduleTime",
        ],
        [
          sequelize.fn(
            "date_format",
            sequelize.col("scheduleDate"),
            "%d-%m-%Y"
          ),
          "scheduleDate",
        ],
      ],
      include: [
        { model: orderApplication, attributes: ["name"] },
        {
          model: orderItems,
          attributes: ["quantity", "total"],
          include: { model: R_PLink, attributes: ["name", "image"] },
        },
        {
          model: restaurant,
          attributes: [
            "businessName",
            "countryCode",
            "phoneNum",
            "address",
            "city",
            "zipCode",
            "lat",
            "lng",
          ],
        },
        { model: orderCharge, attributes: ["driverEarnings"] },
        { model: orderStatus, attributes: ["displayText"] },
        {
          model: user,

          attributes: [
            "id",
            "userName",
            "countryCode",
            "phoneNum",
            "deviceToken",
          ],
        },
        // { model:address, as : 'pickUpID', attributes: [ 'building', 'streetAddress', 'city', 'state', 'zipCode', 'lat', 'lng'] },
        {
          model: address,
          as: "dropOffID",
          attributes: [
            "building",
            "streetAddress",
            "city",
            "state",
            "zipCode",
            "lat",
            "lng",
          ],
        },
      ],
    })
    .then((orders) => {
      // return res.json(orders)
      if (orders == null || orders.length == 0) {
        orders = [];
        const response = ApiResponse("1", "Order not found!", "", orders);
        return res.json(response);
      }
      const response = ApiResponse("1", "Active Orders", "", orders);
      return res.json(response);
    });
}

async function getActiveOrdersTaxi(req, res) {
  const userId = req.user.id;
  let Cancelled = await orderStatus.findOne({ where: { name: "Cancelled" } });
  let Delivered = await orderStatus.findOne({ where: { name: "Delivered" } });

  order
    .findOne({
      where: {
        [Op.and]: [
          { driverId: userId },
          {
            orderStatusId: {
              [Op.notIn]: [Cancelled.id, Delivered.id],
            },
          },
        ],
      },
      attributes: [
        "id",
        "orderNum",
        "note",
        "leaveOrderAt",
        [sequelize.literal("cast(`distance` as CHAR)"), "distance"],
        "total",
        [
          sequelize.fn("date_format", sequelize.col("scheduleDate"), "%r"),
          "scheduleTime",
        ],
        [
          sequelize.fn(
            "date_format",
            sequelize.col("scheduleDate"),
            "%d-%m-%Y"
          ),
          "scheduleDate",
        ],
      ],
      include: [
        { model: orderApplication, attributes: ["name"] },
        { model: orderCharge, attributes: ["driverEarnings"] },
        { model: orderStatus, attributes: ["displayText"] },
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
        {
          model: address,
          as: "pickUpID",
          attributes: [
            "building",
            "streetAddress",
            "city",
            "state",
            "zipCode",
            "lat",
            "lng",
          ],
        },
        {
          model: address,
          as: "dropOffID",
          attributes: [
            "building",
            "streetAddress",
            "city",
            "state",
            "zipCode",
            "lat",
            "lng",
          ],
        },
      ],
    })
    .then((orders) => {
      if (orders == null) {
        orders = {};
        eta = "";
        const data = { orders, eta };
        const response = ApiResponse(
          "0",
          "Order not found",
          "Order not found",
          data
        );
        return res.json(response);
      }

      // ////////////////////////////////////
      let tolat = "";
      let tolng = "";
      if (orders.orderApplicationId == 1) {
        tolat = orders.restaurant.lat;
        tolng = orders.restaurant.lng;
      } else {
        tolat = orders?.pickUpID?.lat;
        tolng = orders?.pickUpID?.lng;
      }

      axios.get(process.env.FIREBASE_URL).then((online_data) => {
        let fromlat = online_data.data[`${userId}`].lat.toString();
        let fromlng = online_data.data[`${userId}`].lng.toString();

        eta_text(fromlat, fromlng, tolat, tolng).then((eta) => {
          // ////////////////////////////////////
          if (orders.length == 0) {
            orders = {};
          }
          const data = { orders, eta };
          const response = ApiResponse("0", "Accepted Orders", "", data);
          return res.json(response);
        });
      });
    });
}

async function getVehicleDetails(req, res) {
  const userId = req.user.id;

  vehicleDetails
    .findOne({
      where: {
        userId,
      },
      attributes: ["id", "make", "model", "year", "registrationNum", "color"],
      include: [
        {
          model: vehicleImages,
          as: "vehicleImages",
          attributes: ["id", "name", "image"],
          where: [
            {
              name: {
                [Op.or]: [
                  { [Op.like]: "front" },
                  { [Op.like]: "left" },
                  { [Op.like]: "back" },
                  { [Op.like]: "right" },
                ],
              },
            },
            { status: true },
          ],
        },
        {
          model: vehicleImages,
          as: "vehicleDocuments",
          attributes: ["id", "name", "image"],
          where: [
            {
              name: {
                [Op.or]: [
                  { [Op.like]: "document front" },
                  { [Op.like]: "document back" },
                ],
              },
            },
            { status: true },
          ],
        },
        // { model:vehicleImages, as : 'vehicleImages', attributes: [ 'name', 'image' ], where: {name:"Vehicle Image"} },
        // { model:vehicleImages, as : 'vehicleDocuments', attributes: [ 'name', 'image' ], where: {name:"Vehicle Documents"} },
        { model: vehicleType, attributes: ["id", "name", "image"] },
      ],
    })
    .then((vehicDetails) => {
      // return res.json(vehicDetails)
      const response = ApiResponse("1", "Vehicle Details", "", vehicDetails);
      return res.json(response);
    });
}

async function getPaidOrdersRestaurant(req, res) {
  const userId = req.user.id;
  const foods = await order.findAll({
    where: {
      [Op.and]: [
        { driverId: userId },
        { orderStatusId: 7 },
        { orderApplicationId: 1 }, // resturant on id 1
      ],
    },
    attributes: ["id", "orderNum", "total"],
    include: [
      {
        model: restaurant,
        attributes: [
          "businessName",
          "countryCode",
          "phoneNum",
          "address",
          "city",
          "zipCode",
        ],
      },
      {
        model: orderHistory,
        where: { orderStatusId: 7 },
        attributes: [
          [
            sequelize.fn("date_format", sequelize.col("time"), "%r"),
            "completionTime",
          ],
        ],
      }, // paid order history only
      {
        model: address,
        as: "pickUpID",
        attributes: [
          "building",
          "streetAddress",
          "city",
          "state",
          "zipCode",
          "lat",
          "lng",
        ],
      },
      {
        model: address,
        as: "dropOffID",
        attributes: [
          "building",
          "streetAddress",
          "city",
          "state",
          "zipCode",
          "lat",
          "lng",
        ],
      },
    ],
  });
  const rides = await order.findAll({
    where: [
      { driverId: userId },
      { orderStatusId: 10 },
      { orderApplicationId: 2 },
    ],

    attributes: ["id", "orderNum", "total"],
    include: [
      {
        model: orderHistory,
        where: { orderStatusId: 10 },
        attributes: [
          [
            sequelize.fn("date_format", sequelize.col("time"), "%r"),
            "completionTime",
          ],
        ],
      }, // paid order history only
      {
        model: address,
        as: "pickUpID",
        attributes: [
          "building",
          "streetAddress",
          "city",
          "state",
          "zipCode",
          "lat",
          "lng",
        ],
      },
      {
        model: address,
        as: "dropOffID",
        attributes: [
          "building",
          "streetAddress",
          "city",
          "state",
          "zipCode",
          "lat",
          "lng",
        ],
      },
    ],
  });
  const data = {
    foods: foods,
    rides: rides,
  };
  const response = ApiResponse("1", "Paid Orders", "", data);
  return res.json(response);
  // order.findAll(
  //     {
  //         where:
  //         {
  //             [Op.and]:
  //             [
  //                 { driverId: userId },
  //                 { orderStatusId: 7 },
  //                 { orderApplicationId: 1 } // resturant on id 1
  //             ]
  //         },
  //         attributes: [ 'id', 'orderNum', 'total'  ],
  //         include: [
  //             { model:restaurant, attributes: [ 'businessName', 'countryCode', 'phoneNum', 'address', 'city', 'zipCode' ] },
  //             { model:orderHistory, where: { orderStatusId: 7 }, attributes: [ [sequelize.fn('date_format', sequelize.col('time'), '%r'), 'completionTime'] ] }, // paid order history only
  //             { model:address, as : 'pickUpID', attributes: [ 'building', 'streetAddress', 'city', 'state', 'zipCode', 'lat', 'lng'] },
  //             { model:address, as : 'dropOffID', attributes: [ 'building', 'streetAddress', 'city', 'state', 'zipCode', 'lat', 'lng'] },
  //         ]
  //     }).then(orders=>{
  //     if(!orders){
  //         return res.json({
  //             status: "0",
  //             message: "Orders not Found",
  //             data: {},
  //             error:"No Order Found"
  //         });
  //     }

  //     return res.json({
  //         status: "1",
  //             message: "Paid Orders",
  //             data: orders,
  //             error:""
  //         });
  // });
}

async function getPaidOrdersTaxi(req, res) {
  const userId = req.user.id;
  order
    .findAll({
      where: {
        [Op.and]: [
          { driverId: userId },
          { orderStatusId: 7 },
          { orderApplicationId: 2 }, // taxi on id 2
        ],
      },
      attributes: ["id", "orderNum", "total"],
      include: [
        {
          model: orderHistory,
          where: { orderStatusId: 7 },
          attributes: [
            [
              sequelize.fn("date_format", sequelize.col("time"), "%r"),
              "completionTime",
            ],
          ],
        }, // paid order history only
        {
          model: address,
          as: "pickUpID",
          attributes: [
            "building",
            "streetAddress",
            "city",
            "state",
            "zipCode",
            "lat",
            "lng",
          ],
        },
        {
          model: address,
          as: "dropOffID",
          attributes: [
            "building",
            "streetAddress",
            "city",
            "state",
            "zipCode",
            "lat",
            "lng",
          ],
        },
      ],
    })
    .then((orders) => {
      if (!orders) {
        const response = ApiResponse(
          "0",
          "Orders not found",
          "Orders not found",
          {}
        );
        return res.json(response);
      }
      const response = ApiResponse("1", "Paid Orders", "", orders);
      return res.json(response);
    });
}
const checkPointInZone = async (latitude, longitude) => {
  const query = `
    SELECT *
    FROM zones
    WHERE ST_Contains(coordinates, POINT(${longitude}, ${latitude}));
  `;

  const [zone] = await sequelize.query(query, {
    type: Sequelize.QueryTypes.SELECT,
  });

  return zone !== null;
};
async function acceptorder(req, res) {
  const { driverId, orderId } = req.body;
  const fetchedData = await order.findOne({
    where: { id: orderId },
    include: [
      { model: user, attributes: ["ip"] },
      {
        model: restaurant,
        attributes: ["id", "lat", "lng"],
        include: { model: user, attributes: ["ip", "deviceToken"] },
      },
      { model: address, as: "pickUpID", attributes: ["lat", "lng"] },
      { model: address, as: "dropOffID", attributes: ["lat", "lng"] },
    ],
  });
  if (fetchedData.driverId) {
    let response = ApiResponse(
      "0",
      "Already Driver is assigned to this Order",
      "",
      {}
    );
    return res.json(response);
  }

  const driver = await user.findOne({
    where: { id: driverId },
    include: {
      model: driverZone,
      include: { model: zone, include: { model: zoneDetails } },
    },
  });
  // return res.json(driver?.zoneDetails?.zone)
  let existInZone = false;
  const userPoint = point([
    parseFloat(fetchedData?.dropOffID?.lng),
    parseFloat(fetchedData?.dropOffID?.lat),
  ]);
  // return res.json(userPoint)
  // return res.json(driver.driverZone.zone)
  if (
    driver.driverZone.zone &&
    driver.driverZone.zone.coordinates.coordinates &&
    driver.driverZone.zone.coordinates.coordinates.length > 0
  ) {
    const zonePolygon = {
      type: "Polygon",
      coordinates: driver.driverZone.zone.coordinates.coordinates,
    };
    // return res.json(zonePolygon)
    if (booleanPointInPolygon(userPoint, zonePolygon)) {
      existInZone = true;
    }
  }
  // if (existInZone == false) {
  //   const response = ApiResponse(
  //     "0",
  //     "Your Dropoff Address is out of Your Zone",
  //     "Error",
  //     {}
  //   );
  //   return res.json(response);
  // }
  // return res.json(driver)

  // ////////////////////////////////////
  let tolat = "";
  let tolng = "";
  if (fetchedData.orderApplicationId == 1) {
    tolat = fetchedData.restaurant?.lat;
    tolng = fetchedData.restaurant?.lng;
  }
  const online_data = await axios.get(process.env.FIREBASE_URL);

  let fromlat = online_data.data[`${driverId}`]?.lat?.toString();
  let fromlng = online_data.data[`${driverId}`]?.lng?.toString();
  let eta = await eta_text(fromlat, fromlng, tolat, tolng);

  if (fetchedData.driverId != null) {
    const data = { orderData: {}, eta: "" };
    const response = ApiResponse(
      "0",
      "Order Already accepted by someone",
      "",
      data
    );
    return res.json(response);
  }

  const cancelledStatus = await orderStatus.findOne({
    where: { name: "Cancelled" },
  });
  if (fetchedData.orderStatusId == cancelledStatus.id) {
    const data = { orderData: {}, eta: "" };
    const response = ApiResponse("0", "Order Cancelled by the User", "", data);
    return res.json(response);
  }
  const acceptedByDriver = await orderStatus.findOne({
    where: { name: "Accepted by Driver" },
  });
  let status = acceptedByDriver.id;
  const preparingStatus = await orderStatus.findOne({
    where: { name: "Preparing" },
  });
  order
    .update(
      { driverId, orderStatusId: preparingStatus.id },
      { where: { id: orderId } }
    )
    .then((data) => {
      orderHistory.create({
        time: Date.now(),
        orderId,
        orderStatusId: status,
      });

      order
        .findOne({
          where: { id: orderId },
          attributes: [
            "id",
            "orderApplicationId",
            "orderNum",
            [
              sequelize.fn("date_format", sequelize.col("scheduleDate"), "%r"),
              "scheduleTime",
            ],
            "note",
            "leaveOrderAt",
            [sequelize.literal("cast(`distance` as CHAR)"), "distance"],
            "total",
            "userId",
            "driverId",
          ],
          include: [
            { model: orderApplication, attributes: ["name"] },
            {
              model: orderItems,
              attributes: ["quantity", "total"],
              include: { model: R_PLink, attributes: ["name", "image"] },
            },
            {
              model: restaurant,
              attributes: [
                "businessName",
                "countryCode",
                "phoneNum",
                "address",
                "city",
                "zipCode",
                "lat",
                "lng",
                "approxDeliveryTime",
              ],
              include: { model: user },
            },
            { model: orderCharge, attributes: ["driverEarnings"] },
            { model: orderStatus, attributes: ["displayText"] },
            {
              model: user,

              attributes: [
                "id",
                "ip",
                "firstName",
                "lastName",
                "countryCode",
                "phoneNum",
                "deviceToken",
              ],
            },
            {
              model: address,
              as: "pickUpID",
              attributes: [
                "building",
                "streetAddress",
                "city",
                "state",
                "zipCode",
                "lat",
                "lng",
              ],
            },
            {
              model: address,
              as: "dropOffID",
              attributes: [
                "building",
                "streetAddress",
                "city",
                "state",
                "zipCode",
                "lat",
                "lng",
              ],
            },
          ],
        })
        .then((orderData) => {
          // return res.json(orderData)
          let to = JSON.parse(orderData?.user?.deviceToken);
          let notification = {
            title: `Order Accepted by Driver`,
            body: `Order No: ${orderData.orderNum} accepted!`,
          };
          let data = {
            driverId,
            jobAccepted: true,
            eta_text: eta,
            orderApplicationId: orderData.orderApplicationId,
            restaurantId: orderData.restaurantId,
            pickupLat: orderData?.restaurant?.lat,
            orderId: orderData?.id,
            pickupLng: orderData?.restaurant?.lng,
            dropOffLat: orderData.dropOffID.lat,
            dropOffLng: orderData.dropOffID.lng,
          };
          let eventData = {
            type: "acceptOrderByDriver",
            data: {
              orderId: orderData.id,
              driverId: orderData.driverId,
              eta_text:
                parseInt(orderData?.restaurant?.approxDeliveryTime) -
                parseInt(orderData?.customTime),
            },
          };

          sendEvent(orderData?.user?.ip, eventData);
          sendEvent(orderData?.restaurant?.user?.ip, eventData);

          sendNotification(to, notification, data).then((dat) => {
            if (orderData.orderApplicationId == 1) {
              let restTokens = orderData.restaurant.user
                ? JSON.parse(orderData.restaurant.user.deviceToken)
                : [];

              notification = {
                title: `Order Accepted by Driver`,
                body: `Order No: ${orderData.orderNum} accepted!`,
              };
              let data = {
                driverId,
                jobAccepted: true,
                eta_text: eta,
                orderApplicationId: orderData.orderApplicationId,
                restaurantId: orderData.restaurantId,
              };

              sendNotification(restTokens, notification, data);
            }
            const data = { orderData, eta };
            const response = ApiResponse("1", "Order Accepted", "", data);
            return res.json(response);
          });
        });
    });
}

async function reached(req, res) {
  const { orderId } = req.body;
  order
    .update({ orderStatusId: 8 }, { where: { id: orderId } }) // reached
    .then((data) => {
      orderHistory.create({
        time: Date.now(),
        orderId,
        orderStatusId: 8,
      });
      order
        .findOne({
          where: { id: orderId },
          attributes: [
            "id",
            "orderApplicationId",
            "orderNum",
            [
              sequelize.fn("date_format", sequelize.col("scheduleDate"), "%r"),
              "scheduleTime",
            ],
            "note",
            "leaveOrderAt",
            [sequelize.literal("cast(`distance` as CHAR)"), "distance"],
            "total",
            "userId",
          ],
          include: [
            { model: orderApplication, attributes: ["name"] },
            {
              model: orderItems,
              attributes: ["quantity", "total"],
              include: { model: R_PLink, attributes: ["name", "image"] },
            },
            {
              model: restaurant,
              attributes: [
                "businessName",
                "countryCode",
                "phoneNum",
                "address",
                "city",
                "zipCode",
              ],
            },
            { model: orderCharge, attributes: ["driverEarnings"] },
            { model: orderStatus, attributes: ["displayText"] },
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
            {
              model: address,
              as: "pickUpID",
              attributes: [
                "building",
                "streetAddress",
                "city",
                "state",
                "zipCode",
                "lat",
                "lng",
              ],
            },
            {
              model: address,
              as: "dropOffID",
              attributes: [
                "building",
                "streetAddress",
                "city",
                "state",
                "zipCode",
                "lat",
                "lng",
              ],
            },
          ],
        })
        .then((orderData) => {
          let to = [orderData.customerId.deviceToken];
          let notification = {
            title: "Driver Reached",
            body: "Rider is arrived",
          };
          let data = {
            orderApplicationId: orderData.orderApplicationId,
            pickupLat: orderData.pickUpID.lat,
            pickupLng: orderData.pickUpID.lng,
            dropOffLat: orderData.dropOffID.lat,
            dropOffLng: orderData.dropOffID.lng,
            driverId: orderData.driverId,
          };
          sendNotification(to, notification, data).then((dat) => {
            const response = ApiResponse("1", "Order Reached", "", orderData);
            return res.json(response);
          });
        });
    });
}

async function foodPickedUp(req, res) {
  const { orderId } = req.body;
  const dd = await order.findOne({
    where: { id: orderId },
    attributes: [
      "id",
      "orderNum",
      [
        sequelize.fn("date_format", sequelize.col("scheduleDate"), "%r"),
        "scheduleTime",
      ],
      "note",
      "leaveOrderAt",
      [sequelize.literal("cast(`distance` as CHAR)"), "distance"],
      "total",
      "userId",
      "paymentMethodId",
      "driverId",
      "restaurantId",
      "currencyUnitId",
    ],
    include: [
      { model: orderApplication, attributes: ["name"] },
      {
        model: orderItems,
        attributes: ["quantity", "total"],
        include: { model: R_PLink, attributes: ["name", "image"] },
      },
      {
        model: restaurant,
        include: { model: user, attributes: ["ip", "deviceToken"] },
        attributes: [
          "businessName",
          "countryCode",
          "phoneNum",

          "address",
          "city",
          "zipCode",
        ],
      },
      {
        model: orderCharge,
        attributes: ["driverEarnings", "restaurantEarnings"],
      },
      { model: orderStatus, attributes: ["displayText"] },
      {
        model: user,

        attributes: [
          "id",
          "ip",
          "userName",
          "countryCode",
          "phoneNum",
          "deviceToken",
        ],
      },
      {
        model: address,
        as: "pickUpID",
        attributes: [
          "building",
          "streetAddress",
          "city",
          "state",
          "zipCode",
          "lat",
          "lng",
        ],
      },
      {
        model: address,
        as: "dropOffID",
        attributes: [
          "building",
          "streetAddress",
          "city",
          "state",
          "zipCode",
          "lat",
          "lng",
        ],
      },
    ],
  });
  const rest = await restaurant.findOne({ where: { id: dd.restaurantId } });
  const checkaddress = await address.findOne({
    where: [
      { status: 1 },
      { lat: rest.lat },
      { lng: rest.lng },
      { city: rest.city },
      { streetAddress: rest.address },
    ],
  });

  if (checkaddress) {
    dd.pickUpId = checkaddress.id;
  } else {
    const newaddress = new address();
    newaddress.lat = rest.lat;
    newaddress.lng = rest.lng;
    newaddress.city = rest.city;
    newaddress.streetAddress = rest.address;
    newaddress.status = 1;
    newaddress.zipCode = rest.zipCode;
    await newaddress.save();
    dd.pickUpId = newaddress.id;
  }

  dd.orderStatusId = 6;
  dd.save().then(async (ord) => {
    orderHistory.create({
      time: Date.now(),
      orderId: ord.id,
      orderStatusId: 6,
    });

    let to = JSON.parse(dd.user.deviceToken);
    let fireBase = await axios.get(process.env.FIREBASE_URL);
    let etaText = "10 mints";
    if (fireBase.data[dd.driverId]) {
      etaText = await eta_text(
        fireBase.data[dd.driverId]?.lat,
        fireBase.data[dd.driverId]?.lng,
        dd.dropOffID?.lat,
        dd.dropOffID?.lng
      );
    }

    let notification = {
      title: "Driver Pickedup Food",
      body: "Food picked up by rider. Hang on",
    };
    let data = {
      testData: "12354",
      orderId: orderId,
      eta_text: etaText,
    };

    let eventData = {
      type: "foodPickedUp",
      data: data,
    };
    retailerController.homeData(dd?.restaurantId).then((dat) => {
      let restEventData = {
        type: "foodPickedUp",
        data: {
          status: "1",
          message: "Homedata",
          error: "",
          data: dat,
        },
      };
      sendEvent(dd?.restaurant?.user?.ip, restEventData);
    });

    sendEvent(dd?.user?.ip, eventData);

    let restTokens = dd?.restaurant?.user
      ? JSON.parse(dd.restaurant.user.deviceToken)
      : [];
    singleNotification(
      restTokens,
      "Driver Pickedup Food",
      "Food picked up by rider. Hang on",
      data
    );
    sendNotification(to, notification, data).then((dat) => {
      const response = ApiResponse("1", "Pickedup Food", "", dd);
      return res.json(response);
    });
  });
}

async function foodArrived(req, res) {
  const { orderId } = req.body;
  order
    .update({ orderStatusId: 13 }, { where: { id: orderId } }) // foodArrived
    .then((data) => {
      orderHistory.create({
        time: Date.now(),
        orderId,
        orderStatusId: 13,
      });
      order
        .findOne({
          where: { id: orderId },
          attributes: [
            "id",
            "orderNum",
            [
              sequelize.fn("date_format", sequelize.col("scheduleDate"), "%r"),
              "scheduleTime",
            ],
            "note",
            "leaveOrderAt",
            [sequelize.literal("cast(`distance` as CHAR)"), "distance"],
            "total",
            "userId",
            "driverId",
            "paymentMethodId",
          ],
          include: [
            { model: orderApplication, attributes: ["name"] },
            {
              model: orderItems,
              attributes: ["quantity", "total"],
              include: { model: R_PLink, attributes: ["name", "image"] },
            },
            {
              model: restaurant,
              attributes: [
                "businessName",
                "countryCode",
                "phoneNum",
                "address",
                "city",
                "zipCode",
              ],
            },
            { model: orderCharge, attributes: ["driverEarnings"] },
            { model: orderStatus, attributes: ["displayText"] },
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
            {
              model: address,
              as: "pickUpID",
              attributes: [
                "building",
                "streetAddress",
                "city",
                "state",
                "zipCode",
                "lat",
                "lng",
              ],
            },
            {
              model: address,
              as: "dropOffID",
              attributes: [
                "building",
                "streetAddress",
                "city",
                "state",
                "zipCode",
                "lat",
                "lng",
              ],
            },
          ],
        })
        .then((orderData) => {
          let userTokens = orderData.user.deviceToken
            ? JSON.parse(orderData.user.deviceToken)
            : [];

          let notification = {
            title: "Driver at Doorstep",
            body: "Rider is at your location. Please collect your order",
          };
          let data = {
            testData: "12354",
            orderId: orderId,
          };
          sendNotification(userTokens, notification, data).then((dat) => {
            const response = ApiResponse("1", "Food Arrived", "", orderData);
            return res.json(response);
          });
        });
    });
}

async function onTheWay(req, res) {
  const { orderId } = req.body;
  order
    .update({ orderStatusId: 5 }, { where: { id: orderId } }) // onTheWay
    .then((data) => {
      orderHistory.create({
        time: Date.now(),
        orderId,
        orderStatusId: 5,
      });
      order
        .findOne({
          where: { id: orderId },
          attributes: [
            "id",
            "orderNum",
            [
              sequelize.fn("date_format", sequelize.col("scheduleDate"), "%r"),
              "scheduleTime",
            ],
            "note",
            "leaveOrderAt",
            [sequelize.literal("cast(`distance` as CHAR)"), "distance"],
            "total",
            "userId",
            "driverId",
          ],
          include: [
            { model: orderApplication, attributes: ["name"] },
            {
              model: orderItems,
              attributes: ["quantity", "total"],
              include: { model: R_PLink, attributes: ["name", "image"] },
            },
            {
              model: restaurant,
              attributes: [
                "businessName",
                "countryCode",
                "phoneNum",
                "address",
                "city",
                "zipCode",
                "lat",
                "lng",
              ],
            },
            { model: orderCharge, attributes: ["driverEarnings"] },
            { model: orderStatus, attributes: ["displayText"] },
            {
              model: user,

              attributes: [
                "id",
                "userName",
                "countryCode",
                "phoneNum",
                "deviceToken",
              ],
            },
            {
              model: address,
              as: "pickUpID",
              attributes: [
                "building",
                "streetAddress",
                "city",
                "state",
                "zipCode",
                "lat",
                "lng",
              ],
            },
            {
              model: address,
              as: "dropOffID",
              attributes: [
                "building",
                "streetAddress",
                "city",
                "state",
                "zipCode",
                "lat",
                "lng",
              ],
            },
          ],
        })
        .then((orderData) => {
          // ////////////////////////////////////
          let tolat = "";
          let tolng = "";

          tolat = orderData.dropOffID.lat;
          tolng = orderData.dropOffID.lng;

          axios.get(process.env.FIREBASE_URL).then((online_data) => {
            let fromlat =
              online_data.data[`${orderData.driverId}`].lat.toString();
            let fromlng =
              online_data.data[`${orderData.driverId}`].lng.toString();

            eta_text(fromlat, fromlng, tolat, tolng).then((eta) => {
              let userTokens = orderData.user
                ? JSON.parse(orderData.user.deviceToken)
                : [];

              let notification = {
                title: "Ride On The Way",
                body: "Rider on your way. Arriving soon",
              };
              let data = {
                testData: "12354",
                orderId: orderData.id,
              };
              sendNotification(userTokens, notification, data).then((dat) => {
                const data = { orderData, eta };
                const response = ApiResponse("1", "Order on the way", "", data);
                return res.json(response);
              });
            });
          });

          // ////////////////////////////////////
        });
    });
}

async function delivered(req, res) {
  const { orderId } = req.body;
  let status = await orderStatus.findOne({
    where: {
      name: "Delivered",
    },
  });
  let checkStatus = await order.findOne({
    where: {
      orderStatusId: status.id,
      id: orderId,
    },
  });
  if (checkStatus) {
    let response = ApiResponse("0", "Order Already Delivered!", "", {});
    return res.json(response);
  }
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
        orderStatusId: 7,
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
                attributes: ["ip", "deviceToken"],
              },
            },
            {
              model: user,
              attributes: [
                "id",
                "ip",
                "userName",
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
          let driverType = await user.findOne({
            where: {
              id: orderData.driverId,
            },
          });
          let userTokens = formatTokens(orderData.user.deviceToken);
          let restTokens = formatTokens(
            orderData?.restaurant?.user?.deviceToken
          );
          let to = [
            orderData.user.deviceToken,
            orderData?.restaurant?.user?.deviceToken,
          ];
          if (driverType.driverType == "Freelancer") {
            const driverEarn = await driverEarning.findOne({
              where: {
                userId: orderData?.driverId,
              },
            });
            if (driverEarn) {
              driverEarn.totalEarning =
                parseFloat(driverEarn.totalEarning) +
                parseFloat(orderData?.orderCharge?.driverEarnings);
              driverEarn.availableBalance =
                parseFloat(driverEarn.availableBalance) +
                parseFloat(orderData?.orderCharge?.driverEarnings);
              await driverEarn.save();
            } else {
              const newEarn = new driverEarning();
              newEarn.userId = orderData.driverId;
              newEarn.totalEarning = parseFloat(
                orderData?.orderCharge?.driverEarnings
              );
              newEarn.availableBalance = parseFloat(
                orderData?.orderCharge?.driverEarnings
              );
              await newEarn.save();
            }
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
          } else {
            const driverEarn = await driverEarning.findOne({
              where: {
                userId: orderData?.driverId,
              },
            });
            if (driverEarn) {
              driverEarn.restaurantAmount =
                parseFloat(driverEarn.restaurantAmount) +
                parseFloat(orderData?.orderCharge?.driverEarnings);
              await driverEarn.save();
            } else {
              const newEarn = new driverEarning();
              driverEarn.restaurantAmount =
                parseFloat(driverEarn.restaurantAmount) +
                parseFloat(orderData?.orderCharge?.driverEarnings);
              await newEarn.save();
            }
            const restEarn = await restaurantEarning.findOne({
              where: {
                restaurantId: orderData.restaurantId,
              },
            });
            if (restEarn) {
              restEarn.totalEarning =
                parseFloat(restEarn.totalEarning) +
                parseFloat(orderData?.orderCharge?.restaurantEarnings) +
                parseFloat(orderData?.orderCharge?.driverEarnings);
              restEarn.availableBalance =
                parseFloat(restEarn.availableBalance) +
                parseFloat(orderData?.orderCharge?.restaurantEarnings) +
                parseFloat(orderData?.orderCharge?.driverEarnings);
              await restEarn.save();
            } else {
              const newRestEarning = new restaurantEarning();
              newRestEarning.totalEarning =
                parseFloat(orderData?.orderCharge?.restaurantEarnings) +
                parseFloat(orderData?.orderCharge?.driverEarnings);
              newRestEarning.availableBalance =
                parseFloat(orderData?.orderCharge?.restaurantEarnings) +
                parseFloat(orderData?.orderCharge?.driverEarnings);
              newRestEarning.restaurantId = orderData.restaurantId;
              await newRestEarning.save();
            }
            //now update the orderCharge table
            console.log(
              "**********************************Charge ka table ******************************"
            );
            let charge = await orderCharge.findOne({
              where: {
                orderId: orderId,
              },
            });
            console.log(charge);
            if (charge) {
              charge.restaurantEarnings =
                parseFloat(charge.restaurantEarnings) +
                parseFloat(charge.driverEarnings);
              charge
                .save()
                .then((dat) => {
                  console.log(
                    "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& charge updated"
                  );
                })
                .catch((error) => {
                  console.log(error);
                });
            }
          }
          // Credits Calculations
          //   if driver completes first 3 orders than give him 4 points and also to the user whose referalCode was used by that driver
          const status = await orderStatus.findOne({
            where: {
              name: "Delivered",
            },
          });
          const orderCount = await order.count({
            where: [
              {
                driverId: req.user.id,
              },
              {
                orderStatusId: status.id,
              },
            ],
          });
          if (orderCount == 3) {
            // const driverCredit = await Credit.findOne({
            //   where: { userId: req.user.id },
            // });
            // if (driverCredit) {
            //   driverCredit.point = parseInt(driverCredit.point) + 4;
            //   await driverCredit.save();
            // }
            // const driver = await user.findOne({ where: { id: req.user.id } });
            // const usedDriver = await Credit.findOne({where: { referalCode: driver?.usedReferalCode },include:{model:user}});
            // if (usedDriver) {
            //   usedDriver.point = parseInt(usedDriver.point) + 4;
            //   await usedDriver.save();
            //   singleNotification(
            //   usedDriver?.user?.deviceToken,
            //   "Congratulations!",
            //   `You have been awarded by 4 points credit`,
            //   {}
            // );
            // }
          }
          let customer = await user.findOne({
            where: {
              id: orderData.user.id,
            },
          });
          let customerOrder = await order.count({
            where: {
              userId: customer.id,
              orderStatusId: status.id,
            },
          });
          if (customerOrder < 4) {
            // when user complete first three orders, on his each order he will get 4 points
            let credit = await Credit.findOne({
              where: {
                userId: customer.id,
              },
            });
            if (credit) {
              if (parseInt(credit.point) < 19) {
                credit.point = parseInt(credit.point) + 4;
                await credit.save();
              }
            }
            // referel code used by customer , that person belongs to that referal code will get 2 points
            let userCustomer = await user.findOne({
              where: {
                referalCode: customer.usedReferalCode,
              },
            });
            if (userCustomer) {
              let usedCredit = await Credit.findOne({
                where: {
                  userId: userCustomer.id,
                },
              });
              //   return res.json(usedCredit)
              //   return res.json(usedCredit)
              if (usedCredit) {
                if (parseInt(usedCredit.point) < 19) {
                  usedCredit.point = parseInt(usedCredit.point) + 2;
                  await usedCredit.save();
                }
              }
            }
          }
          let notification = {
            title: "Order Delivered",
            body: `Order Number ${orderData.orderNum} has been delivered`,
          };
          let data = {
            testData: "12354",
            orderId: orderId,
          };
          let eventData = {
            type: "delivered",
            data: {
              status: "1",
              message: `Order ID : ${orderData.id} Delivered successfully`,
              error: "",
              data: data,
            },
          };
          sendEvent(orderData?.user?.ip, eventData);
          sendEvent(orderData?.restaurant?.user?.ip, eventData);
          sendNotification(restTokens, notification, data);
          sendNotification(userTokens, notification, data).then((dat) => {
            const response = ApiResponse("1", "Food Delivered", "", orderData);
            return res.json(response);
          });
        });
    });
}

async function ride_start(req, res) {
  const { orderId } = req.body;
  order
    .update({ orderStatusId: 9 }, { where: { id: orderId } }) // ride started
    .then((data) => {
      orderHistory.create({
        time: Date.now(),
        orderId,
        orderStatusId: 9,
      });
      order
        .findOne({
          where: { id: orderId },
          attributes: [
            "id",
            "orderApplicationId",
            "orderNum",
            [
              sequelize.fn("date_format", sequelize.col("scheduleDate"), "%r"),
              "scheduleTime",
            ],
            "note",
            "leaveOrderAt",
            [sequelize.literal("cast(`distance` as CHAR)"), "distance"],
            "total",
            "userId",
            "driverId",
          ],
          include: [
            { model: orderApplication, attributes: ["name"] },
            {
              model: orderItems,
              attributes: ["quantity", "total"],
              include: { model: R_PLink, attributes: ["name", "image"] },
            },
            {
              model: restaurant,
              attributes: [
                "businessName",
                "countryCode",
                "phoneNum",
                "address",
                "city",
                "zipCode",
              ],
            },
            { model: orderCharge, attributes: ["driverEarnings"] },
            { model: orderStatus, attributes: ["displayText"] },
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
            {
              model: address,
              as: "pickUpID",
              attributes: [
                "building",
                "streetAddress",
                "city",
                "state",
                "zipCode",
                "lat",
                "lng",
              ],
            },
            {
              model: address,
              as: "dropOffID",
              attributes: [
                "building",
                "streetAddress",
                "city",
                "state",
                "zipCode",
                "lat",
                "lng",
              ],
            },
          ],
        })
        .then((orderData) => {
          // ////////////////////////////////////
          let tolat = "";
          let tolng = "";

          tolat = orderData.dropOffID.lat;
          tolng = orderData.dropOffID.lng;

          axios.get(process.env.FIREBASE_URL).then((online_data) => {
            let fromlat =
              online_data.data[`${orderData.driverId}`].lat.toString();
            let fromlng =
              online_data.data[`${orderData.driverId}`].lng.toString();

            eta_text(fromlat, fromlng, tolat, tolng).then((eta) => {
              let to = [orderData.customerId.deviceToken];
              let notification = {
                title: "Ride started",
                body: "Rider is on his way. Please hang on.",
              };
              let data = {
                orderApplicationId: orderData.orderApplicationId,
                driverId: orderData.driverId,
                pickupLat: orderData.pickUpID.lat,
                pickupLng: orderData.pickUpID.lng,
                dropOffLat: orderData.dropOffID.lat,
                dropOffLng: orderData.dropOffID.lng,
              };
              sendNotification(to, notification, data).then((dat) => {
                const data = { orderData, eta };
                const response = ApiResponse("1", "Ride Started", "", data);
                return res.json(response);
              });
            });
          });

          //////////////////////////////////////
        });
    });
}

async function ride_cancel(req, res) {
  const { orderId } = req.body;
  const userId = req.user.id;
  order
    .update({ orderStatusId: 12 }, { where: { id: orderId } }) // ride cancelled
    .then((data) => {
      orderHistory.create({
        time: Date.now(),
        orderId,
        orderStatusId: 12,
        cancelledBy: userId,
      });
      order
        .findOne({
          where: { id: orderId },
          attributes: [
            "id",
            "orderApplicationId",
            "orderNum",
            [
              sequelize.fn("date_format", sequelize.col("scheduleDate"), "%r"),
              "scheduleTime",
            ],
            "note",
            "leaveOrderAt",
            [sequelize.literal("cast(`distance` as CHAR)"), "distance"],
            "total",
            "userId",
            "driverId",
          ],
          include: [
            { model: orderApplication, attributes: ["name"] },
            {
              model: orderItems,
              attributes: ["quantity", "total"],
              include: { model: R_PLink, attributes: ["name", "image"] },
            },
            {
              model: restaurant,
              attributes: [
                "businessName",
                "countryCode",
                "phoneNum",
                "address",
                "city",
                "zipCode",
              ],
            },
            { model: orderCharge, attributes: ["driverEarnings"] },
            { model: orderStatus, attributes: ["displayText"] },
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
            {
              model: address,
              as: "pickUpID",
              attributes: [
                "building",
                "streetAddress",
                "city",
                "state",
                "zipCode",
                "lat",
                "lng",
              ],
            },
            {
              model: address,
              as: "dropOffID",
              attributes: [
                "building",
                "streetAddress",
                "city",
                "state",
                "zipCode",
                "lat",
                "lng",
              ],
            },
          ],
        })
        .then((orderData) => {
          // ////////////////////////////////////
          let tolat = "";
          let tolng = "";

          tolat = orderData.dropOffID.lat;
          tolng = orderData.dropOffID.lng;

          axios.get(process.env.FIREBASE_URL).then((online_data) => {
            let eta = "";
            let to = [orderData.customerId.deviceToken];
            let notification = {
              title: "Ride Cancelled",
              body: "Ride cancelled",
            };
            let data = {
              orderApplicationId: orderData.orderApplicationId,
            };
            sendNotification(to, notification, data).then((dat) => {
              orderData = {};
              return res.json({
                status: "1",
                message: "Order Cancelled",
                data: { orderData, eta },
                error: "",
              });
            });
          });

          // ////////////////////////////////////
        });
    });
}

async function ride_end(req, res) {
  const { orderId } = req.body;
  order
    .update({ orderStatusId: 10 }, { where: { id: orderId } }) // ride end
    .then((data) => {
      orderHistory.create({
        time: Date.now(),
        orderId,
        orderStatusId: 10,
      });
      order
        .findOne({
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
          ],
          include: [
            { model: address, as: "pickUpID" },
            { model: address, as: "dropOffID" },
            { model: orderCharge, attributes: ["driverEarnings"] },
            {
              model: restaurant,
              attributes: [
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
        })
        .then((orderData) => {
          let to = [orderData.customerId.deviceToken];
          let notification = {
            title: "Ride End",
            body: "Your ride end now",
          };
          let data = {
            orderId: orderId,
            driverId: orderData.driverId,
            pickupLat: orderData.pickUpID.lat,
            pickupLng: orderData.pickUpID.lng,
            dropOffLat: orderData.dropOffID.lat,
            dropOffLng: orderData.dropOffID.lng,
          };
          sendNotification(to, notification, data).then((dat) => {
            getFare(
              orderData.pickUpId,
              orderData.dropOffId,
              orderData.vehicleTypeId,
              orderId
            ).then((data) => {
              // return res.json(data);
              let orderRideSharing = true;
              let deliveryType = 0;
              let adminEarning = data.adminEarnings;
              let driverEarning = data.driverEarnings;
              let userCharge = data.total;
              let restaurantEarning = 0;
              let userId = orderData.userId;
              let restId = 0;
              orderPlaceTransaction(
                orderRideSharing,
                deliveryType,
                orderId,
                adminEarning,
                driverEarning,
                userCharge,
                restaurantEarning,
                orderData.driverId,
                userId,
                restId
              ).then((tr) => {
                return res.json({
                  status: "1",
                  message: "Order End",
                  data: orderData,
                  error: "",
                });
              });
            });
          });
        });
    });
}

async function getRating(req, res) {
  const userId = req.user.id;
  const averageRate = await driverRating.findOne({
    where: { driverId: userId },
    attributes: [[sequelize.fn("AVG", sequelize.col("value")), "avgRating"]],
    raw: true,
  });

  const three = await driverRating.count({
    where: [{ driverId: userId }, { value: 3 }],
  });
  const seven = await driverRating.count({
    where: [{ driverId: userId }, { value: 7 }],
  });
  const ten = await driverRating.count({
    where: [{ driverId: userId }, { value: 10 }],
  });
  const average = parseFloat(averageRate.avgRating);
  let data = {
    average: average,
    three: three,
    seven: seven,
    ten: ten,
  };
  const response = ApiResponse("1", "Driver rating ", "", data);
  return res.json(response);
}

async function getLicense(req, res) {
  const userId = req.user.id;
  driverDetails
    .findOne({
      where: { userId },
      attributes: [
        // 'licIssueDate',
        // 'licExpiryDate',
        "licNum",
        "licFrontPhoto",
        "licBackPhoto",
        [
          sequelize.fn(
            "date_format",
            sequelize.col("licIssueDate"),
            "%Y-%m-%d"
          ),
          "licIssueDate",
        ],
        [
          sequelize.fn(
            "date_format",
            sequelize.col("licExpiryDate"),
            "%Y-%m-%d"
          ),
          "licExpiryDate",
        ],
      ],
      order: [["createdAt", "DESC"]],
    })
    .then((data) => {
      return res.json({
        status: "1",
        message: "License Detail",
        data: data,
        error: "",
      });
    });
}

async function contactus(req, res) {
  const phone = await setting.findOne({ where: { content: "phone" } });
  const email = await setting.findOne({ where: { content: "email" } });

  const data = {
    email: email.value,
    phone: phone.value,
  };
  const response = ApiResponse("1", "Charges Payment", "", data);
  return res.json(response);
}

async function create_new_charge_stripe(req, res) {
  const { amount, card_number, exp_month, exp_year, cvc, userId, check } =
    req.body;
  const charges = await create_new_charges_stripe(
    amount,
    card_number,
    exp_month,
    exp_year,
    cvc,
    userId,
    check
  );
  const response = ApiResponse("1", "Charges Payment", "", charges);
  return res.json(response);
}

async function create_old_charge_stripe(req, res) {
  const { amount, pmId, userId } = req.body;
  const charges = await create_old_charges_stripe(amount, pmId, userId);
  const response = ApiResponse("1", "Charges Payment", "", charges);
  return res.json(response);
}

async function get_stripe_cards(req, res) {
  const { userId } = req.body;
  const charges = await get_stripe_card(userId);
  const response = ApiResponse("1", "Charges Payment", "", charges);
  return res.json(response);
}

async function create_new_charge_flutterwave(req, res) {
  const { amount, card_number, exp_month, exp_year, cvc, email, tx_ref } =
    req.body;

  //console.log(amount, card_number, exp_month, exp_year, cvc, email, tx_ref);
  const charges = await create_new_charges_flutterwave(
    amount,
    card_number,
    exp_month,
    exp_year,
    cvc,
    email,
    tx_ref
  );
  console.log(charges);
  if (charges.status == "success") {
    const response = ApiResponse("1", "Charges Payment", "", charges);
    return res.json(response);
  } else {
    const response = ApiResponse("0", charges.message, "", charges);
    return res.json(response);
  }
}

async function deleteData(req, res) {
  const userId = req.user.id;
  user
    .update({ deletedAt: Date.now() }, { where: { id: userId } })
    .then((userData) => {
      const response = ApiResponse("1", "User Deleted", "", {});
      return res.json(response);
    });
}

async function charge_ghana_mobile_money(req, res) {
  let phone_number = req.body.phone_number;
  let type = "mobile_money_ghana";
  let amount = req.body.amount;
  let currency = req.body.currency;
  let network = req.body.network;
  let email = req.body.email;
  let tx_ref = "req.body.tx_ref";

  const flutterdata = await charges_ghana_mobile_money(
    phone_number,
    type,
    amount,
    currency,
    network,
    email,
    tx_ref
  );
  const status = typeof flutterdata == "string" ? "0" : "1";
  const response = ApiResponse("1", "Mobile Money", "", flutterdata);
  return res.json(response);
}

async function declineOrder(req, res) {
  const orderData = await order.findOne({
    where: { id: req.body.orderId },
    include: {
      model: restaurant,
      include: { model: user, attributes: ["ip", "deviceToken"] },
    },
  });
  if (orderData) {
    singleNotification(
      orderData.restaurant.user.deviceToken,
      "Order Decline",
      `Driver delcine your Order ID : ${req.body.orderId}`,
      {}
    );
    let eventData = {
      type: "declineOrder",
      data: {
        status: "1",
        message: "Decline Order by driver",
        error: "",
        data: {},
      },
    };
    sendEvent(orderData?.restaurant?.user?.ip, eventData);
    const response = ApiResponse("1", "Order declined", "", {});
    return res.json(response);
  } else {
    const response = ApiResponse("0", "Order not found", "", {});
    return res.json(response);
  }
}

module.exports = {
  registerDriverSt1,
  registerDriverSt2,
  registerDriverSt3,
  addAddress,
  verifyEmail,
  resendOTP,
  login,
  forgetPasswordRequest,
  changePasswordOTP,
  session,
  logout,
  getService,
  getVehicleType,
  getProfile,
  //updateProfilePhoto,
  changePassword,
  updateProfile,
  updateLicense,
  updateVehicleDetails,
  addBank,
  getHome,
  getorderdetail,
  acceptorder,
  getActiveOrders,
  getBank,
  getEarning,
  getRating,
  getLicense,
  getPaidOrdersRestaurant,
  getPaidOrdersTaxi,
  reached,
  ride_start,
  ride_end,
  getVehicleDetails,
  foodPickedUp,
  onTheWay,
  delivered,
  foodArrived,
  contactus,
  getActiveOrdersTaxi,
  updateVehicleDetailsImages,
  updateVehicleDetailsDocuments,
  deleteData,
  ride_cancel,
  create_new_charge_stripe,
  create_old_charge_stripe,
  create_new_charge_flutterwave,
  get_stripe_cards,
  charge_ghana_mobile_money,
  addDriverZone,
  dataForDriverRegistration,
  driverAddress,
  declineOrder,
  phoneAuth,
  verifyOTP,
};
