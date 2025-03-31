const express = require('express')
const router = express.Router()
const ingredient = require("../controllers/IngredientControllers2")

router.post("/ingredient2",ingredient.CreateIngredient);

module.exports = router;