const express = require("express");
const db = require('../db');
const app = express();
const cors = require("cors");
require('dotenv').config();
const axios = require("axios");


const getOrder = async (req , res) => {
    try {
        const query = `
            SELECT 
                o.Order_id, 
                o.Customer_id, 
                COALESCE(c.Customer_Name, 'ไม่พบชื่อ') AS Customer_Name,  /* ✅ ป้องกันค่า NULL */
                o.Total_amount, 
                o.Customer_Address, 
                o.Create_at, 
                o.Status
            FROM orders o
            LEFT JOIN customers c ON o.Customer_id = c.Customer_id;


        `;

        const [orders] = await db.query(query);
        res.status(200).json(orders);
    } catch (err) {
        console.error('Error fetching Product: ', err);
        res.status(500).json({ error: 'Failed to fetch orders' })
    }
};

const createOrder = async (req, res) => {
    try {
        const { Customer_id, Customer_Address, Total_amount, Status } = req.body;
        if (!Customer_id || !Customer_Address || !Total_amount || !Status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const query = 'INSERT INTO `orders` (Customer_id, Customer_Address, Total_amount, created_at, Status) VALUES (?, ?, ?, ?, ?)';
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
    createOrder
};