require('dotenv').config();
const express = require('express');
const app = express();
const line = require('@line/bot-sdk');
const db = require('./db');
const productRoutes = require('./routes/ProductRoutes');
const cors = require('cors')
const axios = require("axios");
const cron = require("node-cron");
const { sendMenuToLine } = require("./controllers/ProductControllers");


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/api/products', productRoutes);
app.use("/uploads", express.static("uploads"));


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

        if (event.type === 'message') { //เช็คว่าเป็นข้อความ
            let customerId = null;
            let customerName = null;

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

