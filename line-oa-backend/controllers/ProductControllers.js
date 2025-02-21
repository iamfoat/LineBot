const express = require("express");
const app = express();
const cors = require("cors");
const db = require('../db');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const getProducts = async (req , res) => {
    try {
        const [products] = await db.query('SELECT * From Product');
        res.status(200).json(products);
    } catch (err) {
        console.error('Error fetching Product: ', err);
        res.status(500).json({ error: 'Failed to fetch products' })
    }
};

const createProduct = async (req, res) => {
    try {
        const { productName, price, description } = req.body;
        const productImg = req.file ? req.file.filename : null;

        if (!productName || !price || !productImg) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [result] = await db.query(
            'INSERT INTO Product (Product_name, Price, Product_img, Description) VALUES (?, ?, ?, ?)',
            [productName, price, productImg, description]
        );

        res.status(201).json({  //ส่งกลับไปที่ React
            message: 'Product created',
            product: {
                id: result.insertId,
                name: productName,
                price: price,
                image: productImg,
                description: description
            }
        });
    } catch (err) {
        console.error('Error creating product:', err);
        res.status(500).json({ error: 'Failed to create product' })
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
        console.error('🚨 Error updating product:', err);
        res.status(500).json({ error: 'Failed to update product' });
    }
};


module.exports = {
    getProducts,
    createProduct,
    deleteProduct,
    updateProduct
};