const express = require("express");
const router = express();
const userController = require("../controllers/admin");
const asyncMiddleware = require("../middlewares/async");
const validateAdmin = require("../middlewares/validateAdmin");
//Importing Multer
const multer = require("multer");
const path = require("path");
const cuisineStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `Public/Images/Cuisine`);
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
  storage: cuisineStorage,
});
//BY TUFAIL
router.get(
  "/testing_link",
  asyncMiddleware(userController.testing_link)
);
router.get(
  "/getAllDefaultValues",
  asyncMiddleware(userController.getAllDefaultValues)
);
router.post(
  "/updateDefaultValue",
  asyncMiddleware(userController.updateDefaultValue)
);
//BY TUFAIL
router.get(
  "/get_all_business_types",
  asyncMiddleware(userController.get_all_business_types)
);
router.get(
  "/all_order_applications",
  asyncMiddleware(userController.all_order_applications)
);
router.get(
  "/getRestaurantCuisines/:restaurantId",
  asyncMiddleware(userController.getRestaurantCuisines)
);
router.get(
  "/restaurant_culteries/:restaurantId",
  asyncMiddleware(userController.restaurant_culteries)
);
router.post(
  "/updateRestaurantCultery",
  upload.single("image"),
  asyncMiddleware(userController.updateRestaurantCultery)
);
router.post(
  "/updateRestaurantCuisine",
  upload.single("image"),
  asyncMiddleware(userController.updateRestaurantCuisine)
);

//Module 1 - Auth
//1. Add User Type

router.post("/addusertype", asyncMiddleware(userController.addUserType));
//2. Add Role
router.post("/addrole", asyncMiddleware(userController.addRole));
//3. Add User
router.post("/adduser", asyncMiddleware(userController.addUser));
//4. Login
router.post("/login", asyncMiddleware(userController.login));
//5. logout
router.get("/logout", validateAdmin, asyncMiddleware(userController.logout));
//6. Change password
router.post(
  "/cp",
  validateAdmin,
  asyncMiddleware(userController.changePassword)
);

router.get(
  "/getUnits",
  
  asyncMiddleware(userController.getUnits)
);

router.post(
  "/getWallet",
  validateAdmin,
  asyncMiddleware(userController.getWallet)
);

// MODULE 2 - Address
//1. Add Address Type
router.post("/addaddresstype", asyncMiddleware(userController.addAddressType));
//2. Get all Address Type
router.get("/getaddresstype", asyncMiddleware(userController.getAddressType));
//3. Delete Address type by ID
router.put(
  "/deleteaddresstype",
  asyncMiddleware(userController.deleteAddressType)
);
//3. Delete Address type by ID
router.put("/editaddresstype", asyncMiddleware(userController.editAddressType));

// MODULE 3: Restuarant
//1. Add Menu category
router.post(
  "/addmenucategory",
  asyncMiddleware(userController.addMenuCategory)
);
//1. Add Menu category for Store
router.post(
  "/addMenuCategoryStore",
  asyncMiddleware(userController.addMenuCategoryStore)
);
router.post("/add_permission", asyncMiddleware(userController.add_permission));
router.post(
  "/assign_permissions_to_role",
  asyncMiddleware(userController.assign_permissions_to_role)
);
router.post(
  "/update_role_permissions",
  asyncMiddleware(userController.update_role_permissions)
);
router.get(
  "/get_role_permissions/:roleId",
  asyncMiddleware(userController.get_role_permissions)
);
router.get("/get_permissions", asyncMiddleware(userController.get_permissions));
router.post("/changePermissionStatus", asyncMiddleware(userController.changePermissionStatus));
router.post("/updatePermission", asyncMiddleware(userController.updatePermission));
//2. Get all menu categories
router.get(
  "/getmenucategory",
  asyncMiddleware(userController.allMenuCategories)
);
router.get(
  "/allMenuCategoriesStore",
  asyncMiddleware(userController.allMenuCategoriesStore)
);
//2.1. Get active menu categories
router.get(
  "/activemenucategory",
  asyncMiddleware(userController.activeMenuCategories)
);
//3. Edit Menu category
router.put(
  "/editmenucategory",
  asyncMiddleware(userController.editMenuCategories)
);
//4. Change status of meny categories
router.put(
  "/changestatusmenucategory",
  asyncMiddleware(userController.changeStatusMenuCategories)
);

