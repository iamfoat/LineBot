require("dotenv").config();
const express = require("express");
const app = express();
const { exec } = require("child_process");
const line = require("@line/bot-sdk");
const db = require("./db");
const productRoutes = require("./routes/ProductRoutes");
const orderRoutes = require("./routes/OrderRoutes");
const orderitemRoutes = require("./routes/OrderItemRoutes");
const ingredientRoutes = require("./routes/IngredientRoutes");
const ingredientItemRoutes = require("./routes/IngredientItemRoutes");
const cors = require("cors");
const axios = require("axios");
const cron = require("node-cron");
const { sendMenuToLine } = require("./controllers/ProductControllers");
const path = require("path");
const {
  deductIngredients,
  checkStockBeforeDeduct,
  deductIngredientsBulk,
} = require("./controllers/OrderControllers");
const fs = require("fs");
const Dashboard = require("./routes/DashboardRoutes");
const ingredient2 = require("./routes/IngredientRoutes2");
const cloudinary = require("cloudinary").v2;
const paymentroutes = require("./routes/PaymentRoutes");
const { verifySlip, CashPayment } = require("./controllers/PaymentControllers");

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/api/products", productRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/orders", orderRoutes);
app.use("/api", orderitemRoutes);
app.use("/api", ingredientRoutes);
app.use("/api", ingredientItemRoutes);
app.use("/api", Dashboard);
app.use("/api", ingredient2);
app.use("/api", paymentroutes);

const swaggerOptions = {
  definition: {
      openapi: "3.0.0",
      info: {
          title: "API doc",
          version: "1.0.0",
          description: "API documents",
      },
      servers: [
          {
              usl: "http://localhost:8000/",
          },
      ],
  },
  apis: ["./routes/*.js"], // เส้นทางไปยัง route files
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!config.channelAccessToken || !config.channelSecret) {
  throw new Error(
    "Missing CHANNEL_ACCESS_TOKEN or CHANNEL_SECRET in .env file"
  );
}

const client = new line.Client(config);
const pendingOrders = {};

app.get("/", (req, res) => {
  res.send("Hello, LINE OA is running!");
});

