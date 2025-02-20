import React, { useState } from "react";
import "./Product.css"; 
// import axios from 'axios';

const Products = [
  { name: "น้ำส้มปั่น", price: 35, image: "orange-juice.png" },
  { name: "น้ำแตงโมปั่น", price: 35, image: "watermelon-juice.png" },
  { name: "น้ำสตรอเบอรี่ปั่น", price: 50, image: "strawberry-juice.png" },
  { name: "น้ำมะม่วงปั่น", price: 40, image: "mango-juice.png" },
  { name: "น้ำกล้วยปั่น", price: 35, image: "banana-juice.png" }
];

const ManageProduct = () => {
  const [products, setProducts] = useState(Products);
  const [showForm, setShowForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", image: "" ,description: ""});

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === "file") {
        const file = files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewProduct({ ...newProduct, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    } else {
        setNewProduct({ ...newProduct, [name]: value });
    }
};


const handleAddProduct = () => {
  if (newProduct.name && newProduct.price && newProduct.image) {
      setProducts([...products, newProduct]);
      setNewProduct({ name: "", price: "", image: "", description: "" });
      alert(`Add Product successful`);
      setShowForm(false);
  } else {
      alert("Please fill in all fields!");
  }
};


  return (
    
    <div className="container">

      <div className="header-container ">
        <h1 className="header">Product</h1>
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
              <img src={product.image} alt={product.name} />
              <p>{product.name}</p>
              <p>{product.price} บาท</p>
              <p>{product.description}</p>
            </div>
          ))}
        </div>
      </div>
      </div>
      


      <button className="add-button" onClick={() => setShowForm(true)}>+</button>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Product</h2>
            <input type="text" name="name" placeholder="Name" value={newProduct.name} onChange={handleInputChange}/>
            <input type="number" name="price" placeholder="Price" value={newProduct.price} onChange={handleInputChange}/>
            <input type="text" name="description" placeholder="description" value={newProduct.description} onChange={handleInputChange}/>
            <input type="file" accept="image/*" onChange={handleInputChange} />
            <button onClick={handleAddProduct}>Add</button>
            <button onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default ManageProduct;
