const express = require('express');
const router = express();
const userController = require('../controllers/user');
const asyncMiddleware = require('../middlewares/async');
const validateToken = require('../middlewares/validateToken');
const driverController = require('../controllers/driver');
const multer = require("multer");
const path = require("path");
//


const groupOrderStoreage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `Public/Images`);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      req.body.name +
        "-" +
        file.fieldname +
        "-" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});
const upload = multer({
  storage: groupOrderStoreage,
});
//1. Creating a new User
router.post('/home' , asyncMiddleware(userController.home1));
router.post('/payrexx_payment' , asyncMiddleware(userController.payrexx_payment));
router.post('/register', asyncMiddleware(userController.registerUser));
//2. Verifying email of new User
router.post('/verifyemail', asyncMiddleware(userController.verifyEmail));
//3. Resend OTP for email verification
router.post('/resendotp', asyncMiddleware(userController.resendOTP));
//4. Sign in the user
router.post('/login', asyncMiddleware(userController.signInUser));
//5. Sending OTP using forget request
router.post('/forgetpasswordrequest', asyncMiddleware(userController.forgetPasswordRequest));
//6. Response to forget password request
router.post('/forgetpasswordresponse', asyncMiddleware(userController.changePasswordOTP));
//7. Google Sign In
router.post('/googleLogin', asyncMiddleware(userController.googleSignIn));
//8. Log out
router.get('/logout', validateToken ,asyncMiddleware(userController.logout));
//9. session
router.get('/session', validateToken ,asyncMiddleware(userController.session));
//MODULE 2 - Address
//1. Get Address Labels
router.get('/addresslabels',asyncMiddleware(userController.getaddressLabels));
router.post('/getDriverDetails',asyncMiddleware(userController.getDriverDetails));
//2. Add Address 
router.post('/addaddress', validateToken, asyncMiddleware(userController.addAddress));
//3. Get all addresses 
router.get('/alladdresses', validateToken, asyncMiddleware(userController.getAllAddress));
// Delete addresses 
router.post('/deleteaddress', validateToken, asyncMiddleware(userController.deleteAddress));

// Delete addresses 
router.get('/recentaddress', validateToken, asyncMiddleware(userController.recentAddresses));

router.get('/getVehicleTypeWithoutCharge', validateToken ,asyncMiddleware(userController.getVehicleTypeWithoutCharge));
//MODULE 3 - Restaurant Data
//1. Get all restaurants that lie within radius of current location
router.post('/allrestaurants', asyncMiddleware(userController.getcurrRestaurants));
//2. Get all cuisines
router.post('/allcuisines', asyncMiddleware(userController.getAllCuisines));
//3. Get restaurants by cuisine filter
router.post('/restaurantsbycuisine', asyncMiddleware(userController.getRestaurantsByCuisine));
//4. Get restaurants by ID
router.post('/restaurantbyid', asyncMiddleware(userController.getRestaurantById));
//5. Get product by ID
router.post('/productbyid', asyncMiddleware(userController.getProductById));
router.post('/getProductByIdTest', asyncMiddleware(userController.getProductByIdTest));
//6. Filter restaurant
router.get('/filterrestaurant', asyncMiddleware(userController.getRestaurantByFilter));

router.post('/filter', asyncMiddleware(userController.filter))
//7. Search Restaurants
router.get('/searchrestaurant', asyncMiddleware(userController.getRestaurantBySearch))

//Module 4: Order
// 1. get delivery fee
router.post('/deliveryfee', asyncMiddleware(userController.getDeliveryFee));
//2. Create Order
router.post('/restaurantfeatures', asyncMiddleware(userController.getRestaurantFeatures));
//3. Apply Voucher
router.post('/applyvoucher', asyncMiddleware(userController.applyVoucher));
//4. Create Order
router.post('/addorder', validateToken,asyncMiddleware(userController.createOrder));
router.post('/orderAgain', validateToken,asyncMiddleware(userController.orderAgain));
//4.1. Update Order to self pickup
router.post('/updateordertoselfpickup', asyncMiddleware(userController.updateOrderToPickup));
//5. Cancel Order 
router.post('/cancelorderfood',validateToken, asyncMiddleware(userController.cancelOrderFood));
//5. Cancel Order 
router.get('/ongoingorders', validateToken, asyncMiddleware(userController.ongoingOrders));

// PAYPAL PAYMENT INTEGRATION
router.get('/getAllPaymentMethods', asyncMiddleware(userController.getAllPaymentMethods));
router.get('/createPaypalToken', asyncMiddleware(userController.createPaypalToken));
router.post('/paymentByCard', asyncMiddleware(userController.paymentByCard));
router.post('/paypal_payment', asyncMiddleware(userController.paypal_payment));

