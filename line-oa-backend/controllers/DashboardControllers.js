const db = require('../db');

// 📌 ดึงข้อมูลยอดขาย รายรับ รายจ่าย กำไร
const getDashboardData = async (req, res) => {
  try {
    // ✅ ดึงยอดขาย (จำนวนสินค้า)
    const [totalSales] = await db.query(`
            SELECT COALESCE(SUM(oi.Quantity), 0) AS totalSales 
            FROM Order_item oi;
        `);

    // ✅ ดึงรายรับ (Total Revenue)
    const [totalRevenue] = await db.query(`
            SELECT COALESCE(SUM(oi.Subtotal), 0) AS totalRevenue 
            FROM Order_item oi;
        `);

    // ✅ ดึงรายจ่าย (Total Expenses)
    const [totalExpenses] = await db.query(`
            SELECT COALESCE(SUM(ii.Purchase_Price), 0) AS totalExpenses
            FROM Ingredient_item ii;
        `);

    // ✅ คำนวณกำไร (Profit = Revenue - Expenses)
    const totalProfit =
      totalRevenue[0].totalRevenue - totalExpenses[0].totalExpenses;

    return res.status(200).json({
      totalSales: totalSales[0].totalSales,
      totalRevenue: totalRevenue[0].totalRevenue,
      totalExpenses: totalExpenses[0].totalExpenses,
      totalProfit: totalProfit,
    });
  } catch (error) {
    console.error("❌ Error fetching dashboard data:", error);
    return res.status(500).json({ message: "Error fetching dashboard data" });
  }
};

module.exports = { getDashboardData };
