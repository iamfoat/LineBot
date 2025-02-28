import React, { useState, useEffect } from "react";
import axios from 'axios';
import "../css/OrderItem.css";
import { FaCheck, FaArrowLeft } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";

const OrderItem = () => {
    const { orderId } = useParams();
    console.log("🔄 useParams() received orderId:", orderId);
    const navigate = useNavigate();
    const [orderDetails, setOrderDetails] = useState([]);
    const [checkedItems, setCheckedItems] = useState({});
    const [orderStatus, setOrderStatus] = useState("Preparing");

    useEffect(() => {
        console.log("🔄 Order ID from URL:", orderId);
        LoadData();
    }, [orderId]);
    

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

            // ✅ โหลดค่าที่ติ๊กไว้จากฐานข้อมูล
            const initialCheckedState = {};
            res.data.forEach((item) => {
                initialCheckedState[item.Order_item_id] = item.status === "Checked";
            });
            setCheckedItems(initialCheckedState);

            // ✅ ตรวจสอบสถานะออเดอร์จาก API
            if (res.data.length > 0) {
                setOrderStatus(res.data[0].Order_status);
            }

        } catch (err) {
            console.error("Error fetching order details:", err);
        }
    };

    // ✅ ฟังก์ชันอัปเดตสถานะ Checkbox และบันทึกลงฐานข้อมูล
    const toggleCheck = async (orderItemId) => {
        const newCheckedState = !checkedItems[orderItemId];

        // ✅ อัปเดตสถานะใน state
        setCheckedItems((prev) => ({
            ...prev,
            [orderItemId]: newCheckedState,
        }));

        try {
            // ✅ อัปเดตสถานะของรายการสินค้าในฐานข้อมูล
            await axios.put(`http://localhost:8000/api/orderitems/${orderItemId}/status`, {
                status: newCheckedState ? "Checked" : "Unchecked",
            });
            console.log(`✅ Order item ${orderItemId} updated to ${newCheckedState ? "Checked" : "Unchecked"}`);
        } catch (err) {
            console.error("❌ Error updating item status:", err);
        }

        // ✅ ตรวจสอบว่าทุกช่องถูกติ๊กหมดหรือไม่
        const allChecked = Object.values({ ...checkedItems, [orderItemId]: newCheckedState }).every(value => value === true);
        if (allChecked) {
            updateOrderStatus("Out for Delivery");
        } else {
            updateOrderStatus("Preparing");
        }
    };

    // ✅ ฟังก์ชันอัปเดตสถานะ Order ไปที่ Backend
    const updateOrderStatus = async (newStatus) => {
        if (!orderId) {
            console.error("❌ Order ID is undefined! API call aborted.");
            return;
        }
    
        try {
            console.log(`🔄 Updating order status for Order ID: ${orderId} to ${newStatus}`);
    
            await axios.put(`http://localhost:8000/api/orders/${orderId}/status`, { status: newStatus });
    
            setOrderStatus(newStatus);
            console.log(`✅ Order status updated to ${newStatus}`);
        } catch (err) {
            console.error("❌ Error updating order status:", err);
        }
    };
    

    return (
        <div className="containerorder">
            <div className="header-container">
                <FaArrowLeft className="back-button" onClick={() => navigate(-1)} />
                <h1 className="header">Order item</h1>
            </div>

            <div className="contentOrderItem">
                <div className="order-group">
                    <h2>Order #{orderId} - Status: {orderStatus}</h2>
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
                                orderDetails.map((item) => (
                                    <tr key={item.Order_item_id}>
                                        <td>{item.Product_name}</td>
                                        <td>{item.Price}</td>
                                        <td>{item.Quantity}</td>
                                        <td>{item.Subtotal}</td>
                                        <td className="checkbox-container">
                                            <div
                                                className={`checkbox ${checkedItems[item.Order_item_id] ? "checked" : ""}`}
                                                onClick={() => toggleCheck(item.Order_item_id)}
                                            >
                                                {checkedItems[item.Order_item_id] && <FaCheck color="white" />}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center" }}>No items found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div style={{ textAlign: "right", marginTop: "10px", fontSize: "18px", fontWeight: "bold" }}>
                        Order Total: {orderDetails.reduce((sum, item) => sum + item.Subtotal, 0)} บาท
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderItem;
