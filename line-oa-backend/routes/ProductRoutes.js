const express = require('express');
const router = express.Router();
const productController = require('../controllers/ProductControllers');
const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");  //เก็บไฟล์ไปไว้ที่ uploads
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage });

router.get('/', productController.getProducts);

router.post('/', upload.single("productImg"), productController.createProduct);

router.delete('/:id', productController.deleteProduct);

router.put('/:id', upload.single("productImg"), productController.updateProduct);

module.exports = router;