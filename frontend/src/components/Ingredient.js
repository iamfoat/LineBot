import React, { useState, useEffect } from "react";
import "../css/Ingredient.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Ingredient = () => {
  const [data, setData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [ingredients, setIngredients] = useState([
    { name: "", quantity: "", price: "", threshold: "" },
  ]);
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);
  const [ocrItems, setOcrItems] = useState([]);
  const [receiptImage, setReceiptImage] = useState("");

  useEffect(() => {
    LoadData();
  }, []);

  const LoadData = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/ingredients");
      console.log("📦 Data from API:", res.data); // ✅ Debugging
      setData(res.data); // ✅ อัปเดต state
    } catch (err) {
      console.error("❌ Error fetching ingredients:", err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }); // 🇹🇭 ใช้โซนเวลาไทย
  };

  const handleIngredientClick = (ingredientName) => {
    navigate(`/ingredientitems/${ingredientName}`); // ✅ ใช้ชื่อวัตถุดิบแทน ID
  };

  const handleInputChange = (index, e) => {
    const { name, value } = e.target;
    const newIngredients = [...ingredients];
    newIngredients[index][name] = value;
    setIngredients(newIngredients);
  };

  const handleAddRow = () => {
    setIngredients([
      ...ingredients,
      { name: "", quantity: "", price: "", threshold: "" },
    ]);
  };

  const handleRemoveRow = (index) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  const handleAddIngredients = async () => {
    const today = new Date();
    today.setDate(today.getDate() + 5); // ✅ บวกไป 5 วัน
    const defaultExpiryDate = today.toISOString().split("T")[0]; // แปลงเป็น YYYY-MM-DD

    // ✅ ตั้งค่า Expiry_date อัตโนมัติถ้าไม่ได้กรอก
    const updatedIngredients = ingredients.map((ing) => ({
      ...ing,
      expiry_date: ing.expiry_date || defaultExpiryDate,
    }));

    console.log("📦 Sending Ingredients Data:", updatedIngredients);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/ingredients/bulk",
        { ingredients: updatedIngredients },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("✅ Added Ingredients:", response.data);
      setShowForm(false);
      setIngredients([
        { name: "", quantity: "", price: "", threshold: "", expiry_date: "" },
      ]);
      LoadData();
    } catch (error) {
      console.error(
        "❌ Error adding ingredients:",
        error.response ? error.response.data : error
      );
    }
  };

  const handleAnalyzeOCR = async () => {
    if (!imageFile) return alert("กรุณาเลือกรูปใบเสร็จ");

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const res = await axios.post(
        "http://localhost:8000/api/upload-ocr",
        formData
      );
      if (res.data.items && res.data.items.length > 0) {
        setOcrItems(res.data.items);
        setReceiptImage(res.data.receipt_img); // แสดงรูปได้ถ้าต้องการ
      } else {
        alert("📭 ไม่พบรายการในภาพใบเสร็จ");
      }
      // 🔥 ทดลองใช้ regex / split text → สร้าง ingredients อัตโนมัติ
      // หรือให้ user copy paste เอง
    } catch (err) {
      console.error("❌ OCR error:", err);
      alert("❌ วิเคราะห์สลิปไม่สำเร็จ");
    }
  };

  const handleConfirmOCR = async () => {
    try {
      await axios.post("http://localhost:8000/api/confirm-ocr", {
        items: ocrItems,
        receipt_img: receiptImage,
      });
      alert("✅ เพิ่มรายการเรียบร้อยแล้ว");
      setOcrItems([]);
      setReceiptImage("");
      setShowForm(false);
      LoadData();
    } catch (err) {
      console.error("❌ Error confirming OCR:", err);
      alert("❌ ไม่สามารถบันทึกรายการได้");
    }
  };

  return (
    <div className="containerIngredient">
      <div className="header-container ">
        <h1 className="header">Ingredient</h1>
      </div>

      <div className="sidebar">
        <ul>
          <li>
            <a
              href="#"
              style={{
                width: "100%",
                boxSizing: "border-box",
                paddingLeft: "15px",
              }}
            >
              Menu
            </a>
            <ul>
              <li>
                <a href="/">Home Page</a>
              </li>
              <li>
                <a href="/orders">Order</a>
              </li>
              <li>
                <a href="/products">Product</a>
              </li>
              <li>
                <a href="/Ingredients">Ingredient</a>
              </li>
              <li>
                <a href="/dashboard">Dashboard</a>
              </li>
            </ul>
          </li>
        </ul>
        <div className="contentIngredient">
          <table className="ingredient-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th></th>
                <th>Qty</th>
                <th>Update_at</th>

                <th>⚠️</th>
                <th>🔍</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.Ingredient_id}>
                  <td>{item.Ingredient_id}</td>
                  <td>{item.Ingredient_name}</td>
                  <td
                    className={
                      item.Total_Quantity <= item.Low_stock_threshold
                        ? "low-stock"
                        : ""
                    }
                  ></td>

                  <td>{item.Total_Quantity}</td>

                  <td>{formatDate(item.Updated_at)}</td>
                  <td>
                    {item.Total_Quantity <= item.Low_stock_threshold ? (
                      <span className="warning-text">⚠️ Low Stock</span>
                    ) : (
                      "✔️ OK"
                    )}
                  </td>

                  <td>
                    <button
                      className="view-btn"
                      onClick={() =>
                        handleIngredientClick(item.Ingredient_name)
                      }
                    >
                      🔍
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button className="add-btn" onClick={() => setShowForm(true)}>
        +
      </button>
      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Multiple Ingredients</h2>

            {ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-row">
                <input
                  type="text"
                  name="name"
                  placeholder="Ingredient Name"
                  value={ingredient.name}
                  onChange={(e) => handleInputChange(index, e)}
                />
                <input
                  type="number"
                  name="quantity"
                  placeholder="Quantity"
                  value={ingredient.quantity}
                  onChange={(e) => handleInputChange(index, e)}
                />
                <input
                  type="number"
                  name="price"
                  placeholder="Total Purchase Price (บาท)"
                  value={ingredient.price}
                  onChange={(e) => handleInputChange(index, e)}
                />
                <input
                  type="number"
                  name="threshold"
                  placeholder="threshold"
                  value={ingredient.threshold}
                  onChange={(e) => handleInputChange(index, e)}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
                <button onClick={handleAnalyzeOCR}>Upload</button>

                {ocrItems.length > 0 && (
                  <div
                    className="ocr-preview"
                    style={{
                      maxHeight: "300px", // หรือ 50vh
                      overflowY: "auto",
                      marginTop: "1rem",
                      border: "1px solid #ccc",
                      padding: "0.5rem",
                      borderRadius: "8px",
                      background: "#fff",
                    }}
                  >
                    <h3>📋 รายการที่พบจากใบเสร็จ:</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>ชื่อวัตถุดิบ</th>
                          <th>จำนวน</th>
                          <th>ราคา</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ocrItems.map((item, index) => (
                          <tr key={index}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>{item.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button onClick={handleConfirmOCR}>✅</button>
                  </div>
                )}

                {/* <button
                  className="remove-btn"
                  onClick={() => handleRemoveRow(index)}
                >
                  ❌
                </button> */}
              </div>
            ))}

            {/* <button className="add-row-btn" onClick={handleAddRow}>
              More
            </button>
            <button className="submit-btn" onClick={handleAddIngredients}>
              Submit
            </button>
            <button className="cancel-btn" onClick={() => setShowForm(false)}>
              Cancel
            </button> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Ingredient;
