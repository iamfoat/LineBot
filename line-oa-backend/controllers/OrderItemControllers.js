const db = require('../db');
require('dotenv').config();
const axios = require("axios");

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};


const getItem = async (req, res) => {
    const { orderId } = req.params;  //ดึงorderIdจากURL
    try {
        const [items] = await db.query(`
             SELECT oi.Order_item_id, 
                    p.Product_name, 
                    p.Price, 
                    oi.Quantity, 
                    oi.Subtotal, 
                    oi.Status, 
                    o.Status AS Order_status
            FROM Order_item oi
            JOIN Product p ON oi.Product_id = p.Product_id
            JOIN \`Order\` o ON oi.Order_id = o.Order_id
            WHERE oi.Order_id = ?`, [orderId]); //ดึงเฉพาะออเดอร์ที่ต้องการ

        res.status(200).json(items);
    } catch (err) {
        console.error('Error fetching Order Items:', err);
        res.status(500).json({ error: 'Failed to fetch order items' });
    }
};

const SendNotification = async (orderId) => {
    try {
        // 🔥 ดึงข้อมูลลูกค้า (เช่น LINE User ID) จากฐานข้อมูล
        const [order] = await db.query("SELECT Customer_id, status FROM `Order` WHERE Order_id = ?", [orderId]);
        
        if (order.length === 0) {
            console.error(`❌ Order ID ${orderId} not found!`);
            return;
        }

        const customerId = order[0].Customer_id; 

        const message = {
            to: customerId,
            messages: [
                {
                    type: "flex",
                    altText: "เลือกวิธีการชำระเงิน",
                    contents: {
                        type: "bubble",
                        body: {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                { type: "text", text: "🚚 สินค้ากำลังไปส่ง!", weight: "bold", size: "xl" },
                                { type: "text", text: "กรุณาเลือกวิธีการชำระเงิน", margin: "md" }
                            ]
                        },
                        footer: {
                            type: "box",
                            layout: "horizontal",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "button",
                                    style: "primary",
                                    color: "#1DB446",
                                    action: {
                                        type: "postback",
                                        label: "💵 เงินสด",
                                        data: JSON.stringify({ action: "payment", method: "cash", customerId, orderId })
                                    }
                                },
                                {
                                    type: "button",
                                    style: "primary",
                                    color: "#1DA1F2",
                                    action: {
                                        type: "postback",
                                        label: "💳 โอนเงิน",
                                        data: JSON.stringify({ action: "payment", method: "transfer", customerId, orderId })
                                    }
                                }
                            ]
                        }
                    }
                }
            ]
        };



        await axios.post("https://api.line.me/v2/bot/message/push", message, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.channelAccessToken}`
            }
        });

        console.log(`✅ Notification sent to Customer ${customerId} (LINE ID: ${customerId})`);
    } catch (err) {
        console.error("❌ Error sending LINE notification:", err);
    }
};


const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    // console.log(`🔄 Received orderId: ${orderId}, status: ${status}`);

    if (!orderId || orderId === "undefined") {  //ตรวจสอบorderId
        return res.status(400).json({ error: "Invalid orderId received" });
    }

    try {
        await db.query("UPDATE `Order` SET status = ? WHERE Order_id = ?", [status, orderId]);

        if (status === "Out for Delivery") {
            console.log(`📩 Sending LINE notification for Order ${orderId}`);
            await SendNotification(orderId);
        }

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

        // ตรวจสอบค่าหลังจากอัปเดต
        const [updatedItem] = await db.query("SELECT status FROM Order_item WHERE Order_item_id = ?", [orderItemId]);
        console.log(`✅ Order Item ${orderItemId} in DB is now:`, updatedItem[0].status); // ✅ Debug

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