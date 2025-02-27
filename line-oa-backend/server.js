require('dotenv').config();
const express = require('express');
const app = express();
const { exec } = require("child_process");
const line = require('@line/bot-sdk');
const db = require('./db');
const productRoutes = require('./routes/ProductRoutes');
const orderRoutes = require('./routes/OrderRoutes')
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


const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

if (!config.channelAccessToken || !config.channelSecret) {
    throw new Error("Missing CHANNEL_ACCESS_TOKEN or CHANNEL_SECRET in .env file");
}

const client = new line.Client(config);



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

        if (event.type === 'message' && event.message.type === "text") { //เช็คว่าเป็นข้อความ
            let customerId = null;
            let customerName = null;
            let customerText = event.message.text;

            // ตรวจสอบว่าเป็นข้อความจาก "ผู้ใช้" หรือ "กลุ่ม"
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

            if (customerId) {
                try {
                    await db.query(
                        `INSERT INTO Customer (Customer_id, Customer_name) 
                         VALUES (?, ?) 
                         ON DUPLICATE KEY UPDATE Customer_name = VALUES(Customer_name)`,
                        [customerId, customerName]
                    );
                    console.log(`บันทึก ${customerId} ลงฐานข้อมูลเรียบร้อย`);

                    // ✅ 2. เรียก Model วิเคราะห์คำสั่งซื้อ
                    const modelPath = path.join(__dirname, "..", "Model", "NLP.py"); // ✅ ใช้พาธแบบเต็ม
                    exec(`python "${modelPath}" "${customerText}"`, async (error, stdout) => {
                        if (error) {
                            console.error("❌ Error running model:", error);
                            return;
                        }

                        // ✅ 3. แปลงผลลัพธ์จาก Python เป็น JSON
                        let orders = JSON.parse(stdout);
                        if (orders.length === 0) {
                            // await client.replyMessage(event.replyToken, { type: "text", text: "ขออภัย ไม่พบสินค้าที่ตรงกับคำสั่งของคุณ" });
                            return;
                        }

                        
                        // ✅ 4. คำนวณยอดรวม `Total_amount`
                        let totalAmount = 0;
                        for (let order of orders) {
                            const [rows] = await db.query(
                                "SELECT Price FROM Product WHERE Product_id = ?",
                                [order.product_id]
                            );
                            
                            if (!rows.length || !rows[0].Price) {
                                console.error(`❌ ไม่พบราคาสินค้าสำหรับ Product ID: ${order.product_id}`);
                                continue;
                            }
                            
                            let price = parseFloat(rows[0].Price);
                            if (isNaN(price)) {
                                console.error(`❌ ราคาไม่ถูกต้องสำหรับ Product ID: ${order.product_id}, ค่า: ${rows[0].Price}`);
                                price = 0;  // ตั้งค่าเริ่มต้นเป็น 0 ถ้าพบปัญหา
                            }
                            
                            let subtotal = price * order.quantity;
                            if (isNaN(subtotal) || subtotal === null) {
                                console.error(`❌ Subtotal เป็น NaN หรือ Null สำหรับ Product ID: ${order.product_id}`);
                                subtotal = 0; // หรืออาจใช้ continue; เพื่อข้ามไป
                            }
                            totalAmount += subtotal;
                    
                        }

                        // ✅ 5. บันทึกข้อมูล Order ลงฐานข้อมูล
                        const [orderResult] = await db.query(
                            "INSERT INTO `Order` (Customer_id, Total_amount, Customer_Address, Status) VALUES (?, ?, ?, 'Preparing')",
                            [customerId, totalAmount, "ที่อยู่ลูกค้า (อัปเดตทีหลัง)"]
                        );
                        const orderId = orderResult.insertId; // ได้ค่า Order_id ที่สร้างใหม่
                        console.log(`✅ Order ID ที่สร้าง: ${orderId}`);

                        // ✅ 6. บันทึกข้อมูล Order_item
                        for (let order of orders) {
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
                        

                        //✅ 7. ตอบกลับลูกค้า
                        let replyText = "✅ คำสั่งซื้อของคุณ:\n";
                        orders.forEach(order => {
                            replyText += `- ${order.menu} จำนวน ${order.quantity} แก้ว\n`;
                        });

                        replyText += `💰 ยอดรวม: ${totalAmount} บาท`;

                        await client.replyMessage(event.replyToken, { type: "text", text: replyText });
                    });
                } catch (error) {
                    console.error("เกิดข้อผิดพลาดในการบันทึก:", error);
                }
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

cron.schedule("0 12 * * *", async () => {
    console.log("📅 [CRON JOB] กำลังส่งเมนูสินค้าไปยังลูกค้า...");
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

