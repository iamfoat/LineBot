import React, { useState, useEffect } from "react";
import "../css/Product.css"; 
import axios from 'axios';
import { FaEdit, FaTrash } from "react-icons/fa";


const ManageProduct = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", image: "" ,description: ""});
  const [data, setData] = useState([]); 
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  

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
  formData.append("productName", newProduct.name);  //ชื่อ key ต้องตรงกับ API
  formData.append("price", newProduct.price);
  formData.append("description", newProduct.description);
  formData.append("productImg", newProduct.image);

  axios.post("http://localhost:8000/api/products", formData, {  //ส่งข้อมูลไปยัง API
    headers: { "Content-Type": "multipart/form-data" },
})
.then((response) => {  //ส่งข้อมูลสำเร็จ then จะทำงาน
    console.log("Response Data:", response.data);

    if (response.data && response.data.product) {  //เช็คว่า API ส่งข้อมูลกลับมาถูกต้อง
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
  try {
      const res = await axios.get('http://localhost:8000/api/products');
      setData(res.data);  //update state
  } catch (err) {
      console.error("Error fetching products:", err);
  }
};

const handleEditProduct = (product) => { //คอลัมน์แรกคือชื่อที่ใช้ใน react
  setEditProduct({
    id: product.Product_id, // ใช้ id จากฐานข้อมูล
    name: product.Product_name, 
    price: product.Price, 
    description: product.Description,
    image: product.Product_img, // เก็บภาพเดิม
    newImage: null 
  });
};


const handleSaveEdit = async () => {
  try {
    const formData = new FormData();
    formData.append("productName", editProduct.name);
    formData.append("price", editProduct.price);
    formData.append("description", editProduct.description);
    
    if (editProduct.newImage) {
      formData.append("productImg", editProduct.newImage); // ถ้ามีรูปใหม่ให้ส่งไป
    }

    await axios.put(`http://localhost:8000/api/products/${editProduct.id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    alert("Product updated successfully!");
    setEditProduct(null); // ปิดฟอร์ม
    await LoadData(); // โหลดข้อมูลใหม่
  } catch (error) {
    console.error("Error updating product:", error);
  }
};

const handleDeleteProduct = async (id) => {
  if (window.confirm("You want to delete?")) {
    try {
      await axios.delete(`http://localhost:8000/api/products/${id}`);
      alert("ลบสินค้าสำเร็จ!");
      await LoadData(); // โหลดข้อมูลใหม่
    } catch (error) {
      console.error("Error deleting product:", error);
    }
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
              <li><a href="/orders">Order</a></li>
              <li><a href="#">Product</a></li>
              <li><a href="#">Ingredient</a></li>
              <li><a href="#">Dashboard</a></li>
            </ul>
            </li>
          </ul>

          <div className="content">
        <div className="product-grid">
          {data.map((product, index) => (

            <div key={index} className="product"
            onMouseEnter={() => setHoveredProduct(index)} // เมื่อเมาส์เลื่อนเข้า
            onMouseLeave={() => setHoveredProduct(null)} // เมื่อเมาส์ออก
            onTouchStart={() => setHoveredProduct(index)} // เมื่อแตะที่สินค้า
            >

              <img src={`http://localhost:8000/uploads/${product.Product_img}`} alt={product.Product_name} />
              <p>{product.Product_name}</p>
              <p>{product.Price} บาท</p>
              <p>{product.Description}</p>

              {hoveredProduct === index && (
              <div className="edit-icon">
                <FaEdit onClick={() => handleEditProduct(product)} />
                <FaTrash onClick={() => handleDeleteProduct(product.Product_id)} style={{ color: "red", marginLeft: "10px" }} />
              </div>
            )}

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
    {editProduct && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit Product</h2>
            <input
            type="text"
            value={editProduct.name}
            onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
            />
            <input
            type="number"
            value={editProduct.price}
            onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
            />
            <input
            type="text"
            value={editProduct.description}
            onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
            />
            <input
            type="file"
            accept="image/*"
            onChange={(e) => setEditProduct({ ...editProduct, newImage: e.target.files[0] })}
            />

            <button onClick={handleSaveEdit}>Save</button>
            <button onClick={() => setEditProduct(null)}>Cancel</button>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ManageProduct;
