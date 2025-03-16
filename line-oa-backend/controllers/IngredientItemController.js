const db = require("../db");

const GetIngredientItems = async (req, res) => {
    try {
        const [ingredients] = await db.query(`
            SELECT 
                i.Ingredient_id, 
                i.Ingredient_name, 
                i.Low_stock_threshold, 
                i.Updated_at,
                SUM(b.Quantity) AS Quantity, 
                MAX(b.Create_at) AS Last_Purchase_Date,
                MAX(b.Expiry_date) AS Expiry_date,
                SUM(b.Purchase_Price) AS Purchase_Price,
                SUM(b.Quantity) AS Purchase_Quantity
            FROM Ingredient i
            LEFT JOIN Ingredient_Batch b ON i.Ingredient_id = b.Ingredient_id
            GROUP BY i.Ingredient_id
        `);

        res.status(200).json(ingredients);
    } catch (error) {
        console.error("❌ Error fetching ingredients:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถโหลดวัตถุดิบได้" });
    }
};


const AddStockWithBatch = async (req, res) => {
    try {
        const { Ingredient_name, Batch_code, Quantity, Expiry_date } = req.body;

        if (!Ingredient_name || !Batch_code || Quantity == null || !Expiry_date) {
            return res.status(400).json({ error: "กรุณาระบุข้อมูลให้ครบถ้วน" });
        }

        await db.query("START TRANSACTION");

        const [ingredient] = await db.query(
            "SELECT Ingredient_id FROM `Ingredient` WHERE Ingredient_name = ?",
            [Ingredient_name]
        );

        if (ingredient.length === 0) {
            await db.query("ROLLBACK");
            return res.status(404).json({ error: "ไม่พบวัตถุดิบในระบบ" });
        }

        const Ingredient_id = ingredient[0].Ingredient_id;

        //อัปเดต `Ingredient` โดยเพิ่ม `Quantity`
        await db.query(
            "UPDATE `Ingredient` SET Quantity = Quantity + ?, Updated_at = NOW() WHERE Ingredient_id = ?",
            [Quantity, Ingredient_id]
        );

        //เพิ่ม `ingredient_item`
        const [result] = await db.query(
            "INSERT INTO `Ingredient_item` (Ingredient_id, Batch_code, Quantity, Expiry_date) VALUES (?, ?, ?, ?)",
            [Ingredient_id, Batch_code, Quantity, Expiry_date]
        );

        if (result.affectedRows === 0) {
            await db.query("ROLLBACK");
            return res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถเพิ่มวัตถุดิบลง `Ingredient_item` ได้" });
        }

        await db.query("COMMIT");

        res.status(200).json({ 
            message: "เพิ่มสต็อกและบันทึก Batch สำเร็จ ✅", 
            Ingredient_id,
            Batch_code,
            added_quantity: Quantity,
            expiry: Expiry_date
        });

    } catch (error) {
        await db.query("ROLLBACK");
        console.error("❌ Error adding stock:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถเพิ่มสต็อกได้" });
    }
};

const GetStockAvailable = async (req, res) => {
    try {
        const { ingredientName } = req.params;
        const [items] = await db.query(`
            SELECT ii.Batch_code, ii.Quantity, ii.Expiry_date, ii.Create_at
            FROM Ingredient_item ii
            JOIN Ingredient i ON ii.Ingredient_id = i.Ingredient_id
            WHERE i.Ingredient_name = ? AND ii.Quantity > 0  -- ✅ ดึงเฉพาะที่ Stock ยังเหลือ
            ORDER BY ii.Create_at ASC
        `, [ingredientName]);

        res.status(200).json(items);
    } catch (error) {
        console.error("❌ Error fetching available stock:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถโหลดข้อมูลได้" });
    }
};


const GetStockHistory = async (req, res) => {
    try {
        const { ingredientName } = req.params;
        const [history] = await db.query(`
            SELECT ii.Batch_code, ii.Quantity, ii.Expiry_date, ii.Create_at
            FROM Ingredient_item ii
            JOIN Ingredient i ON ii.Ingredient_id = i.Ingredient_id
            WHERE i.Ingredient_name = ? AND ii.Quantity = 0  -- ✅ ดึงเฉพาะ Stock ที่หมดแล้ว
            ORDER BY ii.Create_at DESC
        `, [ingredientName]);

        res.status(200).json(history);
    } catch (error) {
        console.error("❌ Error fetching stock history:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถโหลดประวัติสต็อกได้" });
    }
};


module.exports = { 
     AddStockWithBatch,
     GetStockAvailable,
     GetStockHistory,
     GetIngredientItems 
    };
