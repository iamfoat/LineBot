// const mysql = require('mysql2/promise');
// require('dotenv').config();

// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     waitForConnections: true,  // จัดการคิวหากมีการเชื่อมต่อพร้อมกันหลายรายการ
//     connectionLimit: 10,       // จำกัดจำนวนการเชื่อมต่อพร้อมกันสูงสุด
//     queueLimit: 0              // ไม่มีการจำกัดคิว
// });

// module.exports = pool;

const mysql = require('mysql2/promise');

// การตั้งค่าการเชื่อมต่อ
const db = mysql.createPool({
    host: 'db',
    user: 'root',
    password: 'root',
    database: 'Linebot',
    port: 3306
});

module.exports = db;
