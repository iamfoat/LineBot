const db = require("../db"); // ดึง Database Connection
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const moment = require("moment");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CreateIngredient = async (req, res) => {
  try {
    const {
      Ingredient_name,
      Quantity,
      Low_stock_threshold,
      Purchase_Price,
      Expiry_date,
    } = req.body;

    if (
      !Ingredient_name ||
      Quantity == null ||
      Purchase_Price == null ||
      Expiry_date == null
    ) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    await db.query("START TRANSACTION");

    let Ingredient_id;
    let newQuantity = parseInt(Quantity, 10);

    if (isNaN(newQuantity)) {
      return res.status(400).json({ error: "Quantity ต้องเป็นตัวเลข" });
    }
    newQuantity = newQuantity * 1000;

    console.log(newQuantity);

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
        [Ingredient_id, Date.now(), newQuantity, Purchase_Price, Expiry_date]
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
        [Ingredient_name, newQuantity, Low_stock_threshold]
      );
      Ingredient_id = result.insertId;

      // ✅ เพิ่ม `Ingredient_item`
      await db.query(
        "INSERT INTO Ingredient_item (Ingredient_id, Batch_code, Quantity, Purchase_Price, Expiry_date, Create_at) VALUES (?, ?, ?, ?, ?, NOW())",
        [Ingredient_id, Date.now(), newQuantity, Purchase_Price, Expiry_date]
      );
    }

    await db.query("COMMIT");

    res.status(201).json({
      message: "✅ เพิ่มวัตถุดิบสำเร็จ",
      Ingredient_id,
      total_quantity: newQuantity,
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("❌ Error creating ingredient batch:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถเพิ่มวัตถุดิบได้" });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/ingredients");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const ingredientUploader = multer({ storage: multer.memoryStorage() });

const analyzeIngredientSlip = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // 1️⃣ Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "ingredient-receipts" },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });

    const receiptImg = uploadResult.secure_url;

    // 2️⃣ Analyze with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      {
        text: `คุณคือระบบ OCR สำหรับใบเสร็จ Makro

ให้อ่านภาพใบเสร็จ แล้วแยกรายการสินค้าในรูปแบบ JSON ตามตัวอย่างนี้:

{
  "items": [
    {
      "name": "น้ำปลาทิพรสขวดเพท300ซีซี",
      "quantity": 6,
      "price": 97,
      "expiry_date": null
    }
  ]
}

คำอธิบาย:
- name = ชื่อสินค้าจากบรรทัดที่เป็นคำอธิบาย
- quantity = จำนวนชิ้นรวมทั้งหมดในรายการนั้น (แยกจาก packs/units)
- price = ราคาต่อหน่วย (หากมีราคาทั้งหมด ให้หารออกมา)
- expiry_date = null ถ้าไม่มีในใบเสร็จ

อย่าตอบอธิบายใด ๆ ให้ตอบเป็น JSON เท่านั้น ถ้าไม่มีสินค้าให้ items เป็น []`,
      },
      {
        inlineData: {
          mimeType: file.mimetype,
          data: file.buffer.toString("base64"),
        },
      },
    ]);

    console.log("🔍 Gemini raw text:", result.response.text());
    let ocrText = result.response.text().trim();

    // ✅ Strip markdown ```json ... ```
    if (ocrText.startsWith("```")) {
      const match = ocrText.match(/```json\s*([\s\S]*?)```/);
      if (match && match[1]) {
        ocrText = match[1].trim();
      }
    }

    let json;
    try {
      json = JSON.parse(ocrText);
    } catch (e) {
      console.error("❌ JSON parse error:", e.message);
      return res.status(400).json({
        error: "ไม่สามารถแปลง JSON ได้",
        raw: ocrText,
      });
    }
    const generateBatchCode = () =>
      `Lot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 3️⃣ Insert items to Ingredient_item
    for (const item of json.items) {
      const batchCode = generateBatchCode();
      const [ingredient] = await db.query(
        "SELECT Ingredient_id FROM Ingredient WHERE Ingredient_name = ?",
        [item.name]
      );

      if (ingredient.length === 0) continue;

      const expiryDate =
        item.expiry_date || moment().add(5, "days").format("YYYY-MM-DD");

      await db.query(
        `INSERT INTO Ingredient_item (Ingredient_id, Batch_code, quantity, purchase_price, expiry_date, receipt_img, , Create_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          ingredient[0].Ingredient_id,
          batchCode,
          item.quantity,
          item.price,
          expiryDate,
          receiptImg,
          new Date(),
        ]
      );

      await db.query(
        "UPDATE Ingredient SET Quantity = Quantity + ? WHERE Ingredient_id = ?",
        [item.quantity, ingredient[0].Ingredient_id]
      );
    }

    res.json({
      message: "วิเคราะห์ภาพสำเร็จ",
      items: json.items,
      receipt_img: receiptImg,
    });
  } catch (error) {
    console.error("❌ analyzeIngredientSlip error:", error.message);
    res.status(500).json({ error: "OCR หรือการบันทึกล้มเหลว" });
  }
};

