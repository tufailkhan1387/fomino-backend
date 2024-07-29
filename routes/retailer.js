const express = require('express');
const router = express();
const restController = require('../controllers/retailer');
const asyncMiddleware = require('../middlewares/async');
const validateAdmin = require('../middlewares/validateAdmin');
//Importing Multer
const multer = require('multer')
const path = require('path');
const validateToken = require('../middlewares/validateToken');

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
const CategoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `Public/Images/Category`);
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
const categoryUpload = multer({
  storage: CategoryStorage,
});


const uploadimage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, `./Public/Images/Driver`)
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + '-' + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: uploadimage,
});
//Module 1 - Auth
//1. Restaurant signup
router.post('/signup',restaurantUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]), asyncMiddleware(restController.restSignUp));
//2. Restaurant signIn
router.post('/signin', asyncMiddleware(restController.restSignIn));
router.post('/updatePassword',validateToken ,asyncMiddleware(restController.updatePassword));
router.get('/session', validateToken, asyncMiddleware(restController.session));
router.get('/home', validateToken, asyncMiddleware(restController.home));
router.post('/scheduleOrder_to_Outgoing', validateToken, asyncMiddleware(restController.scheduleOrder_to_Outgoing));
router.post('/acceptOrder', asyncMiddleware(restController.acceptOrder));
router.post('/delivered', asyncMiddleware(restController.delivered));
router.post('/rejectOrder', validateToken,asyncMiddleware(restController.rejectOrder));
router.post('/readyForPickup', asyncMiddleware(restController.readyForPickup));
router.post('/restaurantDrivers/:restaurantId', asyncMiddleware(restController.restaurantDrivers));
router.get('/sendNotificationToFreelanceDriver/:restaurantId/:orderId', asyncMiddleware(restController.sendNotificationToFreelanceDriver));
router.post('/assignDriver', asyncMiddleware(restController.assignDriver));
router.get('/storeTime/:restaurantId', asyncMiddleware(restController.storeTime));
router.post('/updateStoreTime', asyncMiddleware(restController.updateStoreTime));
router.post('/enableRushMode', asyncMiddleware(restController.enableRushMode));
router.get('/activeOrders/:restaurantId', asyncMiddleware(restController.activeOrders));
router.get('/completedOrders/:restaurantId', asyncMiddleware(restController.completedOrders));
router.post('/orderDetails', asyncMiddleware(restController.orderDetails));
router.post('/updateRestaurant',restaurantUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]), asyncMiddleware(restController.updateRestaurant));
  
// Product Module
router.post('/addProduct', restaurantUpload.single("image") ,asyncMiddleware(restController.addProduct));
router.post('/editProduct', restaurantUpload.single("image") ,asyncMiddleware(restController.editProduct));
router.get('/getProducts/:restaurantId', asyncMiddleware(restController.getProducts));
router.post('/getProductById', asyncMiddleware(restController.getProductById));



router.post('/addCollection',validateToken,asyncMiddleware(restController.addCollection));
router.post('/updateAddOnCategory',asyncMiddleware(restController.updateAddOnCategory));
router.get('/getAllAddOnCategories/:restaurantId',asyncMiddleware(restController.getAllAddOnCategories));
router.post('/deleteAddonCategory',asyncMiddleware(restController.deleteAddonCategory));
router.get('/getAllAddOns/:restaurantId',asyncMiddleware(restController.getAllAddOns));
router.post('/addAddOns',asyncMiddleware(restController.addAddOns));
router.post('/updateAddOns',asyncMiddleware(restController.updateAddOns));
router.post('/addCategory',categoryUpload.single("image"),asyncMiddleware(restController.addCategory));
router.get('/getAllCategory/:restaurantId',asyncMiddleware(restController.getAllCategory));
router.post('/removeCategory',validateToken, asyncMiddleware(restController.removeCategory));
router.post('/editCategory',restaurantUpload.single("image"),asyncMiddleware(restController.editCategory));

//Module 2. Stores
router.get('/getallby/:id', asyncMiddleware(restController.getAllRest));
router.post('/openCloseRestaurant', asyncMiddleware(restController.openCloseRestaurant));
router.get('/getallproductsby/:restid', asyncMiddleware(restController.getAllProdByRest));
router.get('/getallcuisinesby/:restid', asyncMiddleware(restController.getAllCuisineByRest));
router.get('/getallordersby/:restid', asyncMiddleware(restController.getAllOrdersByRest));
router.get('/getratingby/:restid', asyncMiddleware(restController.getRatingByRest));
router.get('/getRPLinkIds/:restaurantId', asyncMiddleware(restController.getRPLinkIds));
router.get('/getRestaurantProfile/',validateToken, asyncMiddleware(restController.getRestaurantProfile));
router.post('/updateUserProfile/',validateToken, asyncMiddleware(restController.updateUserProfile));
router.get('/getRating/:restaurantId', asyncMiddleware(restController.getRating));

