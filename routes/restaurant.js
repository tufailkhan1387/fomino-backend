const express = require('express');
const router = express();
const restController = require('../controllers/restaurant');
const asyncMiddleware = require('../middlewares/async');
const validateAdmin = require('../middlewares/validateAdmin');
//Importing Multer
const multer = require('multer')
const path = require('path');
const validateToken = require('../middlewares/validateToken');

//Module 1 - Auth
//1. Restaurant signup
router.post('/signup', asyncMiddleware(restController.restSignUp));
//2. Restaurant signIn
router.post('/signin', asyncMiddleware(restController.restSignIn));

router.get('/session', validateToken, asyncMiddleware(restController.session));

//Module 2. Stores
router.get('/getallby/:id', asyncMiddleware(restController.getAllRest));
router.get('/getallproductsby/:restid', asyncMiddleware(restController.getAllProdByRest));
router.get('/getallcuisinesby/:restid', asyncMiddleware(restController.getAllCuisineByRest));
router.get('/getallordersby/:restid', asyncMiddleware(restController.getAllOrdersByRest));
router.get('/getratingby/:restid', asyncMiddleware(restController.getRatingByRest));

//Module 3 Order Managment
//1. Get orders by status
router.get('/getorders/:userid/:status', asyncMiddleware(restController.getNewOrders));
//2. Get All status for restaurant
router.get('/getstatus', asyncMiddleware(restController.getStatus));
//3. Change order status
router.put('/changeorderstatus', asyncMiddleware(restController.changerOrderStatus));

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
router.post('/accepttablebooking/:id', asyncMiddleware(restController.accepttablebooking));
router.post('/rejecttablebooking/:id', asyncMiddleware(restController.rejecttablebooking));
  

module.exports = router;