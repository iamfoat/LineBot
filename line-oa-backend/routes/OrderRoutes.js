const express = require('express');
const router = express.Router();
const orderController = require('../controllers/OrderControllers'); 

router.get('/', orderController.getOrder);
router.post('/', orderController.createOrder); 
router.get('/completed', orderController.getCompletedOrders);

module.exports = router;
