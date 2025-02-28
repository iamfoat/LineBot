const express = require('express');
const router = express.Router();
const { getItem } = require("../controllers/OrderItemControllers");


router.get("/:orderId", getItem);
module.exports = router;