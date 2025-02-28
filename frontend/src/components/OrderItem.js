import React, { useState, useEffect } from "react";
import axios from 'axios';
import "../css/OrderItem.css"
import { FaCheck,FaArrowLeft } from "react-icons/fa";
import { useParams,useNavigate  } from "react-router-dom";



const OrderItem = () => {
    const [data, setData] = useState({}); //เก็บเป็น object
    const [checkedItems, setCheckedItems] = useState({});
    const { orderId } = useParams();
    const [orderDetails, setOrderDetails] = useState([]);
    const navigate = useNavigate();
    // console.log("Order ID from URL:", orderId);
    

    useEffect(() => {
        LoadData()
    }, []);
      
    const LoadData = async () => {
        if (!orderId) {
          console.error("❌ Order ID is undefined! API call aborted.");
          return;
        }
      
        try {
          console.log(`Fetching order items for Order ID: ${orderId}`); 
          const res = await axios.get(`http://localhost:8000/api/orderitems/${orderId}`);
          console.log("API Response:", res.data);
          setOrderDetails(res.data);
        } catch (err) {
          console.error("Error fetching order details:", err);
        }
      };
      

      const toggleCheck = (index) => {
        setCheckedItems((prev) => ({
          ...prev,
          [index]: !prev[index],
        }));
      };

      


      return (
        <div className="containerorder">
            <div className="header-container">
                <FaArrowLeft className="back-button" onClick={() => navigate(-1)} />
                <h1 className="header">Order item</h1>
            </div>

            <div className="contentOrderItem">
                <div className="order-group">
                    <h2>Order #{orderId}</h2> 
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Price</th>
                                <th>Qty</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orderDetails.length > 0 ? (
                                orderDetails.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.Product_name}</td>
                                        <td>{item.Price}</td>
                                        <td>{item.Quantity}</td>
                                        <td>{item.Subtotal}</td>
                                        <td className="checkbox-container">
                                            <div
                                                className={`checkbox ${checkedItems[index] ? "checked" : ""}`}
                                                onClick={() => toggleCheck(index)}
                                            >
                                                {checkedItems[index] && <FaCheck color="white" />}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: "center" }}>No items found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* ✅ แสดงผลรวมที่ถูกต้อง */}
                    <div style={{ textAlign: "right", marginTop: "10px", fontSize: "18px", fontWeight: "bold" }}>
                        Order Total: {orderDetails.reduce((sum, item) => sum + item.Subtotal, 0)} บาท
                    </div>
                </div>
</div>

        </div>
    );
};

export default OrderItem