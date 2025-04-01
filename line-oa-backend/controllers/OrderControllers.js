const db = require("../db");
require("dotenv").config();

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
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

const createOrder = async (req, res) => {
  try {
    const { customerName, productId, quantityOrdered } = req.body;

    if (
      !customerName ||
      !productId ||
      quantityOrdered == null ||
      quantityOrdered <= 0
    ) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    await db.query("START TRANSACTION");

    const [orderResult] = await db.query(
      "INSERT INTO `Order` (Customer_name, Product_id, Quantity, Order_date) VALUES (?, ?, ?, NOW())",
      [customerName, productId, quantityOrdered]
    );

    const orderId = orderResult.insertId;

    console.log(`✅ Order ID ที่สร้าง: ${orderId}`);

    await deductIngredients([
      { product_id: productId, quantity: quantityOrdered },
    ]);

    await db.query("COMMIT");

    res.status(200).json({
      message: "สร้างออเดอร์สำเร็จ และหักวัตถุดิบแล้ว ✅",
      orderId: orderId,
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("❌ Error creating order:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถสร้างออเดอร์ได้" });
  }
};

const checkStockBeforeDeduct = async (orders) => {
  try {
    for (const order of orders) {
      const [product] = await db.query(
        "SELECT Ingredient_id FROM Product WHERE Product_id = ?",
        [order.product_id]
      );

      let ingredientList = [];

      const raw = product[0].Ingredient_id;
      if (typeof raw === "string") {
        try {
          ingredientList = JSON.parse(raw);
        } catch (e) {
          console.error("❌ JSON parse error in Ingredient_id:", e);
          return `❌ รูปแบบวัตถุดิบไม่ถูกต้องสำหรับสินค้า ${order.product_id}`;
        }
      } else if (Array.isArray(raw)) {
        ingredientList = raw; // ถ้าเป็น array อยู่แล้ว
      } else {
        console.warn("⚠️ Ingredient_id ไม่ใช่ string หรือ array:", raw);
        return `❌ วัตถุดิบของสินค้า ${order.product_id} ไม่ถูกต้อง`;
      }

      for (const ingredient of ingredientList) {
        const ingredientID = ingredient.Ingredient_id;
        const requiredQuantity = ingredient.Quantity_used * order.quantity;

        const [stock] = await db.query(
          "SELECT SUM(Quantity) AS total FROM Ingredient_item WHERE Ingredient_id = ?",
          [ingredientID]
        );

        const totalAvailable = stock[0].total || 0;

        if (totalAvailable < requiredQuantity) {
          return `❌ สต๊อกวัตถุดิบไม่พอ รบกวนคุณลูกค้าสั่งเมนูอื่นนะคะ`;
        }
      }
    }
    return null; // ✅ ถ้าสต็อกเพียงพอทั้งหมด
  } catch (error) {
    console.error("❌ Error checking stock:", error);
    return "❌ เกิดข้อผิดพลาดในการตรวจสอบสต็อกวัตถุดิบ";
  }
};

const deductIngredients = async (productId, quantityOrdered) => {
    try {
      // ✅ ดึง Ingredient_id ของสินค้านั้น ๆ
      const [productRows] = await db.query(
        "SELECT Ingredient_id FROM Product WHERE Product_id = ?",
        [productId]
      );
  
      let ingredientList = [];
      const raw = productRows[0].Ingredient_id;
  
      if (typeof raw === "string") {
        ingredientList = JSON.parse(raw);
      } else if (Array.isArray(raw)) {
        ingredientList = raw;
      } else {
        console.warn("⚠️ Ingredient_id ไม่ถูกต้อง:", raw);
        return;
      }
  
      for (const ingredient of ingredientList) {
        const ingredientID = ingredient.Ingredient_id;
        let qtyToDeduct = ingredient.Quantity_used * quantityOrdered;
  
        // ✅ ดึงลำดับล็อตเรียงตามวันหมดอายุ (FIFO)
        const [batches] = await db.query(
          "SELECT * FROM Ingredient_item WHERE Ingredient_id = ? AND Quantity > 0 ORDER BY expiry_date ASC",
          [ingredientID]
        );
  
        for (const batch of batches) {
          if (qtyToDeduct <= 0) break;
  
          const deductQty = Math.min(batch.Quantity, qtyToDeduct);
          await db.query(
            "UPDATE Ingredient_item SET Quantity = Quantity - ? WHERE Batch_code = ?",
            [deductQty, batch.Batch_code]
          );
           
  
          qtyToDeduct -= deductQty;
          console.log(`🔹 หักวัตถุดิบ: Ingredient ID ${ingredientID}, ใช้ล็อต ${batch.Batch_code}, หัก ${deductQty}`);
        }
  
        // ✅ หลังหักแต่ละล็อตแล้ว อัปเดตคงเหลือรวมใน Ingredient table
        await db.query(
          `UPDATE Ingredient 
           SET Quantity = (
             SELECT COALESCE(SUM(Quantity), 0) 
             FROM Ingredient_item 
             WHERE Ingredient_id = ?
           ), 
           Updated_at = NOW() 
           WHERE Ingredient_id = ?`,
          [ingredientID, ingredientID]
        );
  
        if (qtyToDeduct > 0) {
          console.warn(`⚠️ วัตถุดิบ ID ${ingredientID} ไม่พอ หักได้ไม่ครบ`);
        }
      }
    } catch (error) {
      console.error("❌ Error deducting ingredients:", error);
    }
  };
  
  const deductIngredientsBulk = async (orders) => {
    try {
      for (const order of orders) {
        await deductIngredients(order.product_id, order.quantity);
      }
    } catch (error) {
      console.error("❌ Error in bulk ingredient deduction:", error);
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
    console.error("Error fetching completed orders:", err);
    res.status(500).json({ error: "Failed to fetch completed orders" });
  }
};

module.exports = {
  getOrder,
  createOrder,
  checkStockBeforeDeduct,
  deductIngredients,
  getCompletedOrders,
  deductIngredientsBulk,
};
