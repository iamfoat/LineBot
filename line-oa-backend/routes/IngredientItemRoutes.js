const express = require("express");
const ingredientItemControllers = require('../controllers/IngredientItemController')

const router = express.Router();

router.post("/ingredientitems/add-stock-batch", ingredientItemControllers.AddStockWithBatch);
router.get("/ingredientitems/:ingredientName/history", ingredientItemControllers.GetStockHistory);
router.get("/ingredientitems/:ingredientName",ingredientItemControllers.GetIngredientItems)

router.get("/ingredientitems/:ingredientName/available", ingredientItemControllers.GetStockAvailable);
router.get("/ingredientitems/:ingredientName/history", ingredientItemControllers.GetStockHistory);

module.exports = router;
