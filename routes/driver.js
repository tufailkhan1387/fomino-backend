const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express();
const driverController = require('../controllers/driver');
const asyncMiddleware = require('../middlewares/async');
const validateToken = require('../middlewares/validateToken');

let x = 1;

const uploadimage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, `./Public/Images/Driver`)
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + '-' + x++ + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: uploadimage,
});

//Module 1 - Auth
//1. Register step 1
router.post('/register/profile', upload.single('profile_image'), asyncMiddleware(driverController.registerDriverSt1));
//2. Register step 2
router.post('/register/step2/profile',upload.fields([{ name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 },{ name: 'left', maxCount: 1 },{ name: 'right', maxCount: 1 },
        {
            name:'document_front',
            maxCount: 1
        },
        {
            name:'document_back',
            maxCount: 1
        }]), asyncMiddleware(driverController.registerDriverSt2)
);
// router.post('/register/step2/profile',upload.fields([
//     { name:'vehicle_images', maxCount: 10},
//     { name:'vehicledocuments', maxCount: 10}]), asyncMiddleware(driverController.registerDriverSt2)
// );
//3. Register step 3
router.post('/register/step3/profile',upload.fields([
    { name:'licFrontPhoto', maxCount: 1},
    { name:'licBackPhoto', maxCount: 1}]), asyncMiddleware(driverController.registerDriverSt3)
);
//4. Register step 4: Add address
router.post('/addAddress', asyncMiddleware(driverController.addAddress));
router.post('/addDriverZone', asyncMiddleware(driverController.addDriverZone));
router.post('/driverAddress',validateToken, asyncMiddleware(driverController.driverAddress));
router.get('/dataForDriverRegistration', asyncMiddleware(driverController.dataForDriverRegistration));
//5. Verify Email
router.post('/verifyemail', asyncMiddleware(driverController.verifyEmail));
//6. Resend OTP
router.post('/resendotp', asyncMiddleware(driverController.resendOTP));
//7. Login
router.post('/login', asyncMiddleware(driverController.login));
//8. Forget password using email 
router.post('/forgetpasswordrequest', asyncMiddleware(driverController.forgetPasswordRequest));
//9. Change password using OTP
router.post('/forgetpasswordresponse', asyncMiddleware(driverController.changePasswordOTP));
//10. Session
router.get('/session', validateToken ,asyncMiddleware(driverController.session));
//11. logout  
router.get('/logout', validateToken ,asyncMiddleware(driverController.logout));
//Module 2:  Drawer 
//1. Get Profile
router.get('/getprofile', validateToken, asyncMiddleware(driverController.getProfile));
//2. Update Profile 
router.post('/updateprofile', validateToken, upload.single('profile_image'), asyncMiddleware(driverController.updateProfile));
//3. Update profile photo
//router.post('/updateProfilePhoto', validateToken, upload.single('profile_image'), asyncMiddleware(driverController.updateProfilePhoto));
//4. Change password using old password
router.post('/changepassword', validateToken, asyncMiddleware(driverController.changePassword));
//5. Update license
router.post('/updateLicense', validateToken, upload.fields(
    [
        {
            name:'licFrontPhoto',
            maxCount: 1
        },
        {
            name:'licBackPhoto',
            maxCount: 1
        }
    ]), asyncMiddleware(driverController.updateLicense));


router.post('/updateVehicleDetails', asyncMiddleware(driverController.updateVehicleDetails));

router.post('/updateVehicleDetailsImages',upload.fields([{ name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 },{ name: 'left', maxCount: 1 },{ name: 'right', maxCount: 1 }]),
    asyncMiddleware(driverController.updateVehicleDetailsImages));
// router.post('/updateVehicleDetailsImages',upload.fields(
//     [
//         {
//             name:'vehicle_images',
//             maxCount: 10
//         },
//     ]),
//     asyncMiddleware(driverController.updateVehicleDetailsImages));

router.post('/updateVehicleDetailsDocuments',upload.fields(
    [
        {
            name:'document_front',
            maxCount: 1
        },
        {
            name:'document_back',
            maxCount: 1
        },
    ]),
    asyncMiddleware(driverController.updateVehicleDetailsDocuments));
// router.post('/updateVehicleDetailsDocuments',upload.fields(
//     [
//         {
//             name:'vehicledocuments',
//             maxCount: 10
//         },
//     ]),
//     asyncMiddleware(driverController.updateVehicleDetailsDocuments));

router.get('/getService',asyncMiddleware(driverController.getService));

router.get('/getvehicletype',asyncMiddleware(driverController.getVehicleType));

router.post('/getorderdetail', validateToken, asyncMiddleware(driverController.getorderdetail));

router.get('/getActiveOrders', validateToken, asyncMiddleware(driverController.getActiveOrders));

router.get('/getActiveOrdersTaxi', validateToken, asyncMiddleware(driverController.getActiveOrdersTaxi));

router.get('/getVehicleDetails', validateToken, asyncMiddleware(driverController.getVehicleDetails));

router.get('/getPaidOrdersRestaurant', validateToken, asyncMiddleware(driverController.getPaidOrdersRestaurant));

router.get('/getPaidOrdersTaxi', validateToken, asyncMiddleware(driverController.getPaidOrdersTaxi));

router.post('/acceptorder', validateToken, asyncMiddleware(driverController.acceptorder));

router.post('/reached', validateToken, asyncMiddleware(driverController.reached));

router.post('/foodPickedUp', validateToken, asyncMiddleware(driverController.foodPickedUp));

router.post('/foodArrived', validateToken, asyncMiddleware(driverController.foodArrived));

router.post('/onTheWay', validateToken, asyncMiddleware(driverController.onTheWay));

router.post('/delivered', validateToken, asyncMiddleware(driverController.delivered));

router.post('/ride_start', validateToken, asyncMiddleware(driverController.ride_start));

router.post('/ride_cancel', validateToken, asyncMiddleware(driverController.ride_cancel));

router.post('/ride_end', validateToken, asyncMiddleware(driverController.ride_end));

router.post('/addBank',validateToken,asyncMiddleware(driverController.addBank));

router.get('/getBank',validateToken,asyncMiddleware(driverController.getBank));

router.get('/getEarning',validateToken,asyncMiddleware(driverController.getEarning));

router.post('/gethome',validateToken, asyncMiddleware(driverController.getHome));

router.get('/getRating', validateToken, asyncMiddleware(driverController.getRating));

router.get('/getLicense', validateToken, asyncMiddleware(driverController.getLicense));

router.get('/deleteData', validateToken, asyncMiddleware(driverController.deleteData));

router.get('/contactus', asyncMiddleware(driverController.contactus));

router.post('/create_new_charge_stripe', asyncMiddleware(driverController.create_new_charge_stripe));

router.post('/create_old_charge_stripe', asyncMiddleware(driverController.create_old_charge_stripe));

router.post('/get_stripe_cards', asyncMiddleware(driverController.get_stripe_cards));

router.post('/create_new_charge_flutterwave', asyncMiddleware(driverController.create_new_charge_flutterwave));

router.post('/charge_ghana_mobile_money', asyncMiddleware(driverController.charge_ghana_mobile_money));
router.post('/declineOrder',validateToken, asyncMiddleware(driverController.declineOrder));


module.exports = router;