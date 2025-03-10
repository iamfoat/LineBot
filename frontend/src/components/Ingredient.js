import React, { useState, useEffect } from "react";
import "../css/Ingredient.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Ingredient = () => {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    LoadData();
  }, []);

  const LoadData = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/ingredients");
      setData(res.data); //update state
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }); // 🇹🇭 ใช้โซนเวลาไทย
  };

  const handleIngredientClick = (ingredientName) => {
    navigate(`/ingredientitems/${ingredientName}`); // ✅ ใช้ชื่อวัตถุดิบแทน ID
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
                <a href="#">Dashboard</a>
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
                <th>Qty</th>
                <th>Update_at</th>
                <th>🔍</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.Ingredient_id}>
                  <td>{item.Ingredient_id}</td>
                  <td>{item.Ingredient_name}</td>
                  <td>{item.Quantity}</td>
                  <td>{formatDate(item.Updated_at)}</td>

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
    </div>
  );
};

export default Ingredient;
