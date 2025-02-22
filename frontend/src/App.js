import './App.css';
import ManageProduct from './components/Product';
import Order from './components/Order';
import Ingredient from './components/Ingredient';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';




function App() {
  // const test = async () => {
  //   try {
  //     const [product] = axios.get('http://localhost:8000/api/products')
  //     console.log(product)
  //   } catch (err){
  //     console.log(err)
  //   }
    
  // }
  return (
    <Router>
      <div className="App">
        
        <Routes>
          <Route path="/" element={<h1>Home Page</h1>} />
          <Route path="/products" element={<ManageProduct />} />
          <Route path="/orders" element={<Order />} />
          <Route path='/Ingredients' element={<Ingredient />} />
        </Routes>

        <nav> 
          <Link to="/products">Products</Link> | 
          <Link to="/orders">Orders</Link> |
          <Link to="/Ingredients">Ingredients</Link>
        </nav>
      </div>
    </Router>
  );
}

export default App;

