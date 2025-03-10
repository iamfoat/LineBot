import React, { useState, useEffect } from "react";
import "../css/Product.css"; 
import axios from 'axios';
import { FaEdit, FaTrash } from "react-icons/fa";
import Select from "react-select";




const ManageProduct = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", image: "" ,description: ""});
  const [data, setData] = useState([]); 
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [ingredients, setIngredients] = useState([]); 
  const [selectedIngredients, setSelectedIngredients] = useState([]); 
  

  useEffect(() => {
    LoadData();
    LoadIngredients();
  }, []);

  useEffect(() => {
    if (editProduct) {
        console.log("📌 Loading ingredients for edit:", editProduct.ingredient);
        setSelectedIngredients(editProduct.ingredient ? JSON.parse(editProduct.ingredient) : []);
    }
}, [editProduct]);


  const LoadData = async () => {
    try {
        const res = await axios.get('http://localhost:8000/api/products');
        setData(res.data);  //update state
    } catch (err) {
        console.error("Error fetching products:", err);
    }
  };

  const LoadIngredients = async () => {
    try {
        const res = await axios.get("http://localhost:8000/api/ingredients");
        setIngredients(res.data);
    } catch (err) {
        console.error("Error fetching ingredients:", err);
    }
};



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

const handleEditProduct = (product) => { //คอลัมน์แรกคือชื่อที่ใช้ใน react
  setEditProduct({
    id: product.Product_id, // ใช้ id จากฐานข้อมูล
    name: product.Product_name, 
    price: product.Price, 
    description: product.Description,
    image: product.Product_img, // เก็บภาพเดิม
    newImage: null, 
    ingredient: product.Ingredient_id
  });
};


const handleSaveEdit = async () => {
  try {

    const formData = new FormData();
    formData.append("productName", editProduct.name);
    formData.append("price", editProduct.price);
    formData.append("description", editProduct.description);
    formData.append("ingredients", JSON.stringify(selectedIngredients)); // ✅ ต้องเป็น JSON String

    if (editProduct.newImage) {
      formData.append("productImg", editProduct.newImage); // ✅ ถ้ามีรูปใหม่ให้ส่งไป
    }

    await axios.put(`http://localhost:8000/api/products/${editProduct.id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    alert("Product updated successfully!");
    setEditProduct(null); // ✅ ปิดฟอร์มแก้ไข
    await LoadData(); // ✅ โหลดข้อมูลใหม่
  } catch (error) {
    console.error("🚨 Error updating product:", error);
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

const ingredientOptions = ingredients.map((ingredient) => ({
    value: ingredient.Ingredient_id,
    label: ingredient.Ingredient_name,
}));

const handleIngredientChange = (selectedOptions) => {
  const selectedIds = selectedOptions ? selectedOptions.map(option => ({
      Ingredient_id: option.value,
      Quantity_used: 1
  })) : [];

  setSelectedIngredients(selectedIds);
  console.log("✅ Updated Ingredients:", selectedIds);
};


const handleAddProduct = () => {

  if (!Array.isArray(selectedIngredients) || selectedIngredients.length === 0) {
      console.error("🚨 No Ingredients Found!", selectedIngredients);
      alert("Please select at least one ingredient!");
      return;
  }

  actuallyAddProduct();
};


const actuallyAddProduct = () => {
  const formData = new FormData();
  formData.append("productName", newProduct.name);
  formData.append("price", newProduct.price);
  formData.append("description", newProduct.description);
  formData.append("productImg", newProduct.image);
  formData.append("ingredients", JSON.stringify(selectedIngredients)); // ✅ บังคับให้ส่ง JSON string

  console.log("📌 Sending FormData to Backend:");
  for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]); // ✅ ตรวจสอบค่าที่ถูกส่งไป
  }

  axios.post("http://localhost:8000/api/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
  })
  .then((response) => {
      console.log("✅ Response Data:", response.data);
      setNewProduct({ name: "", price: "", image: "", description: "" });
      setSelectedIngredients([]); // รีเซ็ตข้อมูลหลังเพิ่มสินค้า
      setShowForm(false);
      LoadData();
  })
  .catch((error) => {
      console.error("❌ Error adding product:", error.response ? error.response.data : error);
  });
};




const sendMenuToLine = async () => {
  try {
      await axios.post("http://localhost:8000/api/products/send-menu");
      alert("ส่งเมนูไปที่ LINE แล้ว!");
  } catch (error) {
      console.error("🚨 Error sending menu:", error);
      alert("ไม่สามารถส่งเมนูได้!");
  }
};



  return (
    
    <div className="container">

      <div className="header-container ">
        <h1 className="header">Product</h1>
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

          <div className="content">
          <div className="product-grid">
          {data.map((product, index) => (

            <div key={index} className="product"
            onMouseEnter={() => setHoveredProduct(index)} // เมื่อเมาส์เลื่อนเข้า
            onMouseLeave={() => setHoveredProduct(null)} // เมื่อเมาส์ออก
            onTouchStart={() => setHoveredProduct(index)} // เมื่อแตะที่สินค้า
            >

              <img src={`https://756b-202-44-39-239.ngrok-free.app/uploads/${product.Product_img}`} alt={product.Product_name} />
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
      <button onClick={sendMenuToLine}>ส่งเมนูไป LINE</button>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Product</h2>
            <input type="text" name="name" placeholder="Name" value={newProduct.name} onChange={handleInputChange}/>
            <input type="number" name="price" placeholder="Price" value={newProduct.price} onChange={handleInputChange}/>
            <input type="text" name="description" placeholder="description" value={newProduct.description} onChange={handleInputChange}/>
            <input type="file" accept="image/*" onChange={handleInputChange} />

            <div className="ingredient-selection">
            <h3>เลือกวัตถุดิบ</h3>
            <div className="ingredient-list">
            <Select
              options={ingredients.map(ingredient => ({
                  value: ingredient.Ingredient_id,
                  label: ingredient.Ingredient_name
              }))}
              isMulti
              placeholder="เลือกวัตถุดิบ..."
              value={ingredients.filter(ingredient =>
                  selectedIngredients.some(sel => sel.Ingredient_id === ingredient.Ingredient_id)
              ).map(ingredient => ({
                  value: ingredient.Ingredient_id,
                  label: ingredient.Ingredient_name
              }))}
              onChange={handleIngredientChange}
              className="custom-dropdown"
          />

            </div>
        </div>

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

            <div className="ingredient-selection">
                <h3>เลือกวัตถุดิบ</h3>
                <div className="ingredient-list">
                <Select
                  options={ingredients.map(ingredient => ({
                      value: ingredient.Ingredient_id,
                      label: ingredient.Ingredient_name
                  }))}
                  isMulti
                  placeholder="เลือกวัตถุดิบ..."
                  value={ingredients.filter(ingredient =>
                      selectedIngredients.some(sel => sel.Ingredient_id === ingredient.Ingredient_id)
                  ).map(ingredient => ({
                      value: ingredient.Ingredient_id,
                      label: ingredient.Ingredient_name
                  }))}
                  onChange={handleIngredientChange}
                  className="custom-dropdown"
              />

                </div>
            </div>


            <button onClick={handleSaveEdit}>Save</button>
            <button onClick={() => setEditProduct(null)}>Cancel</button>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ManageProduct;
