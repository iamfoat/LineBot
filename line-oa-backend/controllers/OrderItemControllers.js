const express = require("express");
const db = require('../db');
require('dotenv').config();

const getItem = async (req, res) => {
    const { orderId } = req.params;
    try {
        const [items] = await db.query(`
            SELECT Product.Product_name, 
                   Product.Price, 
                   Order_item.Quantity, 
                   (Product.Price * Order_item.Quantity) AS Subtotal  
            FROM Order_item
            JOIN Product ON Order_item.Product_id = Product.Product_id
            WHERE Order_item.Order_id = ?`, [orderId]); // ✅ ดึงเฉพาะออเดอร์ที่ต้องการ

        res.status(200).json(items); 
    } catch (err) {
        console.error('Error fetching Order Items:', err);
        res.status(500).json({ error: 'Failed to fetch order items' });
    }
};


const createItem = async (req, res) => {

}

module.exports = {
    getItem
};