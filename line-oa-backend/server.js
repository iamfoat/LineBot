require('dotenv').config();
const express = require('express');
const app = express();
const { exec } = require("child_process");
const line = require('@line/bot-sdk');
const db = require('./db');
const productRoutes = require('./routes/ProductRoutes');
const orderRoutes = require('./routes/OrderRoutes')
const orderitemRoutes = require('./routes/OrderItemRoutes')
const cors = require('cors')
const axios = require("axios");
const cron = require("node-cron");
const { sendMenuToLine } = require("./controllers/ProductControllers");
const path = require("path");


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/api/products', productRoutes);
app.use("/uploads", express.static("uploads"));
app.use('/api/orders',orderRoutes)
app.use('/api',orderitemRoutes)


const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

if (!config.channelAccessToken || !config.channelSecret) {
    throw new Error("Missing CHANNEL_ACCESS_TOKEN or CHANNEL_SECRET in .env file");
}

const client = new line.Client(config);
const pendingOrders = {};


app.get('/', (req, res) => {
    res.send('Hello, LINE OA is running!');
});

async function getUserProfile(userId) {
    try {
        const response = await axios.get(`https://api.line.me/v2/bot/profile/${userId}`, {
            headers: {
                "Authorization": `Bearer ${config.channelAccessToken}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error getting user profile:", error);
        return null;
    }
}

app.post('/webhook', async (req, res) => {
    const events = req.body.events;

    for (let event of events) {
        // ✅ ตรวจจับข้อความที่ลูกค้าพิมพ์เข้ามา
        if (event.type === 'message' && event.message.type === "text") {
            let customerId = event.source.userId;
            let customerName = null;
            let customerText = event.message.text;
            

            if (event.source.type === "group") {
                customerId = event.source.groupId; // ใช้ `groupId` เป็น `Customer_id`
                customerName = "Group Chat";
                // console.log("ได้รับข้อความจาก Group ID:", customerId);

            } else if (event.source.type === "user") {
                customerId = event.source.userId; // ใช้ `userId` เป็น `Customer_id`
                // console.log("ได้รับข้อความจาก User ID:", customerId);

                //ดึงข้อมูลโปรไฟล์
                const profile = await getUserProfile(customerId);
                if (profile) {
                    customerName = profile.displayName;
                }
            }

            try {
                // ✅ บันทึกลูกค้าในฐานข้อมูล
                await db.query(
                    `INSERT INTO Customer (Customer_id, Customer_name) 
                     VALUES (?, ?) 
                     ON DUPLICATE KEY UPDATE Customer_name = VALUES(Customer_name)`,
                    [customerId, customerName]
                );
                console.log(`✅ บันทึก ${customerId} ลงฐานข้อมูลเรียบร้อย`);

                // ✅ 2. เรียก Model วิเคราะห์คำสั่งซื้อ
                const modelPath = path.join(__dirname, "..", "Model", "NLP.py");
                exec(`python "${modelPath}" "${customerText}"`, async (error, stdout) => {
                    if (error) {
                        console.error("❌ Error running model:", error);
                        return;
                    }

                    let orders;
                    try {
                        orders = JSON.parse(stdout);
                    } catch (parseError) {
                        console.error("❌ JSON Parse Error:", parseError);
                        await client.replyMessage(event.replyToken, { type: "text", text: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
                        return;
                    }

                    if (!Array.isArray(orders) || orders.length === 0) {
                        return;
                    }

                    let totalAmount = 0;
                    for (let order of orders) {
                        const [rows] = await db.query("SELECT Price FROM Product WHERE Product_id = ?", [order.product_id]);
                        if (!rows.length || !rows[0].Price) continue;
                        let price = parseFloat(rows[0].Price);
                        let subtotal = price * order.quantity;
                        totalAmount += subtotal;
                    }

                    if (totalAmount === 0) {
                        return; 
                    }

                    // ✅ ส่งปุ่มให้ลูกค้ายืนยัน
                    const confirmMessage = {
                        type: "flex",
                        altText: "กรุณายืนยันคำสั่งซื้อ",
                        contents: {
                            type: "bubble",
                            body: {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                    { type: "text", text: "ยืนยันคำสั่งซื้อ", weight: "bold", size: "xl" },
                                    ...orders.map(order => ({
                                        type: "text",
                                        text: `- ${order.menu} x ${order.quantity} แก้ว`,
                                        wrap: true
                                    })),
                                    { type: "text", text: `ยอดรวม: ${totalAmount} บาท`, weight: "bold" }
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
                                            label: "Confirm",
                                            data: JSON.stringify({ action: "confirm", orders, totalAmount, customerId })
                                        }
                                    },
                                    {
                                        type: "button",
                                        style: "secondary",
                                        action: {
                                            type: "postback",
                                            label: "Cancel",
                                            data: JSON.stringify({ action: "cancel", customerId })
                                        }
                                    }
                                ]
                            }
                        }
                    };
                    
                    await client.replyMessage(event.replyToken, confirmMessage);

                });

                
                if (customerText.toLowerCase() === "แก้ไข") {
                    // 🔍 ดึง Order ล่าสุดที่สถานะเป็น "Preparing"
                    const [pendingOrder] = await db.query(
                        "SELECT Order_id FROM `Order` WHERE Customer_id = ? AND Status = 'Preparing' ORDER BY Order_id DESC LIMIT 1",
                        [customerId]
                    );
                
                    if (pendingOrder.length > 0) {
                        await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: "📍 กรุณาพิมพ์ที่อยู่ใหม่ของคุณเพื่อใช้ในการจัดส่ง",
                        });
                
                        // ✅ เก็บ Order_id ไว้เพื่อติดตามออเดอร์ที่ต้องแก้ไข
                        pendingOrders[customerId] = pendingOrder[0].Order_id;

                    } else {
                        await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: "⛔ คุณไม่มีออเดอร์ที่สามารถแก้ไขที่อยู่ได้",
                        });
                    }
                }
                
                // ✅ เมื่อลูกค้าพิมพ์ที่อยู่ใหม่ (หลังจากพิมพ์ "แก้ไข")
                else if (pendingOrders[customerId]) {
                    let orderId = pendingOrders[customerId];
                
                    // 🔄 อัปเดตที่อยู่ในฐานข้อมูล
                    await db.query(
                        "UPDATE `Order` SET Customer_Address = ? WHERE Order_id = ?",
                        [customerText, orderId]
                    );
                
                    // 🚀 แจ้งให้ลูกค้าทราบว่าที่อยู่ถูกอัปเดตแล้ว
                    await client.replyMessage(event.replyToken, {
                        type: "text",
                        text: `🏠ที่อยู่ของคุณได้รับการอัปเดตเป็น:\n${customerText}`,
                    });
                
                    await client.pushMessage(customerId, {
                        type: "text",
                        text: `📦 ที่อยู่ของคุณถูกอัปเดตเรียบร้อย!\nร้านค้ากำลังทำรายการสั่งซื้อ\nหากต้องการแก้ไขที่อยู่ พิมพ์ "แก้ไข"`,
                    });
                
                    // ✅ ล้างค่าหน่วยความจำ
                    delete pendingOrders[customerId];
                }
                
                
                
            }catch (error) {
                console.error("❌ Error handling order request:", error);
            }

        }

        else if (event.type === "postback") {
            let data;
            try {
                data = JSON.parse(event.postback.data);
            } catch (error) {
                console.error("❌ JSON Parse Error in postback:", error);
                return;
            }

            if (data.action === "confirm") {
                try {
                    
                    // ✅ บันทึกคำสั่งซื้อหลังจากยืนยัน
                    
                    const [orderResult] = await db.query(
                        "INSERT INTO `Order` (Customer_id, Total_amount, Customer_Address, Status) VALUES (?, ?, ?, 'Preparing')",
                        [data.customerId, data.totalAmount, "ที่อยู่ลูกค้า (อัปเดตทีหลัง)"]
                    );
                    const orderId = orderResult.insertId; // ได้ค่า Order_id ที่สร้างใหม่
                    console.log(`✅ Order ID ที่สร้าง: ${orderId}`);

                    for (let order of data.orders) {
                        const [rows] = await db.query(
                            "SELECT Price FROM Product WHERE Product_id = ?",
                            [order.product_id]
                        );

                        if (!rows.length || !rows[0].Price) continue;
                        let price = parseFloat(rows[0].Price);
                        let subtotal = price * order.quantity;

                        console.log(`📝 กำลังบันทึก Order_item: Order_id=${orderId}, Product_id=${order.product_id}, Quantity=${order.quantity}, Subtotal=${subtotal}`);

                        await db.query(
                            "INSERT INTO Order_item (Order_id, Product_id, Quantity, Subtotal, Status) VALUES (?, ?, ?, ?, 'Preparing')",
                            [orderId, order.product_id, order.quantity, subtotal]
                        );
                    }
                    
                    await client.replyMessage(event.replyToken, {
                        type: "text",
                        text: "กรุณาพิมพ์ที่อยู่ของคุณเพื่อใช้ในการจัดส่ง",
                    });
                    
        
                    // console.log("Reply Token:", event.replyToken);

                    // await client.pushMessage(data.customerId, {type: "text", text: "✅ คำสั่งซื้อของคุณถูกบันทึกเรียบร้อย!",});
                    pendingOrders[data.customerId] = orderId;
                    
                } catch (error) {
                    console.error("❌ Error saving order:", error);
                    await client.replyMessage(event.replyToken, { type: "text", text: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
                }
            } else if (data.action === "cancel") {
                await client.replyMessage(event.replyToken, { type: "text", text: "❌ คำสั่งซื้อถูกยกเลิก" });
            }
        }
    }

    res.sendStatus(200);
});



function handleEvent(event) {
    console.log('Received event:', event);

    if (event.type === 'message' && event.message.type === 'text') {
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: `คุณพิมพ์ว่า: ${event.message.text}`,
        });
    }

    return Promise.resolve(null);
}


(async () => {
    try {

        const [rows] = await db.query('SHOW TABLES;');
        console.log('Connected to Database. Tables:', rows);

    } catch (err) {

        console.error('Database connection error:', err);

    }
})();

cron.schedule("0 */8 * * *", async () => {
    console.log("กำลังส่งเมนูสินค้าไปยังลูกค้า...");
    try {
        await sendMenuToLine(); // เรียกใช้ฟังก์ชันส่งเมนู
    } catch (error) {
        console.error("Error sending menu:", error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Bangkok" // ตั้งค่าเป็นเวลาประเทศไทย
});




const PORT = 8000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('Server is running on port 8000');
});

