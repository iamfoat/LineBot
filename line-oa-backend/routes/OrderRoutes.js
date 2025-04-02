const express = require('express');
const router = express.Router();
const orderController = require('../controllers/OrderControllers'); 
/**
 * @swagger
 * tags:
 *   - name: Order
 *     description: Operations related to products
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Retrieve a list of orders
 *     tags: [Order]
 *     description: Get a list of all orders including customer name, total amount, and order status
 *     responses:
 *       200:
 *         description: A list of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Order_id:
 *                     type: integer
 *                   Customer_name:
 *                     type: string
 *                   Total_amount:
 *                     type: number
 *                   Customer_Address:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                   Status:
 *                     type: string
 */
router.get('/', orderController.getOrder);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Order]
 *     description: Create a new order with customer name, product ID, and quantity ordered
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerName:
 *                 type: string
 *               productId:
 *                 type: integer
 *               quantityOrdered:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 orderId:
 *                   type: integer
 */
router.post('/', orderController.createOrder); 

/**
 * @swagger
 * /api/orders/completed:
 *   get:
 *     summary: Retrieve a list of completed orders
 *     tags: [Order]
 *     description: Get a list of all completed orders including customer name, total amount, and order status
 *     responses:
 *       200:
 *         description: A list of completed orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Order_id:
 *                     type: integer
 *                   Customer_name:
 *                     type: string
 *                   Total_amount:
 *                     type: number
 *                   Customer_Address:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                   Status:
 *                     type: string
 */
router.get('/completed', orderController.getCompletedOrders);

module.exports = router;
