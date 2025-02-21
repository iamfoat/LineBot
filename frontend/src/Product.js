import React, { useState, useEffect } from "react";
import "./Product.css"; 
import axios from 'axios';


const ManageProduct = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", image: "" ,description: ""});
  const [data, setData] = useState([]); 

  useEffect(() => {
    LoadData()
    // axios.get("http://localhost:8000/api/products")
    //   .then((response) => {
        
    //     setProducts(response.data); // 📌 ตั้งค่า products จาก API
    //     console.log(response.data)
    //   })
    //   .catch((error) => {
    //     console.error("Error fetching products:", error);
    //   });
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === "file") {
        const file = files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setNewProduct({ ...newProduct, image: file });
            };
            reader.readAsDataURL(file);
        }
    } else {
        setNewProduct({ ...newProduct, [name]: value });
    }
};


const handleAddProduct = () => {
  if (!newProduct.name || !newProduct.price || !newProduct.image) {
      alert("Please fill in all fields!");
      return;
  }

  const formData = new FormData();
  formData.append("productName", newProduct.name);
  formData.append("price", newProduct.price);
  formData.append("description", newProduct.description);
  formData.append("productImg", newProduct.image);

  axios.post("http://localhost:8000/api/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
})
.then((response) => {
    console.log("Response Data:", response.data);

    if (response.data && response.data.product) {
        setProducts((prevProducts) => [...prevProducts, response.data.product]);
        setNewProduct({ name: "", price: "", image: "", description: "" });
        alert("Product added successfully!");
        setShowForm(false);
        LoadData();
    } else {
        console.error("Invalid response:", response.data);
    }
})
.catch((error) => {
    console.error("Error adding product:", error.response ? error.response.data : error);
});
};

const LoadData = async () => {
  await axios.get('http://localhost:8000/api/products') 
  .then((res) => setData(res.data))
  .catch((err) =>console.log(err))
  
}

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
          {data.map((product, index) => (
            <div key={index} className="product">
              <img src={`http://localhost:8000/uploads/${product.Product_img}`} alt={product.Product_name} />
              <p>{product.Product_name}</p>
              <p>{product.Price} บาท</p>
              <p>{product.Description}</p>
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
