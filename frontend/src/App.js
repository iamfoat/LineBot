import './App.css';
import ManageProduct from './components/Product';
import Order from './components/Order';
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
        {/* <nav>
          <Link to="/">🏠 Home</Link> | 
          <Link to="/products">📦 Products</Link> | 
          <Link to="/orders">🛒 Orders</Link>
        </nav> */}

        <Routes>
          {/* <Route path="/" element={<h1>🏠 Home Page</h1>} /> */}
          <Route path="/" element={<ManageProduct />} />
          <Route path="/orders" element={<Order />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

