const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/PaymentControllers");

router.post("/payment/verify-slip", PaymentController.verifySlip);
router.post("/payment/cash-payment", PaymentController.CashPayment);

module.exports = router;
