const express = require('express');
const router = express.Router();
const { getItem ,updateOrderStatus,updateItemStatus} = require("../controllers/OrderItemControllers");
/**
 * @swagger
 * tags:
 *   - name: OrderItem
 *     description: Operations related to products
 */

/**
 * @swagger
 * /api/order-items/{orderId}:
 *   get:
 *     summary: Retrieve a list of items for a specific order
 *     tags: [OrderItem]
 *     description: Get the list of products in a specific order including product name, quantity, and price
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         description: The ID of the order to fetch the items
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of order items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Order_item_id:
 *                     type: integer
 *                   Product_name:
 *                     type: string
 *                   Price:
 *                     type: number
 *                   Quantity:
 *                     type: integer
 *                   Subtotal:
 *                     type: number
 *                   Status:
 *                     type: string
 *                   Order_status:
 *                     type: string
 */

router.get("/orderitems/:orderId", getItem);

/**
 * @swagger
 * /api/orders/{orderId}/status:
 *   put:
 *     summary: Update the status of an order
 *     tags: [OrderItem] 
 *     description: Update the order status and send a notification if the order status is 'Out for Delivery'
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         description: The ID of the order to update
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid orderId or status
 *       500:
 *         description: Failed to update order status
 */
router.put("/orders/:orderId/status", updateOrderStatus);

/**
 * @swagger
 * /api/order-items/{orderItemId}/status:
 *   put:
 *     summary: Update the status of an order item
 *     tags: [OrderItem]
 *     description: Update the status of a specific order item
 *     parameters:
 *       - in: path
 *         name: orderItemId
 *         required: true
 *         description: The ID of the order item to update
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order item status updated successfully
 *       400:
 *         description: Invalid orderItemId or status
 *       500:
 *         description: Failed to update order item status
 */
router.put("/orderitems/:orderItemId/status", updateItemStatus);



module.exports = router;


