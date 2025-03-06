const db = require("../db");

const GetIngredientItems = async (req, res) => {
    try {
        const { ingredientName } = req.params;
        const [items] = await db.query(`
            SELECT ii.Batch_code, ii.Quantity, ii.Expiry_date
            FROM Ingredient_item ii
            JOIN Ingredient i ON ii.Ingredient_id = i.Ingredient_id
            WHERE i.Ingredient_name = ?
            ORDER BY ii.Create_at DESC
        `, [ingredientName]);

        res.status(200).json(items);
    } catch (error) {
        console.error("❌ Error fetching ingredient items:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถโหลดข้อมูลได้" });
    }
};

const AddStockWithBatch = async (req, res) => {
    try {
        const { Ingredient_id, Batch_code, Quantity, Expiry_date } = req.body;

        if (!Ingredient_id || !Batch_code || Quantity == null || !Expiry_date) {
            return res.status(400).json({ error: "กรุณาระบุข้อมูลให้ครบถ้วน" });
        }

        await db.query("START TRANSACTION");

        await db.query(
            "UPDATE `Ingredient` SET Quantity = Quantity + ?, Updated_at = NOW() WHERE Ingredient_id = ?",
            [Quantity, Ingredient_id]
        );

        await db.query(
            "INSERT INTO `Ingredient_item` (Ingredient_id, Batch_code, Quantity, Expiry_date) VALUES (?, ?, ?, ?)",
            [Ingredient_id, Batch_code, Quantity, Expiry_date]
        );

        await db.query("COMMIT");

        res.status(200).json({ 
            message: "เพิ่มสต็อกและบันทึก Batch สำเร็จ ✅", 
            added_quantity: Quantity,
            batch: Batch_code,
            expiry: Expiry_date
        });

    } catch (error) {
        await db.query("ROLLBACK");
        console.error("❌ Error updating stock:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถเพิ่มสต็อกได้" });
    }
};

const GetStockHistory = async (req, res) => {
    try {
        const [history] = await db.query(`
            SELECT ii.*, i.Ingredient_name 
            FROM Ingredient_item ii 
            JOIN Ingredient i ON ii.Ingredient_id = i.Ingredient_id
            ORDER BY ii.Create_at DESC
        `);

        res.status(200).json(history);
    } catch (error) {
        console.error("❌ Error fetching stock history:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถโหลดประวัติการเพิ่มสต็อกได้" });
    }
};

const UpdateStockStatus = async (req, res) => {
    try {
        const { batchCode } = req.params;
        const { Quantity } = req.body;

        const [updateResult] = await db.query(
            "UPDATE `Ingredient_item` SET Quantity = ? WHERE Batch_code = ?",
            [Quantity, batchCode]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: "ไม่พบวัตถุดิบที่ต้องการอัปเดต" });
        }

        res.status(200).json({ message: "อัปเดตสถานะสำเร็จ ✅" });

    } catch (error) {
        console.error("❌ Error updating ingredient item:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถอัปเดตสต็อกได้" });
    }
};


module.exports = { 
    AddStockWithBatch,
     GetStockHistory,
     GetIngredientItems 
    };