//Module 3 Order Managment
//1. Get orders by status
router.get('/getorders/:userid/:status', asyncMiddleware(restController.getNewOrders));
//2. Get All status for restaurant
router.get('/getstatus', asyncMiddleware(restController.getStatus));
//3. Change order status
router.put('/changeorderstatus', asyncMiddleware(restController.changerOrderStatus));
router.get('/completedOrders/:restaurantId', asyncMiddleware(restController.completedOrders));
router.get('/activeOrders/:restaurantId', asyncMiddleware(restController.activeOrders));

router.get('/resturantcharge/:id', asyncMiddleware(restController.resturantcharge));
router.post('/updateresturantcharge/:id', asyncMiddleware(restController.updateresturantcharge));

//Module 4 - Products
router.post('/assignmctorest', asyncMiddleware(restController.assignMCToRest));

router.post('/assigncuisinetorest', asyncMiddleware(restController.assignCuisineToRest));

//Module 4 - Earnings
//1. Get Restaurant earning by Id
router.get('/restearnings/:id', asyncMiddleware(restController.restaunarntEarning));
//2. Generate payout request
router.post('/payoutrequest', asyncMiddleware(restController.requestPayout));
//2. Generate payout request
router.get('/allpayouts/:id', asyncMiddleware(restController.getAllPayoutsByRestId));

//Module 5 - DashBoard
router.get('/dashbaordstats/:id', asyncMiddleware(restController.dashBoardStats));
router.get('/dashbaordyearlyearn/:id', asyncMiddleware(restController.dashBoardYearlyEarn));
router.get('/tablebookings/:id', asyncMiddleware(restController.tablebookings));
router.post('/acceptBookTableRequest', asyncMiddleware(restController.acceptBookTableRequest));
router.post('/completeTableBooking',validateToken, asyncMiddleware(restController.completeTableBooking));
router.post('/rejectBookTableRequest', asyncMiddleware(restController.rejectBookTableRequest));
router.post('/getTableBookings', asyncMiddleware(restController.getTableBookings));
router.get('/inDeliverOrders',validateToken, asyncMiddleware(restController.inDeliverOrders));

// add driver section 
router.post('/addDriver',validateToken,upload.single("image"), asyncMiddleware(restController.addDriver));
router.get('/getData', asyncMiddleware(restController.getData));
router.get('/getVehicleType', asyncMiddleware(restController.getVehicleType));
router.post('/addVehicleDetails',validateToken,
   upload.fields([
    { name: 'front', maxCount: 1 }, 
    { name: 'back', maxCount: 1 },
    { name: 'left', maxCount: 1 },
    { name: 'right', maxCount: 1 },
    { name:'document_front', maxCount: 1},
    { name:'document_back', maxCount: 1}]), asyncMiddleware(restController.addVehicleDetails)
);

router.post('/addDriverLicense',validateToken,upload.fields([
    { name:'licFrontPhoto', maxCount: 1},
    { name:'licBackPhoto', maxCount: 1}]), asyncMiddleware(restController.addDriverLicense)
);
router.get('/getRestaurantDrivers/:restaurantId', asyncMiddleware(restController.getRestaurantDrivers));
router.post('/addDriverAddress',validateToken, asyncMiddleware(restController.addDriverAddress));
router.post('/addDriverZone',validateToken, asyncMiddleware(restController.addDriverZone));

router.post('/addProductStock', asyncMiddleware(restController.addProductStock));
router.post('/analytics/:restaurantId', asyncMiddleware(restController.analytics));
router.post('/hourlyInsight/:restaurantId', asyncMiddleware(restController.hourlyInsight));
router.post('/menuPerformance/:restaurantId', asyncMiddleware(restController.menuPerformance));
router.post('/postOrderInsight/:restaurantId', asyncMiddleware(restController.postOrderInsight));
router.post('/customerExperience/:restaurantId', asyncMiddleware(restController.customerExperience));
router.post('/orderToAccept/:restaurantId', asyncMiddleware(restController.orderToAccept));
router.post('/orderByNewCustomers/:restaurantId', asyncMiddleware(restController.orderByNewCustomers));
router.get('/courierDashboard/:restaurantId', asyncMiddleware(restController.courierDashboard));
module.exports = router;