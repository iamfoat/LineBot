const express = require("express");
const db = require('../db');
require('dotenv').config();

const getItem = async (req, res) => {
    const { orderId } = req.params;  //ดึงorderIdจากURL
    try {
        const [items] = await db.query(`
            SELECT Product.Product_name, 
                   Product.Price, 
                   Order_item.Quantity, 
                   (Product.Price * Order_item.Quantity) AS Subtotal  
            FROM Order_item
            JOIN Product ON Order_item.Product_id = Product.Product_id
            WHERE Order_item.Order_id = ?`, [orderId]); //ดึงเฉพาะออเดอร์ที่ต้องการ

        res.status(200).json(items);
    } catch (err) {
        console.error('Error fetching Order Items:', err);
        res.status(500).json({ error: 'Failed to fetch order items' });
    }
};


const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log(`🔄 Received orderId: ${orderId}, status: ${status}`);

    if (!orderId || orderId === "undefined") {  //ตรวจสอบorderId
        return res.status(400).json({ error: "Invalid orderId received" });
    }

    try {
        await db.query("UPDATE `Order` SET status = ? WHERE Order_id = ?", [status, orderId]);
        res.status(200).json({ message: `Order ${orderId} status updated to ${status}` });
    } catch (err) {
        console.error("Error updating order status:", err);
        res.status(500).json({ error: "Failed to update order status" });
    }
};


const updateItemStatus = async (req, res) => {
    const { orderItemId } = req.params;
    const { status } = req.body;

    try {
        await db.query("UPDATE Order_item SET status = ? WHERE Order_item_id = ?", [status, orderItemId]);
        res.status(200).json({ message: `Order item ${orderItemId} updated to ${status}` });
    } catch (err) {
        console.error("Error updating item status:", err);
        res.status(500).json({ error: "Failed to update item status" });
    }
};



module.exports = {
    getItem,
    updateOrderStatus,
    updateItemStatus
};