//5. Add Cuisine
//Chosing destination for Cuisine Images

router.post(
  "/addcuisine",
  upload.single("cuisine"),
  asyncMiddleware(userController.addCuisine)
);
router.post(
  "/addCuisineStore",
  upload.single("cuisine"),
  asyncMiddleware(userController.addCuisineStore)
);
//6. Get All cuisines
router.get("/getcuisines", asyncMiddleware(userController.getAllCuisines));
router.get("/getAllCuisinesStore", asyncMiddleware(userController.getAllCuisinesStore));
//6.1. active cuisines
router.get(
  "/activecuisines/:restId",
  asyncMiddleware(userController.getActiveCuisines)
);
//7. Edit Cuisine
router.put(
  "/editcuisine",
  upload.single("cuisine"),
  asyncMiddleware(userController.editCuisine)
);
//8. Change Cuisine Status
router.put(
  "/changecuisinestatus",
  asyncMiddleware(userController.changeCuisineStatus)
);
//9. Add Payment method
router.post(
  "/addpaymentmethod",
  asyncMiddleware(userController.addPaymentMethod)
);
//10. Get all payment methods
router.get(
  "/getpaymentmethods",
  asyncMiddleware(userController.getAllPaymentMethods)
);
//10.1. Get active payment methods
router.get(
  "/activepaymentmethods",
  asyncMiddleware(userController.getactivePaymentMethods)
);
//11. Edit Cuisine
router.put(
  "/editpaymentmethod",
  asyncMiddleware(userController.editPaymentMethod)
);
//12. Change Cuisine Status
router.put(
  "/changepaymentmethodstatus",
  asyncMiddleware(userController.changePaymentMethodStatus)
);

//13. Add delivery type
router.post(
  "/adddeliverytype",
  asyncMiddleware(userController.addDeliveryType)
);
//14. Active delivery Type
router.get(
  "/activedeliverytype",
  asyncMiddleware(userController.activeDeliveryTypes)
);

//15. Add delivery Fee type
router.post(
  "/adddeliveryfeetype",
  asyncMiddleware(userController.addDeliveryFeeType)
);
//16. Get active delivery Fee type
router.get(
  "/activedeliveryfeetype",
  asyncMiddleware(userController.activeDeliveryFeeType)
);

//17. Add unit
router.post("/addunit", asyncMiddleware(userController.addUnit));
//18. get all units
router.get("/getallunits", asyncMiddleware(userController.getAllUnits));
router.get(
  "/getallactiveunits",
  asyncMiddleware(userController.getAllActiveUnits)
);
//19. Get specific unit by type
router.get(
  "/getspecificunits/:type",
  asyncMiddleware(userController.getSpecificUnits)
);
//20. Edit Unit
router.put("/editunit", asyncMiddleware(userController.editUnit));
//20. Change Unit Status
router.put(
  "/changeunitstatus",
  asyncMiddleware(userController.changeUnitStatus)
);
router.post(
  "/updateUnit",
  asyncMiddleware(userController.updateUnit)
);

//16. Add restaurant
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
router.post(
  "/addrestaurant",
  restaurantUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  asyncMiddleware(userController.addRestaurant)
);

//17. Get all restaurants
router.get(
  "/getallrestaurants",
  asyncMiddleware(userController.getAllRestaurants)
);
router.get(
  "/getAllStores",
  asyncMiddleware(userController.getAllStores)
);
router.post(
  "/getallrelatedrestaurants",
  asyncMiddleware(userController.getAllRelatedRestaurants)
);

