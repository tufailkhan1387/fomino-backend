const mysql = require("mysql2");
require("dotenv").config();

const configPath = '../config/config.json'; // Replace with actual path
const dbConfig = {
  host: "localhost",
  user: "myace_fomino",
  password: "GnewP@ss4131",
  database: "myace_fomino",
};
const pool = mysql.createPool(dbConfig);

// List of tables to empty
const tablesToEmpty = [
  "addOnCategories",
  "addOns",
  "addresses",
  "areaCharges",
  "Credits",
  "cuisines",
  "cutleries",
  "deliveryFees",
  "driverDetails",
  "driverRatings",
  "driverZones",
  "emailVerifications",
  "forgetPasswords",
  "menuCategories",
  "orderAddOns",
  "orderCharges",
  "orderCulteries",
  "orderGroups",
  "orderGroup_Items",
  "orderHistories",
  "orderItems",
  "restaurantEarnings",
  "driverEarnings",
  "orders",

  "payouts",
  "products",
  "pushNotifications",
  "P_AOLinks",
  "P_A_ACLinks",
  "restaurantDrivers",
  "restaurantRatings",
  "restaurants",

  "rolePermissions",
  "roles",
  "R_CLinks",
  "R_MCLinks",
  "R_PLinks",
  "tableBookings",
  "times",
  "users",
  "vehicleDetails",
  "vehicleImages",
  "vouchers",
  "wallets",
  "zoneRestaurants",

  "collections",
  "collectionAddons",
  "restaurant_culteries",
  "productCollections",
];

tablesToEmpty.forEach((table) => {
  const sql = `DELETE FROM ${table}`;

  pool.query(sql, (err, result) => {
    if (err) {
      console.error(`Error emptying ${table} table:`, err);
    } else {
      console.log(`${table} table emptied successfully.`);
    }
  });
});