const confirmOcrInsertToDB = async (req, res) => {
  const { items, receipt_img } = req.body;
  const generateBatchCode = () =>
    `Lot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    for (const item of items) {
      const batchCode = generateBatchCode();
      let ingredientId;

      // 🔍 1. ตรวจสอบชื่อวัตถุดิบ
      const [ingredient] = await db.query(
        "SELECT Ingredient_id FROM Ingredient WHERE Ingredient_name = ?",
        [item.name]
      );

      if (ingredient.length === 0) {
        // ➕ 2. ถ้าไม่เจอ → เพิ่มใหม่เข้า Ingredient
        const [insertResult] = await db.query(
          "INSERT INTO Ingredient (Ingredient_name, Quantity, Low_stock_threshold, Updated_at) VALUES (?, ?, ?, NOW())",
          [item.name, 0, 5] // ❗ ตั้งค่า Low_stock_threshold ตามที่คุณใช้
        );
        ingredientId = insertResult.insertId;
        console.log(
          `✅ เพิ่ม Ingredient ใหม่: ${item.name} (ID: ${ingredientId})`
        );
      } else {
        ingredientId = ingredient[0].Ingredient_id;
      }

      // 📦 3. เพิ่มเข้า Ingredient_item
      const expiryDate =
        item.expiry_date || moment().add(5, "days").format("YYYY-MM-DD");

      const quantityGrams = item.quantity * 1000;

      await db.query(
        `INSERT INTO Ingredient_item 
            (Ingredient_id, quantity, purchase_price, expiry_date, receipt_img, Batch_code)
            VALUES (?, ?, ?, ?, ?, ?)`,
        [
          ingredientId,
          quantityGrams,
          item.price,
          expiryDate,
          receipt_img,
          batchCode,
        ]
      );

      // 🔄 4. อัปเดต stock
      await db.query(
        "UPDATE Ingredient SET Quantity = Quantity + ?, Updated_at = NOW() WHERE Ingredient_id = ?",
        [quantityGrams, ingredientId]
      );
    }

    res.json({
      message: "✅ บันทึกข้อมูลทั้งหมดสำเร็จ (รวมเพิ่มวัตถุดิบใหม่)",
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึก" });
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
      return res
        .status(400)
        .json({ error: "กรุณาระบุ Ingredient_id และ quantity" });
    }

    const quantityGrams = quantity * 1000;
    // ✅ อัปเดตสต็อกและเวลาล่าสุด
    const [result] = await db.query(
      "UPDATE `Ingredient` SET Quantity = Quantity + ?, Updated_at = NOW() WHERE Ingredient_id = ?",
      [quantityGrams, Ingredient_id]
    );

    res
      .status(200)
      .json({ message: "อัปเดตสต็อกสำเร็จ ✅", updated_quantity: quantity });
  } catch (error) {
    console.error("❌ Error updating stock:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาด ไม่สามารถอัปเดตสต็อกได้" });
  }
};

const DeleteIngredient = async (req, res) => {
  try {
    const { Ingredient_id } = req.params;

    const [result] = await db.query(
      "DELETE FROM `ingredient` WHERE Ingredient_id = ?",
      [Ingredient_id]
    );

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
      return res
        .status(400)
        .json({ error: "กรุณากรอกวัตถุดิบอย่างน้อย 1 รายการ" });
    }

    await db.query("START TRANSACTION");

    for (const ing of ingredients) {
      let { name, quantity, price, threshold, expiry_date } = ing;

      if (!name || quantity == null || price == null) {
        return res
          .status(400)
          .json({ error: "กรุณากรอก Name, Quantity และ Price ให้ครบถ้วน" });
      }

      quantity = parseInt(quantity, 10);
      price = parseFloat(price);
      threshold = parseInt(threshold, 10) || 0;
      const quantityGrams = quantity * 1000;

      expiry_date =
        expiry_date ||
        new Date(new Date().setDate(new Date().getDate() + 5))
          .toISOString()
          .split("T")[0];

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
          [name, quantityGrams, threshold]
        );
        Ingredient_id = result.insertId;
      }

      const Batch_code = Date.now();
      await db.query(
        "INSERT INTO `Ingredient_item` (Ingredient_id, Batch_code, Quantity, Purchase_Price, Expiry_date, Create_at) VALUES (?, ?, ?, ?, ?, NOW())",
        [Ingredient_id, Batch_code, quantityGrams, price, expiry_date]
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
  AddMultipleIngredients,
  ingredientUploader,
  analyzeIngredientSlip,
  confirmOcrInsertToDB,
};
