const express = require('express');
const router = express.Router();
const { getItem ,updateOrderStatus,updateItemStatus} = require("../controllers/OrderItemControllers");


router.get("/orderitems/:orderId", getItem);
router.put("/orderitems/:orderItemId/status", updateItemStatus);
router.put("/orders/:orderId/status", updateOrderStatus);

module.exports = router;