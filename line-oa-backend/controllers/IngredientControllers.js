const db = require('../db'); // ดึง Database Connection

const CreateIngredient = async (req, res) => {
    try {
        const { Ingredient_name, Quantity, Low_stock_threshold, Purchase_Price, Expiry_date } = req.body;

        if (!Ingredient_name || Quantity == null || Purchase_Price == null || Expiry_date == null) {
            return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
        }

        await db.query("START TRANSACTION");

        let Ingredient_id;
        let newQuantity = parseInt(Quantity, 10);

        // ✅ ค้นหา Ingredient_id
        const [existingIngredient] = await db.query(
            "SELECT Ingredient_id FROM Ingredient WHERE Ingredient_name = ?",
            [Ingredient_name]
        );

        if (existingIngredient.length > 0) {
            Ingredient_id = existingIngredient[0].Ingredient_id;

            // ✅ เพิ่มวัตถุดิบลง `Ingredient_item`
            await db.query(
                "INSERT INTO Ingredient_item (Ingredient_id, Batch_code, Quantity, Purchase_Price, Expiry_date, Create_at) VALUES (?, ?, ?, ?, ?, NOW())",
                [Ingredient_id, Date.now(), Quantity, Purchase_Price, Expiry_date]
            );

            // ✅ อัปเดต `Quantity` ใน Ingredient
            await db.query(
                "UPDATE Ingredient SET Quantity = (SELECT COALESCE(SUM(Quantity), 0) FROM Ingredient_item WHERE Ingredient_id = ?), Updated_at = NOW() WHERE Ingredient_id = ?",
                [Ingredient_id, Ingredient_id]
            );
        } else {
            // ✅ เพิ่ม `Ingredient` ใหม่
            const [result] = await db.query(
                "INSERT INTO Ingredient (Ingredient_name, Quantity, Low_stock_threshold, Updated_at) VALUES (?, ?, ?, NOW())",
                [Ingredient_name, Quantity, Low_stock_threshold]
            );
            Ingredient_id = result.insertId;

            // ✅ เพิ่ม `Ingredient_item`
            await db.query(
                "INSERT INTO Ingredient_item (Ingredient_id, Batch_code, Quantity, Purchase_Price, Expiry_date, Create_at) VALUES (?, ?, ?, ?, ?, NOW())",
                [Ingredient_id, Date.now(), Quantity, Purchase_Price, Expiry_date]
            );
        }

        await db.query("COMMIT");

        res.status(201).json({ 
            message: "✅ เพิ่มวัตถุดิบสำเร็จ",
            Ingredient_id,
            total_quantity: newQuantity
        });

    } catch (error) {
        await db.query("ROLLBACK");
        console.error("❌ Error creating ingredient batch:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถเพิ่มวัตถุดิบได้" });
    }
};



const getIngredient = async (req, res) => {
    try {
        const [ingredients] = await db.query(`
            SELECT 
                i.Ingredient_id, 
                i.Ingredient_name, 
                COALESCE(SUM(ii.Quantity), 0) AS Total_Quantity, -- ✅ รวมจำนวนทั้งหมด
                i.Low_stock_threshold,
                MAX(ii.Expiry_date) AS Latest_Expiry,
                MAX(ii.Create_at) AS Updated_at
            FROM Ingredient i
            LEFT JOIN Ingredient_item ii ON i.Ingredient_id = ii.Ingredient_id
            GROUP BY i.Ingredient_id, i.Ingredient_name, i.Low_stock_threshold;
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

const AddMultipleIngredients = async (req, res) => {
    try {
        const { ingredients } = req.body;

        if (!ingredients || ingredients.length === 0) {
            return res.status(400).json({ error: "กรุณากรอกวัตถุดิบอย่างน้อย 1 รายการ" });
        }

        await db.query("START TRANSACTION");

        for (const ing of ingredients) {
            let { name, quantity, price, threshold, expiry_date } = ing;

            if (!name || quantity == null || price == null) {
                return res.status(400).json({ error: "กรุณากรอก Name, Quantity และ Price ให้ครบถ้วน" });
            }

            quantity = parseInt(quantity, 10);
            price = parseFloat(price);
            threshold = parseInt(threshold, 10) || 0;

            expiry_date = expiry_date || new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split("T")[0];

            let Ingredient_id;
            const [existingIngredient] = await db.query(
                "SELECT Ingredient_id FROM `Ingredient` WHERE Ingredient_name = ?",
                [name]
            );

            if (existingIngredient.length > 0) {
                Ingredient_id = existingIngredient[0].Ingredient_id;
                await db.query(
                    "UPDATE `Ingredient` SET Low_stock_threshold = ? WHERE Ingredient_id = ?",
                    [threshold, Ingredient_id]
                );
            } else {
                const [result] = await db.query(
                    "INSERT INTO `Ingredient` (Ingredient_name, Quantity, Low_stock_threshold, Updated_at) VALUES (?, ?, ?, NOW())",
                    [name, quantity, threshold] 
                );                
                Ingredient_id = result.insertId;
            }

            const Batch_code = Date.now();
            await db.query(
                "INSERT INTO `Ingredient_item` (Ingredient_id, Batch_code, Quantity, Purchase_Price, Expiry_date, Create_at) VALUES (?, ?, ?, ?, ?, NOW())",
                [Ingredient_id, Batch_code, quantity, price, expiry_date]
            );

            // ✅ อัปเดต Quantity ใน Ingredient
            await db.query(
                "UPDATE Ingredient SET Quantity = (SELECT COALESCE(SUM(Quantity), 0) FROM Ingredient_item WHERE Ingredient_id = ?), Updated_at = NOW() WHERE Ingredient_id = ?",
                [Ingredient_id, Ingredient_id]
            );
        }

        await db.query("COMMIT");

        res.status(201).json({ message: "✅ เพิ่มวัตถุดิบสำเร็จ" });

    } catch (error) {
        await db.query("ROLLBACK");
        console.error("❌ Error adding ingredients:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถเพิ่มวัตถุดิบได้" });
    }
};



module.exports = { 
    CreateIngredient,
    getIngredient,
    AddStock,
    DeleteIngredient,
    AddMultipleIngredients
};
