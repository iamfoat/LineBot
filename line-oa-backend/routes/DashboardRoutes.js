const express = require("express");
const { getDashboardData } = require("../controllers/DashboardControllers");

const router = express.Router();

router.get("/dashboard", getDashboardData);

module.exports = router;
