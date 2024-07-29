const express = require('express');
const router = express();
const userController = require('../controllers/user');
const asyncMiddleware = require('../middlewares/async');
const validateToken = require('../middlewares/validateToken');
const multer = require('multer');
const path = require('path');
const frontsiteController = require('../controllers/frontsite');


//! 1: Auth
// 1: Register User
router.post('/emailChecker',asyncMiddleware(frontsiteController.emailChecker))
router.post('/register', asyncMiddleware(frontsiteController.registerUser));
// 2: verifyEmail User
router.post('/verifyEmail', asyncMiddleware(frontsiteController.verifyEmail));
//3. Resend OTP for email verification
router.post('/resendotp', asyncMiddleware(frontsiteController.resendOTP));
//4. Sign in the user
router.post('/login', asyncMiddleware(frontsiteController.signInUser));
//5. Sending OTP using forget request
router.post('/forgetpasswordrequest', asyncMiddleware(frontsiteController.forgetPasswordRequest));
//6. Response to forget password request
router.post('/forgetpasswordresponse', asyncMiddleware(frontsiteController.changePasswordOTP));
//7. Log out
router.get('/logout', validateToken ,asyncMiddleware(frontsiteController.logout));

//!  Home (Customer) 
router.post('/home', asyncMiddleware(frontsiteController.home1));
router.get('/favRestaurant/:userId', asyncMiddleware(frontsiteController.favRestaurant));
router.post('/addToFav', asyncMiddleware(frontsiteController.addToFav));
router.post('/home1', asyncMiddleware(frontsiteController.home1));
//4. Create Order
router.post('/addorder', asyncMiddleware(frontsiteController.addorder));
router.post('/orderdetailsfood',validateToken, asyncMiddleware(frontsiteController.orderdetailsfood));

//! 2:landingPage
// 1 HomePage
router.get('/landingPage', asyncMiddleware(frontsiteController.landingPage));
//2. Get restaurants by ID
router.get('/restaurantbyid/:restaurantId', asyncMiddleware(frontsiteController.getRestaurantByIdFromUser));
//3. Get product by ID
router.post('/productbyid', asyncMiddleware(frontsiteController.getProductById));
//4. Filter restaurant
router.get('/filterrestaurant', asyncMiddleware(frontsiteController.getRestaurantByFilter))
//5. Search Restaurants
router.get('/searchrestaurant', asyncMiddleware(frontsiteController.getRestaurantBySearch));

//! 3:Order
//1. Create Order
router.post('/createOrder',validateToken, asyncMiddleware(frontsiteController.createOrder));
//2. restaurant features
router.post('/restaurantfeatures', asyncMiddleware(frontsiteController.getRestaurantFeatures));
//3. My Order 
router.get('/myOrders', validateToken, asyncMiddleware(frontsiteController.myOrders));
//4. delivery Types
router.get('/deliveryTypes', asyncMiddleware(frontsiteController.deliveryTypes));
//. Book Table
router.post('/bookTableBooking', validateToken,asyncMiddleware(frontsiteController.bookTableBooking));
//! 4:Address
//1. Get Address Labels
router.get('/addresslabels',asyncMiddleware(frontsiteController.getaddressLabels));
//2. Add Address 
router.post('/addaddress', validateToken, asyncMiddleware(frontsiteController.addAddress));
//3. Get all addresses 
router.get('/alladdresses', validateToken, asyncMiddleware(frontsiteController.getAllAddress));
// Delete addresses 
router.post('/deleteaddress', validateToken, asyncMiddleware(frontsiteController.deleteAddress));
router.post('/addToWishList', validateToken, asyncMiddleware(frontsiteController.addToWishList));
router.get('/getWishList', validateToken, asyncMiddleware(frontsiteController.getWishList));
router.post('/searchProduct', asyncMiddleware(frontsiteController.searchProduct));

//! Retailer Registration
const resturantStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `Public/Images/Restaurant`);
    },
    filename: (req, file, cb) => {
      //console.log(req.body)
      cb(
        null,
        req.body.businessName +
          "-" +
          file.fieldname +
          "-" +
          Date.now() +
          path.extname(file.originalname)
      );
    },
  });
  const restaurantUpload = multer({
    storage: resturantStorage,
  });
// 1: Register Retailer
router.post('/registerRetailer',restaurantUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]), asyncMiddleware(frontsiteController.registerRetailer));


module.exports = router;