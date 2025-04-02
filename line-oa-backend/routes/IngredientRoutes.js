const express = require("express");
const router = express.Router();
const ingredientControllers = require("../controllers/IngredientControllers");
/**
 * @swagger
 * tags:
 *   - name: Ingredient
 *     description: Operations related to products
 */

/**
 * @swagger
 * /api/ingredients:
 *   post:
 *     summary: Create a new ingredient
 *     tags: [Ingredient]
 *     description: Add a new ingredient to the database along with batch details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Ingredient_name:
 *                 type: string
 *               Quantity:
 *                 type: integer
 *               Low_stock_threshold:
 *                 type: integer
 *               Purchase_Price:
 *                 type: number
 *               Expiry_date:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ingredient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 Ingredient_id:
 *                   type: integer
 *                 total_quantity:
 *                   type: integer
 */
router.post("/ingredients", ingredientControllers.CreateIngredient);

/**
 * @swagger
 * /api/ingredients/{Ingredient_id}:
 *   get:
 *     summary: Retrieve a list of ingredients
 *     tags: [Ingredient]
 *     description: Get a list of all ingredients including total quantity, low stock threshold, and latest expiry date
 *     parameters:
 *       - in: path
 *         name: Ingredient_id
 *         required: true
 *         description: The ID of the ingredient to retrieve
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of ingredients
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
 *                   Total_Quantity:
 *                     type: integer
 *                   Low_stock_threshold:
 *                     type: integer
 *                   Latest_Expiry:
 *                     type: string
 */
router.get("/ingredients", ingredientControllers.getIngredient);

/**
 * @swagger
 * /api/ingredients/stock:
 *   post:
 *     summary: Update stock of a specific ingredient
 *     tags: [Ingredient]
 *     description: Add stock for a specific ingredient by specifying the ingredient's ID and quantity to be added.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Ingredient_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 updated_quantity:
 *                   type: integer
 */
router.post("/add-stock", ingredientControllers.AddStock);

/**
 * @swagger
 * /api/ingredients/{Ingredient_id}:
 *   delete:
 *     summary: Delete an ingredient by ID
 *     tags: [Ingredient]
 *     description: Remove an ingredient from the database using the ingredient ID
 *     parameters:
 *       - in: path
 *         name: Ingredient_id
 *         required: true
 *         description: The ID of the ingredient to delete
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ingredient deleted successfully
 *       400:
 *         description: Invalid ingredient ID
 */
router.delete("/:Ingredient_id", ingredientControllers.DeleteIngredient);

/**
 * @swagger
 * /api/ingredients/multiple:
 *   post:
 *     summary: Add multiple ingredients at once
 *     tags: [Ingredient]
 *     description: This endpoint allows adding multiple ingredients with their details such as name, quantity, price, etc.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     price:
 *                       type: number
 *                     threshold:
 *                       type: integer
 *                     expiry_date:
 *                       type: string
 *     responses:
 *       201:
 *         description: Ingredients added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post("/ingredients/bulk", ingredientControllers.AddMultipleIngredients);
/**
 * @swagger
 * /api/ingredients/stock:
 *   post:
 *     summary: Analyze an ingredient slip and update the database
 *     tags: [Ingredient]
 *     description: Upload an ingredient receipt, process the OCR data, and update ingredient stock in the database
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: OCR process completed successfully and items inserted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       quantity:
 *                         type: integer
 *                       price:
 *                         type: number
 *                       expiry_date:
 *                         type: string
 */
router.post(
  "/upload-ocr",
  ingredientControllers.ingredientUploader.single("image"),
  ingredientControllers.analyzeIngredientSlip
);

/**
 * @swagger
 * /api/ingredients/ocr:
 *   post:
 *     summary: Confirm OCR result and insert data into the database
 *     tags: [Ingredient]
 *     description: This endpoint accepts OCR data for ingredients and inserts them into the `Ingredient` and `Ingredient_item` tables. It also adds new ingredients if they don't exist.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     price:
 *                       type: number
 *                     expiry_date:
 *                       type: string
 *               receipt_img:
 *                 type: string
 *     responses:
 *       200:
 *         description: Data successfully inserted, including new ingredients if needed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal Server Error
 */
router.post("/confirm-ocr", ingredientControllers.confirmOcrInsertToDB);

module.exports = router;
