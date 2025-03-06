const express = require("express");
const app = express();
const cors = require("cors");
const db = require('../db');
require('dotenv').config();
const axios = require("axios");


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};


const getProducts = async (req, res) => {
    try {
        const [products] = await db.query("SELECT * FROM Product");
        
        console.log("📌 Products from DB:", products);

        const formattedProducts = products.map(product => {
            console.log("📌 Raw Ingredient_id:", product.Ingredient_id);

            let ingredientsArray;
            try {
                // ✅ เช็คก่อนว่า Ingredient_id เป็น JSON String หรือไม่
                ingredientsArray = typeof product.Ingredient_id === "string"
                    ? JSON.parse(product.Ingredient_id)
                    : product.Ingredient_id;
            } catch (err) {
                console.error("🚨 Error parsing Ingredient_id:", err);
                ingredientsArray = [];
            }

            return {
                ...product,
                Ingredient_id: ingredientsArray, // ✅ ส่งเป็น `array` กลับไปให้ Frontend
            };
        });

        res.json(formattedProducts);
    } catch (err) {
        console.error("🚨 Error fetching products:", err);
        res.status(500).json({ error: "Failed to fetch products" });
    }
};



const createProduct = async (req, res) => {
    console.log("📌 Request Body:", req.body);
    console.log("📌 Request File:", req.file);

    try {
        const { productName, price, description, ingredients } = req.body;
        const productImg = req.file ? req.file.filename : null;

        if (!productName || !price || !ingredients) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let ingredientsArray;
        try {
            ingredientsArray = typeof ingredients === "string" ? JSON.parse(ingredients) : ingredients;
            if (!Array.isArray(ingredientsArray)) throw new Error("Ingredients is not an array");
        } catch (err) {
            return res.status(400).json({ error: "Invalid ingredients format", details: err.message });
        }

        const ingredientsJson = JSON.stringify(ingredientsArray); // ✅ บันทึกเป็น JSON String

        const [productResult] = await db.query(
            'INSERT INTO Product (Product_name, Price, Product_img, Description, Ingredient_id) VALUES (?, ?, ?, ?, ?)',
            [productName, price, productImg, description, ingredientsJson]
        );

        res.status(201).json({
            message: 'Product created successfully with ingredients',
            product: {
                id: productResult.insertId,
                name: productName,
                price,
                description,
                ingredients: ingredientsArray
            }
        });
    } catch (err) {
        console.error('Error creating product:', err);
        res.status(500).json({ error: 'Failed to create product' });
    }
};






const deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const [product] = await db.query('SELECT * FROM Product WHERE Product_id = ?', [id]);
        if (product.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await db.query('DELETE FROM Product WHERE Product_id = ?', [id]);
        res.status(200).json({ message: 'Product deleted' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};


const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { productName, price, description } = req.body;
    const productImg = req.file ? req.file.filename : null; // ถ้ามีไฟล์ใหม่ให้ใช้ไฟล์ใหม่

    try {
        const [product] = await db.query('SELECT * FROM Product WHERE Product_id = ?', [id]);
        if (product.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const updateFields = [];
        const updateValues = [];

        if (productName) {
            updateFields.push("Product_name = ?");
            updateValues.push(productName);
        }
        if (price) {
            updateFields.push("Price = ?");
            updateValues.push(price);
        }
        if (description) {
            updateFields.push("Description = ?");
            updateValues.push(description);
        }
        if (productImg) { // อัปเดตรูปภาพถ้ามีไฟล์ใหม่
            updateFields.push("Product_img = ?");
            updateValues.push(productImg);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }

        updateValues.push(id); // ใส่ id เป็นเงื่อนไขท้ายสุด

        await db.query(
            `UPDATE Product SET ${updateFields.join(", ")} WHERE Product_id = ?`,
            updateValues
        );

        res.status(200).json({ message: 'Product updated' });
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ error: 'Failed to update product' });
    }
};


const generateFlexMenu = (products) => {
    const contents = products.map((product) => ({
        "type": "bubble",
        "hero": {
            "type": "image",
            "url": `https://839b-171-7-34-194.ngrok-free.app/uploads/${product.Product_img}`,
            "size": "full",
            "aspectRatio": "20:13",
            "aspectMode": "cover"
        },
        "body":{
            "type": "box",
            "layout": "vertical",
            "contents": [
                { "type": "text", 
                    "text": product.Product_name, 
                    "weight": "bold", 
                    "size": "xl" 
                },

                { "type": "text", 
                    "text": `฿${product.Price}`, 
                    "color": "#888888", 
                    "size": "sm" 
                },

                {
                    "type": "text",
                    "text": product.Description,
                    "color": "#888888",
                    "size": "sm"
                }
            ]
        }
    }));

    return {
        "type": "carousel",
        "contents": contents
    };
};

const sendMenuToLine = async (req = null, res = null) => {
    try {
        const [products] = await db.query("SELECT * FROM Product");

        if (products.length === 0) {
            return res.status(400).json({ error: "ไม่มีสินค้าที่จะส่ง!" });
        }

        const [recipients] = await db.query("SELECT Customer_id FROM Customer");         

        const flexMenu = generateFlexMenu(products);
        console.log("ส่ง Flex Message ไปที่ LINE:", JSON.stringify(flexMenu, null, 2));
        console.log("Flex Message Payload:", JSON.stringify(flexMenu, null, 2));


        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.channelAccessToken}`,
        };

        for (let recipient of recipients) {
            const body = {
                to: recipient.Customer_id, //ใช้ค่าจาก `Customer_id`
                messages: [{ type: "flex", altText: "ร้านเปิดแล้วค่าา มาสั่งกันเร็วว!", contents: flexMenu }]
            };

            try {
                const response = await axios.post("https://api.line.me/v2/bot/message/push", body, { headers });
                console.log(`ส่งสำเร็จไปยัง: ${recipient.Customer_id}`, response.data);
            } catch (error) {
                console.error(`Error ส่งไปยัง ${recipient.Customer_id}:`, error.response ? error.response.data : error);
            }
        }
    
        res.json({ status: "success", message: "ส่งเมนูไปที่ LINE แล้ว!" });
    } catch (error) {
        console.error("Error sending menu:", error.response ? error.response.data : error);
        res.status(500).json({ error: "Failed to send menu" });
    }
};


module.exports = {
    getProducts,
    createProduct,
    deleteProduct,
    updateProduct,
    sendMenuToLine
};