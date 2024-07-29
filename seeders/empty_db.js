const mysql = require('mysql2');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: null,
    database: 'timm',
  };
  const pool = mysql.createPool(dbConfig);


  // List of tables to empty
const tablesToEmpty = ['comments', 'blacklists'];


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