//Module 5: Rating, Feedback & Tips
//1. Add Rating and Feedback for driver and Restaurant
router.post('/addratingfeedback',validateToken, asyncMiddleware(userController.addRatingFeedback));
//2. Add Tip for driver
router.post('/addtip', asyncMiddleware(userController.addTip));

//Module 6: Drawer - Profile
//1. Get profile
router.post('/getprofile',  asyncMiddleware(userController.getProfile));
//2. Update profile (name & phone number)
router.post('/updateprofile', asyncMiddleware(userController.updateProfile));
//3. Response to forget password request
router.post('/changepassword', validateToken, asyncMiddleware(userController.changePassword));
//4. Send support Email
router.get('/supportemail', asyncMiddleware(userController.supportEmail));
//5. Get restauant orders history for a user 
router.get('/orderhistory', validateToken, asyncMiddleware(userController.orderHistoryRes));
//5. Get restauant orders history for a user 
router.post('/orderdetailsfood',validateToken ,asyncMiddleware(userController.orderDetails));
//6. Get restauant orders history for a user Rides
router.post('/orderdetailstaxi', asyncMiddleware(userController.orderDetailsRides));
// //7. Get wallet data of the user 
router.get('/walletdata',validateToken ,asyncMiddleware(userController.walletData));

//Module 7. Taxi App - Order
//1. Get vehicle types
router.post('/getvehicletype', asyncMiddleware(userController.getVehicleType));
//2. Place order
router.post('/estdfare', asyncMiddleware(userController.getEstdFare));
//3. Place order
router.post('/placeorder', asyncMiddleware(userController.placeOrder));
router.post('/tablebooking', asyncMiddleware(userController.tablebooking));
//4. Place order
router.post('/cancelordertaxi', validateToken, asyncMiddleware(userController.cancelOrderTaxi));
//5. Get driver details for customer
router.post('/driverdeatilsforcust', asyncMiddleware(userController.driverDetailsForCustomer));
//6. Get restauant orders history for a user Rides
router.post('/autocanceltaxi',validateToken, asyncMiddleware(userController.autoCancelOrderTaxi));

router.get('/testapi', asyncMiddleware(userController.testAPI));
router.get('/applicationrange/:lat/:lng', asyncMiddleware(userController.applicationRange));
router.get('/restaurantrange/:lat/:lng/:restId', asyncMiddleware(userController.restaurantRange));

router.get('/home', validateToken, asyncMiddleware(userController.home1));
router.get('/deleteData', validateToken, asyncMiddleware(driverController.deleteData));
router.get('/PreparingOrders',validateToken, asyncMiddleware(userController.PreparingOrders));
router.get('/PickupOrders',validateToken, asyncMiddleware(userController.PickupOrders));

router.post('/stripe_add_card',validateToken, asyncMiddleware(userController.stripe_add_card));
router.get('/stripe_get_all_cards',validateToken, asyncMiddleware(userController.stripe_get_all_cards));
router.post('/delete_stripe_card',validateToken, asyncMiddleware(userController.delete_stripe_card));
router.post('/makepaymentbynewcard',validateToken, asyncMiddleware(userController.makepaymentbynewcard));
router.post('/makepaymentBySavedCard',validateToken, asyncMiddleware(userController.makepaymentBySavedCard));

router.get('/getCountriesAndCities', asyncMiddleware(userController.getCountriesAndCities));

// ADYEN PAYMENT GATEWAY 
router.post('/adyen_payment_by_card', asyncMiddleware(userController.adyen_payment_by_card));
router.get('/popularProducts', asyncMiddleware(userController.popularProducts));
router.post('/searchProduct', asyncMiddleware(userController.searchProduct));

// GROUP ORDER /
router.post('/createGroup',validateToken ,upload.single("icon"),asyncMiddleware(userController.createGroup));
router.post('/deleteGroup',validateToken,asyncMiddleware(userController.deleteGroup));
router.post('/placeGroupOrder',validateToken ,asyncMiddleware(userController.placeGroupOrder));
router.post('/joinGroup',validateToken ,asyncMiddleware(userController.joinGroup));
router.post('/joinMember',validateToken ,asyncMiddleware(userController.joinMember));
router.post('/groupOrderDetails',validateToken ,asyncMiddleware(userController.groupOrderDetails));
router.post('/bookTableBooking',validateToken ,asyncMiddleware(userController.bookTableBooking));
router.get('/getTableBookings',validateToken ,asyncMiddleware(userController.getTableBookings));
router.post('/cancelledTableBooking',validateToken ,asyncMiddleware(userController.cancelledTableBooking));
router.post('/leaveGroup' ,asyncMiddleware(userController.leaveGroup));

//table booking



module.exports = router;