const mysql = require("mysql2")
const fs = require("fs")

// Load .env variables
require("dotenv").config()

// Read SQL seed query
const seedQuery = fs.readFileSync("./setup.sql", {
  encoding: "utf-8",
})
//console.log(seedQuery)

// Connect to database
const connection = mysql.createConnection({
  host:"localhost",
  user: "myace_fomino",
  password: "GnewP@ss4131",
  database: "myace_fomino",
  multipleStatements: true, // IMPORTANT
})

connection.connect()
console.log("Running SQL seed...")

// Run seed query
connection.query(seedQuery, err => {
  if (err) {
    console.log(err);
    throw err 
  }

  console.log("SQL seed completed!")
  connection.end()
})