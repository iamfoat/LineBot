require('dotenv').config();
const express = require('express');
const app = express();
const line = require('@line/bot-sdk');
const db = require('./db');
const productRoutes = require('./routes/ProductRoutes');
const cors = require('cors')

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

app.post('/webhook',line.middleware(config), (req, res) => {
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    if (!req.body.events || req.body.events.length === 0) {
        return res.status(200).send('No events');
    }
    
    Promise.all(req.body.events.map(handleEvent))
        .then((result) => res.status(200).json(result))
        .catch((err) => {
            console.error('Error handling events:', err);
            res.status(500).send('Internal Server Error');
        });
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

