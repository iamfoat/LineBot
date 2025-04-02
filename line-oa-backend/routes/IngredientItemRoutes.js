const express = require("express");
const ingredientItemControllers = require('../controllers/IngredientItemController')

const router = express.Router();
/**
 * @swagger
 * tags:
 *   - name: IngredientItem
 *     description: Operations related to products
 */

/**
 * @swagger
 * /api/ingredient-items/stock:
 *   post:
 *     summary: Add stock with batch details
 *     tags: [IngredientItem]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Ingredient_name:
 *                 type: string
 *               Batch_code:
 *                 type: string
 *               Quantity:
 *                 type: integer
 *               Expiry_date:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock added successfully with batch information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 added_quantity:
 *                   type: integer
 */
router.post("/ingredientitems/add-stock-batch", ingredientItemControllers.AddStockWithBatch);


/**
 * @swagger
 * /api/ingredient-items/history/{ingredientName}:
 *   get:
 *     summary: Retrieve the history of out-of-stock ingredient items
 *     tags: [IngredientItem]
 *     parameters:
 *       - in: path
 *         name: ingredientName
 *         required: true
 *         description: The name of the ingredient to fetch the stock history for
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of out-of-stock ingredient items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Batch_code:
 *                     type: string
 *                   Quantity:
 *                     type: integer
 *                   Expiry_date:
 *                     type: string
 *                   Create_at:
 *                     type: string
 */
router.get("/ingredientitems/:ingredientName/history", ingredientItemControllers.GetStockHistory);

/**
 * @swagger
 * /api/ingredient-items:
 *   get:
 *     summary: Get all ingredient items
 *     tags: [IngredientItem]
 *     responses:
 *       200:
 *         description: A list of ingredient items with stock details
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Ingredient_id:
 *                     type: integer
 *                   Ingredient_name:
 *                     type: string
 *                   Quantity:
 *                     type: integer
 *                   Last_Purchase_Date:
 *                     type: string
 *                   Expiry_date:
 *                     type: string
 */
router.get("/ingredientitems/:ingredientName",ingredientItemControllers.GetIngredientItems)

/**
 * @swagger
 * /api/ingredient-items/available/{ingredientName}:
 *   get:
 *     summary: Get available stock of a specific ingredient
 *     tags: [IngredientItem]
 *     parameters:
 *       - in: path
 *         name: ingredientName
 *         required: true
 *         description: The name of the ingredient to check available stock
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of available ingredient stock items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Batch_code:
 *                     type: string
 *                   Quantity:
 *                     type: integer
 *                   Expiry_date:
 *                     type: string
 */
router.get("/ingredientitems/:ingredientName/available", ingredientItemControllers.GetStockAvailable);

module.exports = router;
