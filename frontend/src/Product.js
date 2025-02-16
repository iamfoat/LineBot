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
      <aside className="sidebar">
        <nav>
          <ul>
            <li><a href="#">Order</a></li>
            <li><a href="#">Product</a></li>
            <li><a href="#">Ingredient</a></li>
            <li><a href="#">Dashboard</a></li>
          </ul>
        </nav>
      </aside>
      <main className="content">
        <h1>Manage Product</h1>
        <div className="product-grid">
          {products.map((product, index) => (
            <div key={index} className="product">
              <img src={`/assets/${product.image}`} alt={product.name} />
              <p>{product.name}</p>
              <p>{product.price} บาท</p>
            </div>
          ))}
        </div>
      </main>
      <button className="add-button">+</button>
    </div>
  );
};

export default ManageProduct;
