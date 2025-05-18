import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './pages/layout';
import Dashboard from './pages/dashboard';
import Shipment from './pages/shipment';
import Fleet from './pages/fleet';
import Inventory from './pages/inventory';
import Billing from './pages/billing';
import CRM from './pages/crm';
import Order from './pages/orders';
import Warehouse from './pages/warehouse';
import Usermana from './pages/usermana';
import AdminLogin from './login/login'; // Embedded login/signup form

import CustmoerLayout from './custmer/custmoerLayout';
import ProductsPage from './custmer/productPage';
import OrdersPage from './custmer/orderPage';
import CheckoutPage from './custmer/checkoutPage';
import ProfilePage from './custmer/profilePage';
import CustCart from './custmer/custcart';


const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isAuthenticated');
    const role = localStorage.getItem('userRole');
    if (loggedIn === 'true') {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  // Persist current path on refresh to avoid redirecting to main page
  useEffect(() => {
    const currentPath = window.location.pathname;
    const loggedIn = localStorage.getItem('isAuthenticated');
    const role = localStorage.getItem('userRole');

    if (loggedIn === 'true') {
      setIsAuthenticated(true);
      setUserRole(role);
    }

    // If admin and on root or main page, redirect to dashboard
    if (role === 'admin' && (currentPath === '/' || currentPath === '')) {
      window.history.replaceState(null, '', '/');
    }

    // If user and on root or main customer page, redirect to products page
    if (role === 'user' && (currentPath === '/' || currentPath === '/customer' || currentPath === '/customer/')) {
      window.history.replaceState(null, '', '/customer/products');
    }
  }, []);

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
  };

  return (
    <Router>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/" element={<AdminLogin onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : userRole === 'user' ? (
          <>
            <Route path="/" element={<Navigate to="/customer/products" />} />
            <Route path="/customer" element={<CustmoerLayout onLogout={handleLogout} />}>
              <Route index element={<ProductsPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="cart" element={<CustCart />} />
              <Route path="*" element={<Navigate to="/customer/orders" />} />
            </Route>
          </>
        ) : (
          <Route path="/" element={<Layout onLogout={handleLogout} />}>
            <Route index element={<Dashboard />} />
            <Route path="shipment" element={<Shipment />} />
            <Route path="fleet" element={<Fleet />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="billing" element={<Billing />} />
            <Route path="crm" element={<CRM />} />
            <Route path="orders" element={<Order />} />
            <Route path="warehouse" element={<Warehouse />} />
            <Route path="usermana" element={<Usermana/>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
};

export default App;
