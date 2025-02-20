import './App.css';
import ManageProduct from './Product';
import axios from 'axios';



function App() {
  const test = async () => {
    try {
      const [product] = axios.get('http://localhost:8000/api/products')
      console.log(product)
    } catch (err){
      console.log(err)
    }
    
  }
  return (
    <div className="App">
        <ManageProduct />
        <button onClick={test}>whatever</button>
    </div>
  );
}

export default App;

