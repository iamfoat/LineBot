import React, { useState, useEffect } from "react";
import "../css/Order.css"
import axios from 'axios';

const ManageOrder = () => {
  const [data, setData] = useState([]); 
  

useEffect(() => {
  LoadData()
}, []);

const LoadData = async () => {
  try {
      const res = await axios.get('http://localhost:8000/api/orders');
      setData(res.data);  //update state
  } catch (err) {
      console.error("Error fetching products:", err);
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }); // 🇹🇭 ใช้โซนเวลาไทย
};

const getStatusIcon = (status) => {
  switch (status) {
    case "Preparing":
      return "🍽️"; // ไอคอนอาหารกำลังเตรียม
    case "Cooking":
      return "👨‍🍳"; // ไอคอนทำอาหาร
    case "Completed":
      return "✅"; // ไอคอนเสร็จสิ้น
    default:
      return "📋"; // ไอคอนทั่วไป
  }
};

  return (
    <div className="containerorder">
      <div className="header-container">
        <h1 className="header">Order</h1>
      </div>

      <div className="sidebar"> 
      <ul>
            <li><a href="#" style={{ width: "100%", boxSizing: "border-box", paddingLeft: "15px" }}>Menu</a> 
            <ul>
            <li><a href="/">Home Page</a></li>
              <li><a href="/orders">Order</a></li>
              <li><a href="/products">Product</a></li>
              <li><a href="/Ingredients">Ingredient</a></li>
              <li><a href="#">Dashboard</a></li>
            </ul>
            </li>
          </ul>
      
      <div className="contentOrder">
      <div className="order-grid">
                {data.map((order, index) => (
      
                  <div key={order.Order_id} className="order-card"
                  // onMouseEnter={() => setHoveredProduct(index)} // เมื่อเมาส์เลื่อนเข้า
                  // onMouseLeave={() => setHoveredProduct(null)} // เมื่อเมาส์ออก
                  // onTouchStart={() => setHoveredProduct(index)} // เมื่อแตะที่สินค้า
                  >
      
                    {/* <img src={`https://a2ca-171-6-142-15.ngrok-free.app/uploads/${product.Product_img}`} alt={product.Product_name} /> */}
                    <div className="order-left">
                      <p><strong>Order Id:</strong> {order.Order_id}</p>
                      <p><strong>Customer Name:</strong> {order.Customer_Name || "ไม่พบชื่อ"}</p>
                      <p><strong>Shipping Address:</strong> {order.Customer_Address}</p>
                      <p><strong>Amount:</strong> {order.Total_amount} บาท</p>
                      <p><strong>Create at:</strong> {formatDate(order.created_at)}</p>
                     </div>
                    <div className="order-right">
                      <p className="status-text"><strong>Status</strong></p>
                      <span className="status-icon">{getStatusIcon(order.Status)}</span>
                    </div>

      
                    {/* {hoveredProduct === index && (
                    <div className="edit-icon">
                      <FaEdit onClick={() => handleEditProduct(product)} />
                      <FaTrash onClick={() => handleDeleteProduct(product.Product_id)} style={{ color: "red", marginLeft: "10px" }} />
                    </div>
                  )} */}
      
                  </div>
                ))}
                </div>
              </div>
              </div>
    </div>
  )
}

export default ManageOrder;