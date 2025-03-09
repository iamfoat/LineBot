const axios = require("axios");
const db = require("../db");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    SLIPOK_BRANCH_ID: process.env.SLIPOK_BRANCH_ID,
    SLIPOK_API_KEY: process.env.SLIPOK_API_KEY,
};

// 📥 ฟังก์ชันดาวน์โหลดภาพจาก LINE API
const downloadImage = async (imageId) => {
    const url = `https://api-data.line.me/v2/bot/message/${imageId}/content`;
    const headers = { Authorization: `Bearer ${config.channelAccessToken}` };

    try {
        console.log("📥 Downloading image from:", url);
        const response = await axios.get(url, { headers, responseType: "arraybuffer" });

        const tmpDir = path.join(__dirname, "..", "tmp");
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const imagePath = path.join(tmpDir, `slip-${imageId}.jpg`);
        fs.writeFileSync(imagePath, response.data);

        return imagePath;
    } catch (error) {
        console.error("❌ Error downloading image:", error.response ? error.response.data.toString() : error.message);
        return null;
    }
};

// ✅ ฟังก์ชันตรวจสอบสลิปโอนเงิน
const verifySlip = async (imageId, orderId, customerId) => {
    try {
        const imagePath = await downloadImage(imageId);
        if (!imagePath) {
            return "❌ ไม่สามารถดาวน์โหลดรูปภาพได้ กรุณาส่งใหม่";
        }

        const formData = new FormData();
        formData.append("files", fs.createReadStream(imagePath));
        formData.append("log", "true");

        const response = await axios.post(
            `https://api.slipok.com/api/line/apikey/${config.SLIPOK_BRANCH_ID}`,
            formData,
            {
                headers: {
                    "x-authorization": config.SLIPOK_API_KEY,
                    ...formData.getHeaders(),
                }
            }
        );

        // ลบไฟล์หลังส่งเสร็จ
        fs.unlinkSync(imagePath);

        console.log("✅ SlipOK Response:", response.data);

        if (response.data.success) {
            await db.query("UPDATE Payment SET status = 'Confirmed' WHERE Order_id = ?", [orderId]);

            // ✅ อัปเดตสถานะออเดอร์เป็น Completed
            await db.query("UPDATE `Order` SET status = 'Completed' WHERE Order_id = ?", [orderId]);

            return "✅ สลิปถูกต้องและได้รับการยืนยัน";
        } else {
            return "❌ สลิปไม่ถูกต้อง กรุณาส่งใหม่";
        }
    } catch (error) {
        console.error("❌ Error verifying slip:", error.response ? error.response.data : error.message);
        return `❌ มีข้อผิดพลาดในการตรวจสอบสลิป`;
    }
};

const CashPayment = async (orderId, customerId) => {
    try {
        // ✅ ตรวจสอบว่ามี Payment สำหรับ Order นี้หรือยัง
        const [existingPayment] = await db.query(
            "SELECT * FROM Payment WHERE Order_id = ?",
            [orderId]
        );

        if (existingPayment.length > 0) {
            return "⛔ คำสั่งซื้อมีการชำระเงินอยู่แล้ว";
        }

        // ✅ บันทึกข้อมูลการชำระเงินสด
        await db.query(
            "INSERT INTO Payment (Order_id, Amount, Payment_method, Payment_date, status) VALUES (?, ?, ?, NOW(), 'Pending')",
            [orderId, 0, "Cash"] // 💵 เงินสด ไม่มีจำนวนเงินในระบบ
        );

        return "✅ ระบบบันทึกการชำระเงินสด กรุณาให้พนักงานตรวจสอบ";
    } catch (error) {
        console.error("❌ Error processing cash payment:", error);
        return "❌ มีข้อผิดพลาดในการบันทึกการชำระเงินสด";
    }
};


module.exports = {
    verifySlip,
    CashPayment
};
