import React, { useState, useEffect } from "react";
import "../css/Ingredient.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Ingredient = () => {
  const [data, setData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newIngredient, setNewIngredient] = useState({ name: "", quantity: "", threshold: "" });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewIngredient({ ...newIngredient, [name]: value });
  };

  const handleAddIngredient = async () => {
    try {
      const response = await axios.post("http://localhost:8000/api/ingredients", {
        Ingredient_name: newIngredient.name,
        Quantity: parseInt(newIngredient.quantity, 10), // ✅ บังคับให้เป็นตัวเลข
        Low_stock_threshold: parseInt(newIngredient.threshold, 10) || 0,
      });
  
      console.log("✅ Added Ingredient:", response.data);
      setShowForm(false);
      setNewIngredient({ name: "", quantity: "", threshold: "" });
      LoadData();
    } catch (error) {
      console.error("❌ Error adding ingredient:", error.response ? error.response.data : error);
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
                    className={item.Quantity <= item.Low_stock_threshold ? "low-stock" : ""}
                  ></td>
                  <td>{item.Quantity}</td>
                  <td>{formatDate(item.Updated_at)}</td>
                  <td>
                    {item.Quantity <= item.Low_stock_threshold ? (
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

      <button className="add-btn" onClick={() => setShowForm(true)}>+</button>
      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Ingredient</h2>
            <input type="text" name="name" placeholder="Ingredient Name" value={newIngredient.name} onChange={handleInputChange} />
            <input type="number" name="quantity" placeholder="Initial Quantity" value={newIngredient.quantity} onChange={handleInputChange} />
            <input type="number" name="threshold" placeholder="Low Stock Threshold" value={newIngredient.threshold} onChange={handleInputChange} />
            <button onClick={handleAddIngredient}>Add</button>
            <button onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ingredient;
