const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/PaymentControllers");

router.post("/payment/verify-slip", async (req, res) => {
  const { imageId, orderId, customerId } = req.body;
  const result = await PaymentController.verifySlip(
    imageId,
    orderId,
    customerId
  );
  res.json({ message: result });
});

router.post("/payment/cash-payment", async (req, res) => {
  const { orderId, customerId } = req.body;
  const result = await PaymentController.CashPayment(orderId, customerId);
  res.json({ message: result });
});

module.exports = router;
