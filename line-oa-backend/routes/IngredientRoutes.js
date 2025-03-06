const express = require('express');
const router = express.Router();
const ingredientControllers = require("../controllers/IngredientControllers")

router.post("/ingredients",ingredientControllers.CreateIngredient);
router.get("/ingredients",ingredientControllers.getIngredient);
router.post("/add-stock", ingredientControllers.AddStock);
router.delete("/:Ingredient_id", ingredientControllers.DeleteIngredient);

module.exports = router;