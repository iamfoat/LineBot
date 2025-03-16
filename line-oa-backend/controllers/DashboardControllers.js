const db = require('../db');

// 📌 ดึงข้อมูลยอดขาย รายรับ รายจ่าย กำไร
const getDashboardData = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // console.log(`Fetching data from ${startDate} to ${endDate}`);

        // ✅ ถ้าไม่มีวันที่ ให้ใช้วันปัจจุบัน
        const start = startDate ? `${startDate} 00:00:00` : "2000-01-01 00:00:00";
        const end = endDate ? `${endDate} 23:59:59` : "2099-12-31 23:59:59";

        // ✅ ดึงยอดขาย (Total Sales) → JOIN Order_items กับ Order
        const [totalSales] = await db.query(`
            SELECT COALESCE(SUM(oi.Quantity), 0) AS totalSales 
            FROM Order_item oi
            JOIN \`Order\` o ON oi.Order_id = o.Order_id
            WHERE o.created_at BETWEEN ? AND ?;
        `, [start, end]);

        // ✅ ดึงรายรับ (Total Revenue)
        const [totalRevenue] = await db.query(`
            SELECT COALESCE(SUM(oi.Subtotal), 0) AS totalRevenue 
            FROM Order_item oi
            JOIN \`Order\` o ON oi.Order_id = o.Order_id
            WHERE o.created_at BETWEEN ? AND ?;
        `, [start, end]);

        // ✅ ดึงรายจ่าย (Total Expenses) → ใช้ `Create_at` จาก `Ingredient_item`
        const [totalExpenses] = await db.query(`
            SELECT COALESCE(SUM(ii.Purchase_Price), 0) AS totalExpenses 
            FROM Ingredient_item ii
            WHERE ii.Create_at BETWEEN ? AND ?;
        `, [start, end]);

        // ✅ คำนวณกำไร (Profit = Revenue - Expenses)
        const totalProfit = totalRevenue[0].totalRevenue - totalExpenses[0].totalExpenses;

        return res.status(200).json({
            totalSales: totalSales[0].totalSales,
            totalRevenue: totalRevenue[0].totalRevenue,
            totalExpenses: totalExpenses[0].totalExpenses,
            totalProfit: totalProfit,
        });

    } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
        return res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
    }
};



module.exports = { getDashboardData };
