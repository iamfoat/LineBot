const db = require('../db');
require('dotenv').config();


const getOrder = async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT 
                o.Order_id, 
                COALESCE(c.Customer_name, 'ไม่พบชื่อ') AS Customer_name, 
                o.Total_amount, 
                o.Customer_Address, 
                o.created_at, 
                o.Status
            FROM \`Order\` o
            LEFT JOIN \`Customer\` c ON o.Customer_id = c.Customer_id
        `);
        // console.log("Fetched Orders:", orders);
        res.status(200).json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

const createOrder = async (req, res) => {
    try {
        const { customerName, productId, quantityOrdered } = req.body;

        if (!customerName || !productId || quantityOrdered == null || quantityOrdered <= 0) {
            return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
        }

        await db.query("START TRANSACTION");

        // ✅ 1. บันทึก Order
        const [orderResult] = await db.query(
            "INSERT INTO `Order` (Customer_name, Product_id, Quantity, Order_date) VALUES (?, ?, ?, NOW())",
            [customerName, productId, quantityOrdered]
        );

        const orderId = orderResult.insertId;

        // ✅ 2. ค้นหาวัตถุดิบที่ต้องใช้ใน Product
        const [ingredients] = await db.query(
            `SELECT pi.Ingredient_id, pi.Quantity_used, ii.Item_id, ii.Quantity AS batch_quantity
             FROM Product p
             JOIN Product_Ingredient pi ON p.Product_id = pi.Product_id
             JOIN Ingredient_item ii ON pi.Ingredient_id = ii.Ingredient_id
             WHERE p.Product_id = ?
             ORDER BY ii.Expiry_date ASC`, // ✅ ใช้วัตถุดิบที่หมดอายุก่อน
            [productId]
        );

        if (ingredients.length === 0) {
            await db.query("ROLLBACK");
            return res.status(404).json({ error: "ไม่พบวัตถุดิบสำหรับสินค้านี้" });
        }

        // ✅ 3. ตรวจสอบวัตถุดิบคงเหลือ
        let totalRequired = 0;
        for (const ingredient of ingredients) {
            totalRequired += ingredient.Quantity_used * quantityOrdered;
            if (ingredient.batch_quantity < totalRequired) {
                await db.query("ROLLBACK");
                return res.status(400).json({
                    error: `วัตถุดิบไม่เพียงพอ (Ingredient ID ${ingredient.Ingredient_id}) ต้องใช้ ${totalRequired}, คงเหลือ ${ingredient.batch_quantity}`
                });
            }
        }

        // ✅ 4. หักจำนวนวัตถุดิบจาก `Ingredient_item`
        for (const ingredient of ingredients) {
            let required = ingredient.Quantity_used * quantityOrdered;
            let batch_quantity = ingredient.batch_quantity;

            while (required > 0 && batch_quantity > 0) {
                if (batch_quantity >= required) {
                    await db.query(
                        "UPDATE Ingredient_item SET Quantity = Quantity - ? WHERE Item_id = ?",
                        [required, ingredient.Item_id]
                    );
                    required = 0;
                } else {
                    await db.query(
                        "UPDATE Ingredient_item SET Quantity = 0 WHERE Item_id = ?",
                        [ingredient.Item_id]
                    );
                    required -= batch_quantity;
                }
            }
        }

        await db.query("COMMIT");

        res.status(200).json({
            message: "สร้างออเดอร์สำเร็จ และหักวัตถุดิบแล้ว ✅",
            orderId: orderId
        });

    } catch (error) {
        await db.query("ROLLBACK");
        console.error("❌ Error creating order:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถสร้างออเดอร์ได้" });
    }
};



module.exports = {
    getOrder,
    createOrder,
    
};