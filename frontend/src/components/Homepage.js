import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/Homepage.css"

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="homepage-container">
            <header className="homepage-header">
                <h1>Store Management</h1>
            </header>

            <div className="menu-container">
                <button className="menu-btn" onClick={() => navigate("/orders")}>🛒 Order</button>
                <button className="menu-btn" onClick={() => navigate("/products")}>📦 Product</button>
                <button className="menu-btn" onClick={() => navigate("/ingredients")}>🥦 Ingredient</button>
                <button className="menu-btn" onClick={() => navigate("/dashboard")}>📊 Dashboard</button>
            </div>
        </div>
    );
};

export default HomePage;
