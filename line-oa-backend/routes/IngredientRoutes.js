const express = require('express');
const router = express.Router();
const ingredientControllers = require("../controllers/IngredientControllers")

router.post("/ingredients",ingredientControllers.CreateIngredient);
router.get("/ingredients",ingredientControllers.getIngredient);
router.post("/add-stock", ingredientControllers.AddStock);
router.delete("/:Ingredient_id", ingredientControllers.DeleteIngredient);
router.post("/ingredients/bulk", ingredientControllers.AddMultipleIngredients);

router.post("/upload-ocr",ingredientControllers.ingredientUploader.single("image"),ingredientControllers.analyzeIngredientSlip);
router.post("/confirm-ocr", ingredientControllers.confirmOcrInsertToDB);

  
module.exports = router;