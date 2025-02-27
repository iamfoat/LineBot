const express = require('express');
const router = express.Router();
const orderController = require('../controllers/OrderControllers'); // ✅ แก้ชื่อให้ถูก

router.get('/', orderController.getOrder);
router.post('/', orderController.createOrder); // ✅ เพิ่ม API สำหรับสร้างออร์เดอร์

module.exports = router;
