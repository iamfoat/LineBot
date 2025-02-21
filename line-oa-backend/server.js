require('dotenv').config();
const express = require('express');
const app = express();
const line = require('@line/bot-sdk');
const db = require('./db');
const productRoutes = require('./routes/ProductRoutes');
const cors = require('cors')
const axios = require("axios");


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
        if (event.type === 'message') { // 📩 เช็คว่าเป็นข้อความ
            const userId = event.source.userId;
            console.log("New Message from:", userId);

            // ดึงชื่อจาก API LINE
            const profile = await getUserProfile(userId);

            if (profile) {
                const customerName = profile.displayName; // ใช้ชื่อจาก LINE
                const customerPhone = null; // ยังไม่มีข้อมูลเบอร์โทร
                const customerAddress = null; // ยังไม่มีที่อยู่

                // 📌 บันทึกข้อมูลเฉพาะ `userId` (Customer_id)
                await db.query(
                    'INSERT INTO Customer (Customer_id, Customer_name, Customer_phone, Customer_address) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE Customer_name = VALUES(Customer_name)',
                    [userId, customerName, customerPhone, customerAddress]
                );
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


const PORT = 8000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('Server is running on port 8000');
});

