const express = require('express');
const router = express.Router();
const productController = require('../controllers/ProductControllers');
const multer = require("multer");
/**
 * @swagger
 * tags:
 *   - name: Product
 *     description: Operations related to products
 */


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");  //เก็บไฟล์ไปไว้ที่ uploads
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage });





router.post("/send-menu", productController.sendMenuToLine);


/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Retrieve a list of products
 *     tags: [Product]
 *     description: Get a list of all products stored in the database
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Product_id:
 *                     type: integer
 *                   Product_name:
 *                     type: string
 *                   Price:
 *                     type: number
 *                   Description:
 *                     type: string
 */
router.get('/', productController.getProducts);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Product]
 *     description: Add a new product to the database with necessary details like name, price, ingredients, etc.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 price:
 *                   type: number
 *                 description:
 *                   type: string
 *                 ingredients:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.post('/', upload.single("productImg"), productController.createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     tags: [Product]
 *     description: Delete the product from the database using the product ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the product to delete
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete('/:id', productController.deleteProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product's details
 *     tags: [Product]
 *     description: Update the product's name, price, description, or ingredients
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the product to update
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid ingredients format
 */
router.put('/:id', upload.single("productImg"), productController.updateProduct);

module.exports = router;
