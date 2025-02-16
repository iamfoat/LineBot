const db = require('../db');

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
        const { productName, price, description, productImg } = req.body;

        if (!productName || !price ) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [result] = await db.query(
            'INSERT INTO Product (Product_name, Price, Product_img, Description) VALUES (?, ?, ?, ?)',
            [productName, price, productImg, description]
        );
        res.status(201).json({ message: 'Product created', productId: result.insertId });
    } catch (err) {
        console.error('Error creating product:', err);
        res.status(500).json({ error: 'Failed to create product' });
    }
};

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM Product WHERE Product_id = ?', [id]);
        res.status(200).json({ message: 'Product deleted' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { productName, price, description, productImg } = req.body;

    try {
        const [product] = await db.query('SELECT * FROM Product WHERE Product_id = ?', [id]);
        if (product.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await db.query(
            'UPDATE Product SET Product_name = ?, Price = ?, Product_img = ?, Description = ? WHERE Product_id = ?',
            [productName, price, productImg || '', description || '', id]
        );

        res.status(200).json({ message: 'Product updated' });
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ error: 'Failed to update product' });
    }
};

module.exports = {
    getProducts,
    createProduct,
    deleteProduct,
    updateProduct
};