require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};
// console.log(config);

const app = express();
app.use(bodyParser.json());

// เส้นทางพื้นฐาน (Route)
app.get('/', (req, res) => {
    res.send('Hello, LINE OA!');
});

app.post('/webhook', (req, res) => {
    const events = req.body.events;

    events.forEach((event) => {
        if (event.type === 'message' && event.message.type === 'text') {
            const userMessage = event.message.text;

            // ตอบกลับข้อความ
            client.replyMessage(event.replyToken, {
                type: 'text',
                text: `คุณพิมพ์ว่า: ${userMessage}`,
            });
        }
    });

    res.status(200).send('OK');
});

// เริ่มเซิร์ฟเวอร์
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
