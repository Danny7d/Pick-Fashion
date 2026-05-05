import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import AllProducts from "./components/AllProducts";
import Kids from "./components/nav/Kids";
import Women from "./components/nav/Women";
import Men from "./components/nav/Men";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ProductDetail from "./components/ProductDetail";
import Profile from "./components/Profile";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<AllProducts />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/kids" element={<Kids />} />
        <Route path="/women" element={<Women />} />
        <Route path="/men" element={<Men />} />
      </Routes>
    </Router>
  );
}

export default App;
