import React, { useState, useEffect } from "react";
import "../css/Order.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ManageOrder = () => {
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const [completedOrders, setCompletedOrders] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    LoadData();
  }, []);

  const LoadData = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/orders");
      setData(res.data.filter(order => order.Status !== "Completed")); //update state

      const completedRes = await axios.get(
        "http://localhost:8000/api/orders/completed"
      );
      setCompletedOrders(completedRes.data);
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
        return "🍽️";
      case "Out for Delivery":
        return "🛵";
      case "Completed":
        return "✅";
      default:
        return "📋";
    }
  };

  const handleOrderClick = (orderId) => {
    navigate(`/orderitems/${orderId}`);
  };

  return (
    <div className="containerorder">
      <div className="header-container">
        {/* <button onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? "📋 ดู Order ปัจจุบัน" : "📜 ดูประวัติ Order"}
        </button> */}
        <h1 className="header">Order</h1>
        <button 
  className="order-toggle-button" 
  onClick={() => setShowCompleted(!showCompleted)}
>
  {showCompleted ? "📋 ดู Order ปัจจุบัน" : "📜 ดูประวัติ Order"}
</button>
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

        <div className="contentOrder">
          
          <div className="order-grid">
          {(showCompleted ? completedOrders : data).map((order) => (
              <div
                key={order.Order_id}
                className="order-card"
                onClick={() => handleOrderClick(order.Order_id)}
              >
                {/* <img src={`https://a2ca-171-6-142-15.ngrok-free.app/uploads/${product.Product_img}`} alt={product.Product_name} /> */}
                <div className="order-left">
                  <p>
                    <strong>Order Id:</strong> {order.Order_id}
                  </p>
                  <p>
                    <strong>Customer Name:</strong>{" "}
                    {order.Customer_name || "ไม่พบชื่อ"}
                  </p>
                  <p>
                    <strong>Amount:</strong> {order.Total_amount} บาท
                  </p>
                  <p>
                    <strong>Create at:</strong> {formatDate(order.created_at)}
                  </p>
                </div>

                <div className="order-right">
                  <p className="status-text">
                    <strong>Status</strong>
                  </p>
                  <span className="status-icon">
                    {getStatusIcon(order.Status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageOrder;