//18. Edit Restaurant
//get general restaurant data
router.get(
  "/getgenrestaurant/:id",
  asyncMiddleware(userController.getResGeneral)
);
// 18.1 Edit Restaurant data - General
router.put(
  "/editrestaurantgeneral",
  asyncMiddleware(userController.editResGeneral)
);
//get Meta Data restaurant data
router.get(
  "/getmetadatarestaurant/:id",
  asyncMiddleware(userController.getResMetaData)
);
// 18.2 Edit Restaurant data - Meta Data
router.put(
  "/editrestaurantmetadata",
  asyncMiddleware(userController.editResMetaData)
);
router.get(
  "/getRestaurantProducts/:restaurantId",
  asyncMiddleware(userController.getRestaurantProducts)
);
//get delivery settings restaurant data
router.get(
  "/getdeliverysettingrestaurant/:id",
  asyncMiddleware(userController.getResDeliverySettings)
);
// 18.3 Edit Restaurant data - Delivery Settings
router.put(
  "/editrestaurantdeliverysettings",
  asyncMiddleware(userController.editResDeliverySettings)
);
//get payment settings restaurant data
router.get(
  "/getpaymentsettingrestaurant/:id",
  asyncMiddleware(userController.getResPaymentSettings)
);
// 18.4 Edit Restaurant data - Payment Settings
router.put(
  "/editrestaurantpaymentsettings",
  asyncMiddleware(userController.editResPaymentSettings)
);
//get charges restaurant data
router.get(
  "/getchargesrestaurant/:id",
  asyncMiddleware(userController.getResCharges)
);
// 18.5 Edit Restaurant data - Payment Settings
router.put(
  "/editrestaurantcharges",
  asyncMiddleware(userController.editResCharges)
);
//get images restaurant data
router.get(
  "/getimagesrestaurant/:id",
  asyncMiddleware(userController.getResImages)
);
// 18.5 Edit Restaurant data - Payment Settings
router.put(
  "/editrestaurantimages",
  restaurantUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  asyncMiddleware(userController.editResImages)
);

//19. Change restaurant status
router.put(
  "/changerestaurantstatus",
  asyncMiddleware(userController.changeRestaurantStatus)
);
//20. Get Menu settings for restaurant
router.get(
  "/getmenusettingsrestaurant/:id",
  asyncMiddleware(userController.getMenuSettings)
);
//20. Update Menu settings for restaurant
router.post(
  "/updatemenusettings",
  asyncMiddleware(userController.updateMenuSettings)
);
router.post(
  "/updatecuisinesettings",
  asyncMiddleware(userController.updatecuisineSettings)
);

