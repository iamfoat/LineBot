const express = require("express");
const { getDashboardData } = require("../controllers/DashboardControllers");

const router = express.Router();
/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Operations related to products
 */


/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard data including total sales, revenue, expenses, and profit
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: false
 *         description: Start date for fetching data in YYYY-MM-DD format
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         required: false
 *         description: End date for fetching data in YYYY-MM-DD format
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dashboard data with total sales, revenue, expenses, and profit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSales:
 *                   type: integer
 *                 totalRevenue:
 *                   type: number
 *                 totalExpenses:
 *                   type: number
 *                 totalProfit:
 *                   type: number
 *       500:
 *         description: Internal server error while fetching dashboard data
 */
router.get("/dashboard", getDashboardData);

module.exports = router;
