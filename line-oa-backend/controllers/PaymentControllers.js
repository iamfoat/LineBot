const axios = require("axios");
const db = require("../db");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const cloudinary = require("cloudinary").v2;

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  SLIPOK_BRANCH_ID: process.env.SLIPOK_BRANCH_ID,
  SLIPOK_API_KEY: process.env.SLIPOK_API_KEY,
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📥 ฟังก์ชันดาวน์โหลดภาพจาก LINE API
const downloadImage = async (imageId) => {
  const url = `https://api-data.line.me/v2/bot/message/${imageId}/content`;
  const headers = { Authorization: `Bearer ${config.channelAccessToken}` };

  try {
    console.log("📥 Downloading image from:", url);
    // console.log("📥 Sending request with headers:", headers);
    const response = await axios.get(url, {
      headers,
      responseType: "arraybuffer",
    });

    const tmpDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const imagePath = path.join(tmpDir, `slip-${imageId}.jpg`);
    fs.writeFileSync(imagePath, response.data);

    return imagePath;
  } catch (error) {
    console.error(
      "❌ Error downloading image:",
      error.response ? error.response.data.toString() : error.message
    );
    return null;
  }
};

// ฟังก์ชันตรวจสอบสลิป
const verifySlip = async (imageId, orderId, customerId) => {
  try {
    const imagePath = await downloadImage(imageId);
    if (!imagePath) {
      return "❌ ไม่สามารถดาวน์โหลดรูปภาพได้ กรุณาส่งใหม่";
    }

    const result = await cloudinary.uploader.upload(imagePath, {
      folder: "slips",
    });
    const imageUrl = result.secure_url;
    console.log("✅ URL ที่ได้จาก Cloudinary:", imageUrl);

    // ✅ 1. ดึงยอดที่ต้องจ่ายจาก DB
    const [orderRows] = await db.query(
      "SELECT Total_amount FROM `Order` WHERE Order_id = ?",
      [orderId]
    );
    const amount = orderRows.length ? orderRows[0].Total_amount : 0;

    const FormData = require("form-data");
    const formData = new FormData();
    formData.append("files", fs.createReadStream(imagePath));
    formData.append("log", "true");
    formData.append("amount", amount);

    const SLIPOK_BRANCH_ID = "40471";
    const SLIPOK_API_KEY = "SLIPOKMNB83WS";

    const response = await axios.post(
      `https://api.slipok.com/api/line/apikey/${SLIPOK_BRANCH_ID}`,
      formData,
      {
        headers: {
          "x-authorization": SLIPOK_API_KEY,
          ...formData.getHeaders(),
        },
      }
    );

    const { data } = response.data;

    fs.unlinkSync(imagePath);
    console.log("✅ SlipOK Response:", response.data);

    if (data?.success) {
      await db.query(
        "UPDATE Payment SET status = 'Confirmed' WHERE Order_id = ?",
        [orderId]
      );

      // ✅ อัปเดตสถานะออเดอร์เป็น Completed
      await db.query(
        "UPDATE `Order` SET status = 'Completed' WHERE Order_id = ?",
        [orderId]
      );

      return "✅ สลิปถูกต้องและได้รับการยืนยัน";
    } else {
      return "❌ สลิปไม่ถูกต้อง กรุณาส่งใหม่";
    }
  } catch (error) {
    const errData = error?.response?.data;
    console.error("raw error object:", error);
    console.error("error.response:", error.response);
    console.error("error.response.data:", errData);

    if (errData?.code) {
      switch (errData.code) {
        case 1010:
          return "⚠️ กรุณารอสักครู่ สลิปจากธนาคารต้องรอประมาณ 5 นาที";
        case 1012:
          // ✅ ตรงนี้! ดึง timestamp จาก message
          const timestamp = errData.message?.split("เมื่อ")[1]?.trim();
          return `❗ สลิปซ้ำ: เคยส่งเมื่อ ${timestamp || "ก่อนหน้านี้"}`;
        case 1013:
          return "❌ ยอดเงินไม่ตรงกับสลิป กรุณาตรวจสอบอีกครั้ง";
        case 1014:
          return "❌ บัญชีผู้รับไม่ตรงกับร้านค้า";
        default:
          return `❌ ตรวจสอบไม่ผ่าน (code: ${errData.code})`;
      }
    }

    return "❌ มีข้อผิดพลาดในการตรวจสอบสลิป";
  }
};

const CashPayment = async (orderId, customerId) => {
  try {
    // ✅ ตรวจสอบว่ามี Payment สำหรับ Order นี้หรือยัง
    const [existingPayment] = await db.query(
      "SELECT * FROM Payment WHERE Order_id = ? AND status = 'Confirmed'",
      [orderId]
    );

    if (existingPayment.length > 0) {
      return "⛔ คำสั่งซื้อมีการชำระเงินอยู่แล้ว";
    }

    const [orderRow] = await db.query(
        "SELECT Total_amount FROM `Order` WHERE Order_id = ?",
        [orderId]
      );
      
      const amount = orderRow.length > 0 ? orderRow[0].Total_amount : 0;
      

    // ✅ บันทึกข้อมูลการชำระเงินสด
    await db.query(
      "INSERT INTO Payment (Order_id, Amount, Payment_method, Payment_date, status) VALUES (?, ?, ?, NOW(), 'Confirmed')",
      [orderId, amount, "Cash"] // 💵 เงินสด ไม่มีจำนวนเงินในระบบ
    );

    await db.query(
      "UPDATE `Order` SET status = 'Completed' WHERE Order_id = ?",
      [orderId]
    );

    return "✅ ระบบบันทึกการชำระเงินสด กรุณาให้พนักงานตรวจสอบ";
  } catch (error) {
    console.error("❌ Error processing cash payment:", error);
    return "❌ มีข้อผิดพลาดในการบันทึกการชำระเงินสด";
  }
};

module.exports = {
  verifySlip,
  CashPayment,
};
