const express = require("express");
const ingredientItemControllers = require('../controllers/IngredientItemController')

const router = express.Router();

router.post("/ingredientitems/:ingredientName/add-stock-batch", ingredientItemControllers.AddStockWithBatch);
router.get("/ingredientitems/:ingredientName/history", ingredientItemControllers.GetStockHistory);
router.get("/ingredientitems/:ingredientName",ingredientItemControllers.GetIngredientItems)

module.exports = router;