async function getUserProfile(userId) {
  try {
    const response = await axios.get(
      `https://api.line.me/v2/bot/profile/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${config.channelAccessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

app.post("/webhook", async (req, res) => {
  const events = req.body.events;

  for (let event of events) {
    // ✅ ตรวจจับข้อความที่ลูกค้าพิมพ์เข้ามา
    if (event.type === "message" && event.message.type === "text") {
      let customerId = event.source.userId;
      let customerName = null;
      let customerText = event.message.text;

      if (event.source.type === "group") {
        customerId = event.source.groupId; // ใช้ `groupId` เป็น `Customer_id`
        customerName = "Group Chat";
        // console.log("ได้รับข้อความจาก Group ID:", customerId);
      } else if (event.source.type === "user") {
        customerId = event.source.userId; // ใช้ `userId` เป็น `Customer_id`
        // console.log("ได้รับข้อความจาก User ID:", customerId);

        //ดึงข้อมูลโปรไฟล์
        const profile = await getUserProfile(customerId);
        if (profile) {
          customerName = profile.displayName;
        }
      }

      try {
        // ✅ บันทึกลูกค้าในฐานข้อมูล
        await db.query(
          `INSERT INTO Customer (Customer_id, Customer_name) 
                     VALUES (?, ?) 
                     ON DUPLICATE KEY UPDATE Customer_name = VALUES(Customer_name)`,
          [customerId, customerName]
        );
        console.log(`✅ บันทึก ${customerId} ลงฐานข้อมูลเรียบร้อย`);
        console.log(customerText);

        if (
          customerText.includes("สวัสดี") ||
          customerText.includes("เมนู") ||
          customerText.includes("สั่งซื้อ")
        ) {
          // ส่งเมนูกลับไป
          await sendMenuToLine(customerId); // เรียกฟังก์ชันเพื่อส่งเมนู
        }

        // ✅ 2. เรียก Model วิเคราะห์คำสั่งซื้อ
        const modelPath = path.join(__dirname, ".", "Model", "NLP.py");
        exec(
          `python "${modelPath}" "${customerText}"`,
          async (error, stdout) => {
            if (error) {
              console.error("❌ Error running model:", error);
              return;
            }

            let orders;
            try {
              orders = JSON.parse(stdout);
              console.log(orders);
            } catch (parseError) {
              console.error("❌ JSON Parse Error:", parseError);
              await client.replyMessage(event.replyToken, {
                type: "text",
                text: "เกิดข้อผิดพลาด กรุณาลองใหม่",
              });
              return;
            }

            if (!Array.isArray(orders) || orders.length === 0) {
              return;
            }

            let totalAmount = 0;
            for (let order of orders) {
              const [rows] = await db.query(
                "SELECT Price FROM Product WHERE Product_id = ?",
                [order.product_id]
              );
              if (!rows.length || !rows[0].Price) continue;
              let price = parseFloat(rows[0].Price);
              let subtotal = price * order.quantity;
              totalAmount += subtotal;
            }

            if (totalAmount === 0) {
              return;
            }

            // ✅ ส่งปุ่มให้ลูกค้ายืนยัน
            const confirmMessage = {
              type: "flex",
              altText: "กรุณายืนยันคำสั่งซื้อ",
              contents: {
                type: "bubble",
                body: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "ยืนยันคำสั่งซื้อ",
                      weight: "bold",
                      size: "xl",
                    },
                    ...orders.map((order) => ({
                      type: "text",
                      text: `- ${order.menu} x ${order.quantity} แก้ว`,
                      wrap: true,
                    })),
                    {
                      type: "text",
                      text: `ยอดรวม: ${totalAmount} บาท`,
                      weight: "bold",
                    },
                  ],
                },
                footer: {
                  type: "box",
                  layout: "horizontal",
                  spacing: "sm",
                  contents: [
                    {
                      type: "button",
                      style: "primary",
                      color: "#1DB446",
                      action: {
                        type: "postback",
                        label: "Confirm",
                        data: JSON.stringify({
                          action: "confirm",
                          orders,
                          totalAmount,
                          customerId,
                        }),
                      },
                    },
                    {
                      type: "button",
                      style: "secondary",
                      action: {
                        type: "postback",
                        label: "Cancel",
                        data: JSON.stringify({ action: "cancel", customerId }),
                      },
                    },
                  ],
                },
              },
            };

            await client.replyMessage(event.replyToken, confirmMessage);
          }
        );

        if (customerText.toLowerCase() === "แก้ไข") {
          // 🔍 ดึง Order ล่าสุดที่สถานะเป็น "Preparing"
          const [pendingOrder] = await db.query(
            "SELECT Order_id FROM `Order` WHERE Customer_id = ? AND Status = 'Preparing' ORDER BY Order_id DESC LIMIT 1",
            [customerId]
          );

          if (pendingOrder.length > 0) {
            await client.replyMessage(event.replyToken, {
              type: "text",
              text: "📍 กรุณาพิมพ์ที่อยู่ใหม่ของคุณเพื่อใช้ในการจัดส่ง",
            });

            // ✅ เก็บ Order_id ไว้เพื่อติดตามออเดอร์ที่ต้องแก้ไข
            pendingOrders[customerId] = pendingOrder[0].Order_id;
          } else {
            await client.replyMessage(event.replyToken, {
              type: "text",
              text: "⛔ คุณไม่มีออเดอร์ที่สามารถแก้ไขที่อยู่ได้",
            });
          }
        }

        // ✅ เมื่อลูกค้าพิมพ์ที่อยู่ใหม่ (หลังจากพิมพ์ "แก้ไข")
        else if (pendingOrders[customerId]) {
          let orderId = pendingOrders[customerId];

          // 🔄 อัปเดตที่อยู่ในฐานข้อมูล
          await db.query(
            "UPDATE `Order` SET Customer_Address = ? WHERE Order_id = ?",
            [customerText, orderId]
          );

          // 🚀 แจ้งให้ลูกค้าทราบว่าที่อยู่ถูกอัปเดตแล้ว
          await client.replyMessage(event.replyToken, {
            type: "text",
            text: `🏠ที่อยู่ของคุณได้รับการอัปเดตเป็น:\n${customerText}`,
          });

          await client.pushMessage(customerId, {
            type: "text",
            text: `📦 ที่อยู่ของคุณถูกอัปเดตเรียบร้อย!\nร้านค้ากำลังทำรายการสั่งซื้อ\nหากต้องการแก้ไขที่อยู่ พิมพ์ "แก้ไข"`,
          });

          delete pendingOrders[customerId];
        }
      } catch (error) {
        console.error("❌ Error handling order request:", error);
      }
    } else if (event.type === "message" && event.message.type === "image") {
      const imageId = event.message.id;

      // console.log("🖼️ Image ID ที่ส่งไปโหลด:", imageId);
      if (!imageId) {
        console.error("❌ Image ID เป็นค่าว่าง! ตรวจสอบการดึงค่าจาก LINE API");
        return;
      }

      const [latestOrder] = await db.query(
        "SELECT Order_id FROM `Order` WHERE Customer_id = ? ORDER BY Order_id DESC LIMIT 1",
        [event.source.userId]
      );

      if (latestOrder.length === 0) {
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "⛔ ไม่พบคำสั่งซื้อของคุณ",
        });
      }

      const orderId = latestOrder[0].Order_id;
      const userId = event.source.userId;

      const resultMessage = await verifySlip(imageId, orderId, userId);

      await client.replyMessage(event.replyToken, {
        type: "text",
        text: resultMessage,
      });
    } else if (event.type === "postback") {

      let data;
      try {
        data = JSON.parse(event.postback.data);
      } catch (error) {
        console.error("❌ JSON Parse Error in postback:", error);
        return;
      }

      if (data.action === "confirm") {
        try {
          const stockCheckMsg = await checkStockBeforeDeduct(data.orders);
          if (stockCheckMsg) {
            await client.replyMessage(event.replyToken, {
              type: "text",
              text: stockCheckMsg,
            });
            return; // ❌ ถ้าสต็อกไม่พอ หยุดเลย ไม่สร้าง Order
          }

          const [orderResult] = await db.query(
            "INSERT INTO `Order` (Customer_id, Total_amount, Customer_Address, Status) VALUES (?, ?, ?, 'Preparing')",
            [data.customerId, data.totalAmount, "ที่อยู่ลูกค้า (อัปเดตทีหลัง)"]
          );
          const orderId = orderResult.insertId;
          console.log(`✅ Order ID ที่สร้าง: ${orderId}`);

          for (let order of data.orders) {
            const [rows] = await db.query(
              "SELECT Price FROM Product WHERE Product_id = ?",
              [order.product_id]
            );

            if (!rows.length || !rows[0].Price) continue;
            let price = parseFloat(rows[0].Price);
            let subtotal = price * order.quantity;

            console.log(
              `📝 กำลังบันทึก Order_item: Order_id=${orderId}, Product_id=${order.product_id}, Quantity=${order.quantity}, Subtotal=${subtotal}`
            );

            await db.query(
              "INSERT INTO Order_item (Order_id, Product_id, Quantity, Subtotal, Status) VALUES (?, ?, ?, ?, 'Preparing')",
              [orderId, order.product_id, order.quantity, subtotal]
            );
            // await deductIngredientsBulk(data.orders);
            await deductIngredients(order.product_id, order.quantity);
          }

          await client.replyMessage(event.replyToken, {
            type: "text",
            text: "กรุณาพิมพ์ที่อยู่ของคุณเพื่อใช้ในการจัดส่ง",
          });

          // console.log("Reply Token:", event.replyToken);

          // await client.pushMessage(data.customerId, {type: "text", text: "✅ คำสั่งซื้อของคุณถูกบันทึกเรียบร้อย!",});

          pendingOrders[data.customerId] = orderId;
        } catch (error) {
          console.error("❌ Error saving order:", error);
          await client.replyMessage(event.replyToken, {
            type: "text",
            text: "เกิดข้อผิดพลาด กรุณาลองใหม่",
          });
        }
      } else if (data.action === "cancel") {
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: "❌ คำสั่งซื้อถูกยกเลิก",
        });
      } else if (data.action === "payment") {
        let paymentText = data.method === "cash" ? "💵 เงินสด" : "💳 โอนเงิน";

        const [order] = await db.query(
          "SELECT Total_amount FROM `Order` WHERE Order_id = ?",
          [data.orderId]
        );

        const amount = order[0].Total_amount;
        await db.query(
          "INSERT INTO `Payment` (Order_id, Amount, Payment_method, Payment_date, status) VALUES (?, ?, ?, NOW(), 'Pending') " +
            "ON DUPLICATE KEY UPDATE Payment_method = VALUES(Payment_method), status = 'Pending'",
          [data.orderId, amount, data.method]
        );

        if (data.method === "transfer") {
          const accountDetails =
            `🏦 รายละเอียดบัญชีสำหรับโอนเงิน:\n\n` +
            `ธนาคาร: กสิกรไทย (KBank)\n` +
            `ชื่อบัญชี: ฟ้าใส แต้มฤทธิ์\n` +
            `เลขที่บัญชี: 0883468120\n\n` +
            `💰 ยอดที่ต้องชำระ: ${amount} บาท\n\n` +
            `📌 กรุณาโอนเงินและส่งสลิปยืนยันการชำระเงิน`;

          await client.replyMessage(event.replyToken, {
            type: "text",
            text: accountDetails,
          });
        } else if (data.method === "cash") {
          const cashResult = await CashPayment(data.orderId, data.customerId);
          await client.replyMessage(event.replyToken, {
            type: "text",
            text: cashResult,
          });
        } else {
          await client.replyMessage(event.replyToken, {
            type: "text",
            text: `✅ คุณเลือกชำระเงินด้วย: ${paymentText}`,
          });
        }
      }
    }
  }

  res.sendStatus(200);
});

// const downloadImage = async (imageId) => {
//   const url = `https://api-data.line.me/v2/bot/message/${imageId}/content`;
//   const headers = { Authorization: `Bearer ${config.channelAccessToken}` };

//   try {
//     console.log("📥 Downloading image from:", url);
//     // console.log("📥 Sending request with headers:", headers);
//     const response = await axios.get(url, {
//       headers,
//       responseType: "arraybuffer",
//     });

//     const tmpDir = path.join(__dirname, "tmp");
//     if (!fs.existsSync(tmpDir)) {
//       fs.mkdirSync(tmpDir, { recursive: true });
//     }

//     const imagePath = path.join(tmpDir, `slip-${imageId}.jpg`);
//     fs.writeFileSync(imagePath, response.data);

//     return imagePath;
//   } catch (error) {
//     console.error(
//       "❌ Error downloading image:",
//       error.response ? error.response.data.toString() : error.message
//     );
//     return null;
//   }
// };

// ฟังก์ชันตรวจสอบสลิป
// const verifySlip = async (imageId, orderId, customerId) => {
//   try {
//     const imagePath = await downloadImage(imageId);
//     if (!imagePath) {
//       return "❌ ไม่สามารถดาวน์โหลดรูปภาพได้ กรุณาส่งใหม่";
//     }

//     const result = await cloudinary.uploader.upload(imagePath, {
//       folder: "slips",
//     });
//     const imageUrl = result.secure_url;
//     console.log("✅ URL ที่ได้จาก Cloudinary:", imageUrl);

//     // ✅ 1. ดึงยอดที่ต้องจ่ายจาก DB
//     const [orderRows] = await db.query(
//       "SELECT Total_amount FROM `Order` WHERE Order_id = ?",
//       [orderId]
//     );
//     const amount = orderRows.length ? orderRows[0].Total_amount : 0;

//     const FormData = require("form-data");
//     const formData = new FormData();
//     formData.append("files", fs.createReadStream(imagePath));
//     formData.append("log", "true");
//     formData.append("amount", amount);

//     const SLIPOK_BRANCH_ID = "40471";
//     const SLIPOK_API_KEY = "SLIPOKMNB83WS";

//     const response = await axios.post(
//       `https://api.slipok.com/api/line/apikey/${SLIPOK_BRANCH_ID}`,
//       formData,
//       {
//         headers: {
//           "x-authorization": SLIPOK_API_KEY,
//           ...formData.getHeaders(),
//         },
//       }
//     );

//     const { data } = response.data;

//     fs.unlinkSync(imagePath);
//     console.log("✅ SlipOK Response:", response.data);

//     if (data?.success) {
//       await db.query(
//         "UPDATE Payment SET status = 'Confirmed' WHERE Order_id = ?",
//         [orderId]
//       );

//       // ✅ อัปเดตสถานะออเดอร์เป็น Completed
//       await db.query(
//         "UPDATE `Order` SET status = 'Completed' WHERE Order_id = ?",
//         [orderId]
//       );

//       return "✅ สลิปถูกต้องและได้รับการยืนยัน";
//     } else {
//       return "❌ สลิปไม่ถูกต้อง กรุณาส่งใหม่";
//     }
//   } catch (error) {
//     const errData = error?.response?.data;
//     console.error("raw error object:", error);
//     console.error("error.response:", error.response);
//     console.error("error.response.data:", errData);

//     if (errData?.code) {
//       switch (errData.code) {
//         case 1010:
//           return "⚠️ กรุณารอสักครู่ สลิปจากธนาคารต้องรอประมาณ 5 นาที";
//         case 1012:
//           // ✅ ตรงนี้! ดึง timestamp จาก message
//           const timestamp = errData.message?.split("เมื่อ")[1]?.trim();
//           return `❗ สลิปซ้ำ: เคยส่งเมื่อ ${timestamp || "ก่อนหน้านี้"}`;
//         case 1013:
//           return "❌ ยอดเงินไม่ตรงกับสลิป กรุณาตรวจสอบอีกครั้ง";
//         case 1014:
//           return "❌ บัญชีผู้รับไม่ตรงกับร้านค้า";
//         default:
//           return `❌ ตรวจสอบไม่ผ่าน (code: ${errData.code})`;
//       }
//     }

//     return "❌ มีข้อผิดพลาดในการตรวจสอบสลิป";
//   }
// };

(async () => {
  try {
    const [rows] = await db.query("SHOW TABLES;");
    console.log("Connected to Database. Tables:", rows);
  } catch (err) {
    console.error("Database connection error:", err);
  }
})();

// cron.schedule(
//   "0 */8 * * *",
//   async () => {
//     console.log("กำลังส่งเมนูสินค้าไปยังลูกค้า...");
//     try {
//       await sendMenuToLine(); // เรียกใช้ฟังก์ชันส่งเมนู
//     } catch (error) {
//       console.error("Error sending menu:", error);
//     }
//   },
//   {
//     scheduled: true,
//     timezone: "Asia/Bangkok", // ตั้งค่าเป็นเวลาประเทศไทย
//   }
// );

const PORT = 8000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server is running on port 8000");
});
