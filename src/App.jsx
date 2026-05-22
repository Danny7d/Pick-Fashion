import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import AllProducts from "./components/AllProducts";
import Orders from "./components/Orders";
import Kids from "./components/nav/Kids";
import Women from "./components/nav/Women";
import Men from "./components/nav/Men";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ProductDetail from "./components/ProductDetail";
import Profile from "./components/Profile";
import AdminRoute from "./components/Admin/AdminRoute";
import AdminLayout from "./components/Admin/AdminLayout";
import Dashboard from "./components/Admin/Dashboard";
import Products from "./components/Admin/Products";
import AdminOrders from "./components/Admin/Orders";
import Customers from "./components/Admin/Customers";
import Analytics from "./components/Admin/Analytics";
import Settings from "./components/Admin/Settings";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<AllProducts />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/kids" element={<Kids />} />
        <Route path="/women" element={<Women />} />
        <Route path="/men" element={<Men />} />
        
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
