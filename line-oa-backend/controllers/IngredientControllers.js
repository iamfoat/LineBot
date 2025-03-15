const db = require('../db'); // ดึง Database Connection

const CreateIngredient = async (req, res) => {
    try {
        const { Ingredient_name, Quantity, Low_stock_threshold } = req.body;

        if (!Ingredient_name || Quantity == null) {
            return res.status(400).json({ error: "กรุณากรอกชื่อวัตถุดิบและจำนวนเริ่มต้น" });
        }

        await db.query("START TRANSACTION");

        // ✅ ตรวจสอบว่ามี `Ingredient_name` นี้อยู่แล้วหรือไม่
        const [existingIngredient] = await db.query(
            "SELECT Ingredient_id, Quantity FROM `Ingredient` WHERE Ingredient_name = ?",
            [Ingredient_name]
        );

        let Ingredient_id;
        let newQuantity;

        if (existingIngredient.length > 0) {
            // ✅ ถ้ามีวัตถุดิบอยู่แล้ว ให้อัปเดต `Quantity`
            Ingredient_id = existingIngredient[0].Ingredient_id;
            newQuantity = parseInt(existingIngredient[0].Quantity, 10) + parseInt(Quantity, 10);


            await db.query(
                "UPDATE `Ingredient` SET Quantity = ?, Updated_at = NOW() WHERE Ingredient_id = ?",
                [newQuantity, Ingredient_id]
            );

        } else {
            // ✅ ถ้ายังไม่มี ให้สร้างใหม่
            const [result] = await db.query(
                "INSERT INTO `Ingredient` (Ingredient_name, Quantity, Low_stock_threshold) VALUES (?, ?, ?)",
                [Ingredient_name, Quantity, Low_stock_threshold]
            );
            Ingredient_id = result.insertId;
            newQuantity = Quantity;
        }

        // ✅ เพิ่ม `Ingredient_item` เพื่อเก็บประวัติการเพิ่มสต็อกแต่ละครั้ง
        const Batch_code = Date.now(); // ใช้ timestamp เป็น Batch_code
        const Expiry_date = new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split("T")[0]; // +5 วัน

        await db.query(
            "INSERT INTO `Ingredient_item` (Ingredient_id, Batch_code, Quantity, Expiry_date) VALUES (?, ?, ?, ?)",
            [Ingredient_id, Batch_code, Quantity, Expiry_date]
        );

        await db.query("COMMIT");

        res.status(201).json({ 
            message: "อัปเดตวัตถุดิบสำเร็จ ✅ และเพิ่ม Batch ใหม่",
            Ingredient_id,
            updated_quantity: newQuantity,
            Batch_code,
            Expiry_date
        });

    } catch (error) {
        await db.query("ROLLBACK");
        console.error("❌ Error creating or updating ingredient:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถเพิ่มวัตถุดิบได้" });
    }
};




const getIngredient = async (req, res) => {
    try {
        const [ingredients] = await db.query(`
            SELECT MIN(Ingredient_id) AS Ingredient_id, Ingredient_name, 
                   SUM(Quantity) AS Quantity, MAX(Updated_at) AS Updated_at, 
                   MAX(Low_stock_threshold) AS Low_stock_threshold
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
