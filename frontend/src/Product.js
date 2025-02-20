import React from "react";
import "./Product.css"; // นำเข้าไฟล์ CSS

const products = [
  { name: "น้ำส้มปั่น", price: 35, image: "orange-juice.png" },
  { name: "น้ำแตงโมปั่น", price: 35, image: "watermelon-juice.png" },
  { name: "น้ำสตรอเบอรี่ปั่น", price: 50, image: "strawberry-juice.png" },
  { name: "น้ำมะม่วงปั่น", price: 40, image: "mango-juice.png" },
  { name: "น้ำกล้วยปั่น", price: 35, image: "banana-juice.png" }
];

const ManageProduct = () => {
  return (
    
    <div className="container">

      <div className="header-container ">
        <h1 className="header">Manage Product</h1>
      </div>

      <div className="sidebar">

          <ul>
            <li><a href="#" style={{ width: "100%", boxSizing: "border-box", paddingLeft: "15px" }}>&#9776;</a>
            <ul>
              <li><a href="#">Order</a></li>
              <li><a href="#">Product</a></li>
              <li><a href="#">Ingredient</a></li>
              <li><a href="#">Dashboard</a></li>
            </ul>
            </li>
          </ul>

          <div className="content">
        <div className="product-grid">
          {products.map((product, index) => (
            <div key={index} className="product">
              <img src={`/assets/${product.image}`} alt={product.name} />
              <p>{product.name}</p>
              <p>{product.price} บาท</p>
            </div>
          ))}
        </div>
      </div>
      </div>
      


      <button className="add-button">+</button>
    </div>
  );
};

export default ManageProduct;
