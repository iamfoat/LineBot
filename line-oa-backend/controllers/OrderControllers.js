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

        const [orderResult] = await db.query(
            "INSERT INTO `Order` (Customer_name, Product_id, Quantity, Order_date) VALUES (?, ?, ?, NOW())",
            [customerName, productId, quantityOrdered]
        );

        const orderId = orderResult.insertId;

        console.log(`✅ Order ID ที่สร้าง: ${orderId}`);

        await deductIngredients([{ product_id: productId, quantity: quantityOrdered }]);

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


const deductIngredients = async (orders) => {
    try {
        console.log("📌 Orders ที่ส่งมาให้หักวัตถุดิบ:", orders);

        for (let order of orders) {
            // ดึงรายการวัตถุดิบที่ต้องใช้จาก Product
            const [product] = await db.query(
                "SELECT Ingredient_id FROM Product WHERE Product_id = ?",
                [order.product_id]
            );

            if (!product.length) {
                console.error(`❌ ไม่พบสินค้า ID ${order.product_id}`);
                continue;
            }

            let ingredientData = product[0].Ingredient_id;

            // ตรวจสอบและแปลง JSON ถ้าจำเป็น
            let ingredients;
            if (typeof ingredientData === "string") {
                try {
                    ingredients = JSON.parse(ingredientData);
                } catch (error) {
                    console.error(`❌ JSON Parse Error for Product ID ${order.product_id}: Invalid JSON format`, ingredientData);
                    continue;
                }
            } else if (typeof ingredientData === "object") {
                ingredients = ingredientData;
            } else {
                console.error(`❌ Invalid data type for Product ID ${order.product_id}. Expected string or object, received:`, typeof ingredientData);
                continue;
            }

            console.log(`📌 วัตถุดิบที่ต้องใช้สำหรับ Product ID ${order.product_id}:`, ingredients);

            for (const ingredient of ingredients) {
                let ingredientID = ingredient.Ingredient_id;
                let requiredQuantity = ingredient.Quantity_used * order.quantity;

                console.log(`🔹 หักวัตถุดิบ: Ingredient ID ${ingredientID}, ต้องใช้: ${requiredQuantity}`);

                // ดึงสต็อกจาก ingredient_item โดยเรียงลำดับวันหมดอายุ (FIFO)
                const [stockData] = await db.query(
                    "SELECT Batch_code, Quantity FROM Ingredient_item WHERE Ingredient_id = ? ORDER BY Expiry_date ASC",
                    [ingredientID]
                );

                if (!stockData.length) {
                    console.error(`❌ ไม่พบสต็อกของวัตถุดิบ ID ${ingredientID}`);
                    continue;
                }

                for (const batch of stockData) {
                    if (requiredQuantity <= 0) break; // หักเสร็จแล้ว

                    let availableQuantity = batch.Quantity;
                    let batchCode = batch.Batch_code;

                    if (availableQuantity >= requiredQuantity) {
                        // ถ้าสต็อกพอ หักเฉพาะที่ต้องใช้
                        await db.query(
                            "UPDATE Ingredient_item SET Quantity = Quantity - ? WHERE Batch_code = ?",
                            [requiredQuantity, batchCode]
                        );
                        console.log(`✅ หักวัตถุดิบจาก Batch ${batchCode} จำนวน ${requiredQuantity}`);
                        requiredQuantity = 0;
                    } else {
                        // ถ้าสต็อกไม่พอ ใช้ล็อตนี้จนหมด แล้วไปล็อตถัดไป
                        await db.query(
                            "UPDATE Ingredient_item SET Quantity = 0 WHERE Batch_code = ?",
                            [batchCode]
                        );
                        console.log(`⚠️ ใช้หมดล็อต ${batchCode} (${availableQuantity})`);
                        requiredQuantity -= availableQuantity;
                    }
                }
                await db.query(`
                    UPDATE Ingredient i
                    JOIN (
                        SELECT Ingredient_id, SUM(Quantity) AS total_quantity
                        FROM Ingredient_item
                        GROUP BY Ingredient_id
                    ) sub ON i.Ingredient_id = sub.Ingredient_id
                    SET i.Quantity = sub.total_quantity
                `);

                if (requiredQuantity > 0) {
                    console.warn(`❌ สต็อกวัตถุดิบ ${ingredientID} ไม่พอ ขาดอีก ${requiredQuantity}`);
                }
            }
        }
    } catch (error) {
        console.error("❌ Error deducting ingredients:", error);
    }
};

const getCompletedOrders = async (req, res) => {
    try {
        const [completedOrders] = await db.query(`
            SELECT 
                o.Order_id, 
                COALESCE(c.Customer_name, 'ไม่พบชื่อ') AS Customer_name, 
                o.Total_amount, 
                o.Customer_Address, 
                o.created_at, 
                o.Status
            FROM \`Order\` o
            LEFT JOIN \`Customer\` c ON o.Customer_id = c.Customer_id
            WHERE o.Status = 'Completed'  -- ✅ ดึงเฉพาะ Order ที่เสร็จสมบูรณ์
            ORDER BY o.created_at DESC
        `);
        
        res.status(200).json(completedOrders);
    } catch (err) {
        console.error('Error fetching completed orders:', err);
        res.status(500).json({ error: 'Failed to fetch completed orders' });
    }
};



module.exports = {
    getOrder,
    createOrder,
    deductIngredients,
    getCompletedOrders
    
};