// Module 4
//1. Get restautant for adding product
router.get(
  "/restforproduct",
  asyncMiddleware(userController.allRestaurantsforProd)
);
//1. Get Stores for adding product
router.get(
  "/allStoresforProd",
  asyncMiddleware(userController.allStoresforProd)
);
//2. Get restautant for adding product
router.get(
  "/rmcidforproduct/:id",
  asyncMiddleware(userController.menuCategoriesOfRestaurant)
);
//3. Add Product
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `Public/Images/Product`);
  },
  filename: (req, file, cb) => {
    //console.log(req.body)
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
const productUpload = multer({
  storage: productStorage,
});
router.post(
  "/addproduct",
  productUpload.single("image"),
  asyncMiddleware(userController.addProduct)
);
//4. Get All products
router.get("/allproducts", asyncMiddleware(userController.getAllProducts));
router.get("/getAllProductsStore", asyncMiddleware(userController.getAllProductsStore));
//5. Get product by ID
router.get("/productby/:id", asyncMiddleware(userController.getProductbyId));
//6. Add addon category for Restaurant
router.post(
  "/addaddoncategory",
  asyncMiddleware(userController.addAddonCategory)
);
//6. Add addon category for Store
router.post(
  "/addAddonCategoryStore",
  asyncMiddleware(userController.addAddonCategoryStore)
);
//7. Get all active addon categories
router.get(
  "/activeaddoncategories",
  asyncMiddleware(userController.getAddOnCats)
);
router.get(
  "/getAddOnCatsStore",
  asyncMiddleware(userController.getAddOnCatsStore)
);
//8. Add AddOn for restaurant
router.post("/addaddon", asyncMiddleware(userController.addAddon));
//8. Add AddOn for store
router.post("/addaddonStore", asyncMiddleware(userController.addaddonStore));
//9. Get all active addon categories
router.get("/activeaddons", asyncMiddleware(userController.getAddOns));
//10. Assign AddOn to product
router.post("/assignaddon", asyncMiddleware(userController.assignAddOnProd));
//11. Change product status
router.put(
  "/changestatusproduct/:id",
  asyncMiddleware(userController.changeProductStatus)
);
//12. Change product Data
router.put(
  "/updateproduct/:id",
  productUpload.single("image"),
  asyncMiddleware(userController.updateProduct)
);
//13. Change product AddOns
router.put(
  "/updateproductaddon",
  asyncMiddleware(userController.updateProductAddOn)
);
//13. Change product AddOns
router.put(
  "/changestatuspac",
  asyncMiddleware(userController.changeStatusOfProdAddOnCat)
);

//Module 5
//1. Get all users
router.get("/allusers", asyncMiddleware(userController.getAllUsers));
// 2. Get all customers
router.get("/allcustomers", asyncMiddleware(userController.getAllCustomers));
// 3. Get all customers
router.get("/alldrivers", asyncMiddleware(userController.getAllDrivers));
// 4. Get all employees
router.get("/allemployees", asyncMiddleware(userController.getAllEmployees));

// 6. Get all Active Roles
router.get(
  "/allactiveroles",
  asyncMiddleware(userController.getAllActiveRoles)
);
router.get(
  "/allRoles",
  asyncMiddleware(userController.allRoles)
);
router.post(
  "/roleDetails",
  asyncMiddleware(userController.roleDetails)
);
router.post(
  "/changeStatusOfRole",
  asyncMiddleware(userController.changeStatusOfRole)
);
router.get(
  "/get_module_types",
  asyncMiddleware(userController.get_module_types)
);
// 7. Get customer and employee details using ID
router.get(
  "/userdetails/:id",
  asyncMiddleware(userController.getCustEmpDetails)
);
// 8. Get driver details using ID
router.get(
  "/driverdetails/:id",
  asyncMiddleware(userController.getDriverDetails)
);
// 9.  Update user details using ID
router.put(
  "/updateuserdetails/:id",
  asyncMiddleware(userController.updateUserDetails)
);
// 10. Ban user using ID
router.put("/banuser/:id", asyncMiddleware(userController.banUser));
// 11. Approve user using ID
router.put("/approveuser/:id", asyncMiddleware(userController.approveUser));
// 12. Approve user using ID
router.get(
  "/activeroleswithtype",
  asyncMiddleware(userController.allActiveRoleswithType)
);
// 13. Update user role using ID
router.put("/updaterole/:id", asyncMiddleware(userController.updateRole));
//14. Get all restaurant owners
router.get("/allrestowners", asyncMiddleware(userController.getAllRestOwners));
router.get(
  "/getAllStoreOwners",
  asyncMiddleware(userController.getAllStoreOwners)
);

// Module 6
// 1. Get all add-on categories
router.get("/alladdoncats", asyncMiddleware(userController.getAllAddOnCats));
// 2. Update add-on category
router.put(
  "/updateaddoncat/:id",
  asyncMiddleware(userController.updateAddOnCat)
);
// 3. Change status of add-on categories
router.put(
  "/statusaddoncat/:id",
  asyncMiddleware(userController.changeAddOnCatStatus)
);
// 4. Get all add-on categories
router.get("/alladdon", asyncMiddleware(userController.getAllAddOn));
router.get("/getAllAddOnStore", asyncMiddleware(userController.getAllAddOnStore));
// 2. Update add-on category
router.put("/updateaddon/:id", asyncMiddleware(userController.updateAddOn));
// 3. Change status of add-on categories
router.put(
  "/statusaddon/:id",
  asyncMiddleware(userController.changeAddOnStatus)
);

// Module - Taxi App
//1. Add Vehicle Type
const VehicleTypeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `Public/Images/VehicleType`);
  },
  filename: (req, file, cb) => {
    //console.log(req.body)
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
const VehicleTypeUpload = multer({
  storage: VehicleTypeStorage,
});
router.post(
  "/addvehicletype",
  VehicleTypeUpload.single("image"),
  asyncMiddleware(userController.addVehicleType)
);

//2. Get all vehicles
router.get("/allvehicletype", asyncMiddleware(userController.getAllVehicles));
//3. Change vehicle Status
router.put(
  "/changestatusvehicle",
  asyncMiddleware(userController.changeStatusVehicle)
);
//4. Update vehicle
router.put(
  "/updatevehicle",
  VehicleTypeUpload.single("image"),
  asyncMiddleware(userController.updateVehicle)
);

//Module - Orders

//1. Get All Orders
router.get("/allorders", asyncMiddleware(userController.getAllOrders));
router.get(
  "/getAllOrdersTaxi",
  asyncMiddleware(userController.getAllOrdersTaxi)
);
router.get(
  "/getScheduledOrdersTaxi",
  asyncMiddleware(userController.getScheduledOrdersTaxi)
);
router.get(
  "/getCompletedOrdersTaxi",
  asyncMiddleware(userController.getCompletedOrdersTaxi)
);
//2.  Get order details using Id
router.post(
  "/orderdetailbyid",
  asyncMiddleware(userController.getOrderDetails)
);

//Module - Order Management
//1. Accept Order by restaurant
router.get("/acceptorder/:id", asyncMiddleware(userController.acceptOrder));
//2. Decline order by restaurant
router.get("/declineorder/:id", asyncMiddleware(userController.acceptOrder));
//3. ContactUs Email
router.post("/contactUsEmail", asyncMiddleware(userController.contactUsEmail));
//3. ContactUs Phone
router.post("/contactUsPhone", asyncMiddleware(userController.contactUsPhone));
// Module 9 - Promotions
// 1. Add Voucher
router.post("/addvoucher", asyncMiddleware(userController.addVoucher));
// 2. Get all vouchers
router.get("/allvouchers", asyncMiddleware(userController.getAllVouchers));
// 3. Change Voucher status
router.put(
  "/changevoucherstatus",
  asyncMiddleware(userController.changeStatusOfVoucher)
);
// 4. Update Voucher
router.put("/updatevoucher", asyncMiddleware(userController.updateVoucher));
// 5. Voucher assocaited Rest
router.get(
  "/voucherrest/:id",
  asyncMiddleware(userController.voucherAssocaitedRest)
);
// 5. Send Push notifications
router.post(
  "/pushnotifications",
  asyncMiddleware(userController.pushNotifications)
);
// 6. Get all notifications send by admin
router.get(
  "/getallpushnotifications",
  asyncMiddleware(userController.getAllPushNot)
);

// Module 10 - Dashbaord
//1. Stats
router.get("/statsadmin", asyncMiddleware(userController.dashbaordStats));
router.get("/topitems", asyncMiddleware(userController.topItems));

// Module 11
//1. All restauranst earnings
router.get(
  "/earnginsbyrestaurant",
  asyncMiddleware(userController.earningAllRestaurants)
);
//2. All payout request by a restaurant
router.get(
  "/payoutrequests/:id",
  asyncMiddleware(userController.payoutRequestsByRest)
);

//Get Charges
router.get("/get_charges", asyncMiddleware(userController.get_charges));
//Update Charges
router.post("/update_charge", asyncMiddleware(userController.update_charge));

//Get Social Links
router.get(
  "/get_social_links",
  asyncMiddleware(userController.get_social_links)
);
//Update Social Links
router.post(
  "/update_social_links",
  asyncMiddleware(userController.update_social_links)
);

//Get App Links
router.get("/get_app_links", asyncMiddleware(userController.get_app_links));
//Update App Links
router.post(
  "/update_app_links",
  asyncMiddleware(userController.update_app_links)
);

//Get App Pages
router.get("/get_app_pages", asyncMiddleware(userController.get_app_pages));
//Update App Pages
router.post(
  "/update_app_pages",
  asyncMiddleware(userController.update_app_pages)
);
router.get(
  "/getAllZones",
  asyncMiddleware(userController.getAllZones)
);
router.post(
  "/addZone",
  asyncMiddleware(userController.addZone)
);
router.post(
  "/changeZoneStatus",
  asyncMiddleware(userController.changeZoneStatus)
);
router.post(
  "/updateZone",
  asyncMiddleware(userController.updateZone)
);
router.post(
  "/sendingNotification",
  asyncMiddleware(userController.sendingNotification)
);
router.get(
  "/getDataForAddingRestaurant",
  asyncMiddleware(userController.getDataForAddingRestaurant)
);

module.exports = router;
