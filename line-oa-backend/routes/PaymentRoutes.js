const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/PaymentControllers");
/**
 * @swagger
 * tags:
 *   - name: Payment
 *     description: Operations related to products
 */


/**
 * @swagger
 * /api/payments/verify-slip/{imageId}/{orderId}/{customerId}:
 *   post:
 *     summary: Verify payment slip
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         description: The image ID of the payment slip
 *         schema:
 *           type: string
 *       - in: path
 *         name: orderId
 *         required: true
 *         description: The ID of the order
 *         schema:
 *           type: integer
 *       - in: path
 *         name: customerId
 *         required: true
 *         description: The ID of the customer making the payment
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Slip is verified and payment status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Error verifying slip
 */
router.post("/payment/verify-slip", async (req, res) => {
  const { imageId, orderId, customerId } = req.body;
  const result = await PaymentController.verifySlip(
    imageId,
    orderId,
    customerId
  );
  res.json({ message: result });
});


/**
 * @swagger
 * /api/payments/cash-payment/{orderId}/{customerId}:
 *   post:
 *     summary: Process cash payment for an order
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         description: The ID of the order to process payment for
 *         schema:
 *           type: integer
 *       - in: path
 *         name: customerId
 *         required: true
 *         description: The ID of the customer making the payment
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cash payment processed and order status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Error processing cash payment
 */
router.post("/payment/cash-payment", async (req, res) => {
  const { orderId, customerId } = req.body;
  const result = await PaymentController.CashPayment(orderId, customerId);
  res.json({ message: result });
});

module.exports = router;
