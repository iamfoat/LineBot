import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/IngredientItem.css";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const IngredientItem = () => {
  const { ingredientName } = useParams(); // ดึงค่า ingredientName จาก URL
  const [ingredientDetails, setIngredientDetails] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    LoadData();
  }, [ingredientName]);

  const LoadData = async () => {
    if (!ingredientName) {
      console.error("Ingredient ID is undefined!");
      return;
    }

    // try {
    //     const res = await axios.get(`http://localhost:8000/api/ingredientitems/${ingredientName}`);
    //     // 🔥 เรียงจากใหม่ -> เก่า ตาม Create_at (ถ้ามี)
    //     const sortedData = res.data.sort((a, b) => new Date(b.Create_at) - new Date(a.Create_at));
    //     setIngredientDetails(sortedData);

    //     const initialCheckedState = {};
    //     sortedData.forEach((item) => {
    //         initialCheckedState[item.Batch_code] = item.Quantity === 0;
    //     });

    try {
      const availableStock = await axios.get(
        `http://localhost:8000/api/ingredientitems/${ingredientName}/available`
      );
      setIngredientDetails(availableStock.data);

      const historyStock = await axios.get(
        `http://localhost:8000/api/ingredientitems/${ingredientName}/history`
      );
      setStockHistory(historyStock.data);
    } catch (err) {
      console.error("Error fetching ingredient details:", err);
    }
  };

  return (
    <div className="containerIngredient">
      <div className="header-container">
        <FaArrowLeft className="back-button" onClick={() => navigate(-1)} />
        <h1 className="header">Ingredient Item</h1>
      </div>

      <div className="contentIngredientItem">
        <div className="ingredient-group">
          <h2>Ingredient: {ingredientName} - Stock Details</h2>
          <table className="ingredientitem-table">
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Quantity</th>
                <th>Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {ingredientDetails.length > 0 ? (
                ingredientDetails.map((item) => (
                  <tr key={item.Ingredient_id}>
                    <td>{item.Batch_code}</td>
                    <td>{item.Quantity}</td>
                    <td>
                      {new Date(item.Expiry_date).toLocaleDateString("th-TH")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IngredientItem;
