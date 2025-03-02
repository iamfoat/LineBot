const express = require("express");
const db = require('../db');
require('dotenv').config();


const getOrder = async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT 
                o.Order_id, 
                COALESCE(c.Customer_name, 'ไม่พบชื่อ') AS Customer_name, 
                o.Total_amount, 
                o.Customer_Address, 
                o.created_at, 
                o.Status
            FROM \`Order\` o
            LEFT JOIN \`Customer\` c ON o.Customer_id = c.Customer_id
        `);
        // console.log("Fetched Orders:", orders);
        res.status(200).json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

const createOrder = async (req, res) => {
    try {
        const { Customer_name, Customer_Address, Total_amount, Status } = req.body;
        if (!Customer_name || !Customer_Address || !Total_amount || !Status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // ค้นหา Customer_id จาก Customer_name
        const [customer] = await db.query('SELECT Customer_id FROM `Customer` WHERE Customer_name = ?', [Customer_name]);

        if (customer.length === 0) {
            return res.status(400).json({ error: 'Customer not found' });
        }

        const Customer_id = customer[0].Customer_id;

        // กำหนดค่า created_at เป็นเวลาปัจจุบัน
        const created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // บันทึกข้อมูลลงตาราง Order
        const query = 'INSERT INTO `Order` (Customer_id, Customer_Address, Total_amount, created_at, Status) VALUES (?, ?, ?, ?, ?)';
        const values = [Customer_id, Customer_Address, Total_amount, created_at, Status];

        await db.query(query, values);
        res.status(201).json({ message: 'Order created successfully' });
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
};


module.exports = {
    getOrder,
    createOrder,
    
};