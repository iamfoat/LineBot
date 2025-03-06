const db = require('../db'); // ดึง Database Connection

const CreateIngredient = async (req, res) => {
    try {
        const { Ingredient_name, Quantity, Low_stock_threshold } = req.body;

        if (!Ingredient_name || Quantity == null) {
            return res.status(400).json({ error: "กรุณากรอกชื่อวัตถุดิบและจำนวนเริ่มต้น" });
        }

        // ✅ ตรวจสอบว่ามีชื่อวัตถุดิบนี้อยู่แล้วหรือไม่
        const [existingIngredient] = await db.query(
            "SELECT * FROM `Ingredient` WHERE Ingredient_name = ?",
            [Ingredient_name]
        );

        if (existingIngredient.length > 0) {
            // ✅ ถ้ามีอยู่แล้ว ให้เพิ่ม Quantity แทนการสร้างใหม่
            const ingredientId = existingIngredient[0].Ingredient_id;
            const newQuantity = existingIngredient[0].Quantity + Quantity;

            await db.query(
                "UPDATE `Ingredient` SET Quantity = ?, Updated_at = NOW() WHERE Ingredient_id = ?",
                [newQuantity, ingredientId]
            );

            return res.status(200).json({ 
                message: `อัปเดตสต็อกสำเร็จ ✅ วัตถุดิบ "${Ingredient_name}" ถูกเพิ่มอีก ${Quantity} หน่วย`,
                Ingredient_id: ingredientId,
                updated_quantity: newQuantity
            });

        } else {
            // ✅ ถ้ายังไม่มี ให้สร้างใหม่
            const [result] = await db.query(
                "INSERT INTO `Ingredient` (Ingredient_name, Quantity, Low_stock_threshold) VALUES (?, ?, ?)",
                [Ingredient_name, Quantity, Low_stock_threshold]
            );

            return res.status(201).json({ 
                message: "วัตถุดิบใหม่ถูกสร้างสำเร็จ ✅",
                Ingredient_id: result.insertId
            });
        }

    } catch (error) {
        console.error("❌ Error creating ingredient:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถเพิ่มวัตถุดิบได้" });
    }
};



const getIngredient = async (req, res) => {
    try {
        const [ingredients] = await db.query(`
            SELECT MIN(Ingredient_id) AS Ingredient_id, Ingredient_name, SUM(Quantity) AS Quantity, MAX(Updated_at) AS Updated_at 
            FROM Ingredient 
            GROUP BY Ingredient_name
        `);
        res.status(200).json(ingredients);
    } catch (error) {
        console.error("❌ Error fetching ingredients:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถโหลดวัตถุดิบได้" });
    }
};



const AddStock = async (req, res) => {
    try {
        const { Ingredient_id, quantity } = req.body;

        if (!Ingredient_id || quantity == null) {
            return res.status(400).json({ error: "กรุณาระบุ Ingredient_id และ quantity" });
        }

        // ✅ อัปเดตสต็อกและเวลาล่าสุด
        const [result] = await db.query(
            "UPDATE `Ingredient` SET Quantity = Quantity + ?, Updated_at = NOW() WHERE Ingredient_id = ?",
            [quantity, Ingredient_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "ไม่พบวัตถุดิบที่ต้องการอัปเดต" });
        }

        res.status(200).json({ message: "อัปเดตสต็อกสำเร็จ ✅", updated_quantity: quantity });

    } catch (error) {
        console.error("❌ Error updating stock:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถอัปเดตสต็อกได้" });
    }
};

const DeleteIngredient = async (req, res) => {
    try {
        const { Ingredient_id } = req.params;

        const [result] = await db.query("DELETE FROM `ingredient` WHERE Ingredient_id = ?", [Ingredient_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "ไม่พบวัตถุดิบที่ต้องการลบ" });
        }

        res.status(200).json({ message: "ลบวัตถุดิบสำเร็จ ✅" });

    } catch (error) {
        console.error("❌ Error deleting ingredient:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถลบวัตถุดิบได้" });
    }
};


module.exports = { 
    CreateIngredient,
    getIngredient,
    AddStock,
    DeleteIngredient
};
