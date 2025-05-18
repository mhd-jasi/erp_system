import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse,
  faBoxOpen,
  faShoppingCart,
  faCreditCard,
  faUser,
  faRightFromBracket
} from '@fortawesome/free-solid-svg-icons';
import '../styles/custlayout.css';
import logo from "../photos/logo.png";

export default function CustmoerLayout({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    setLoading(true);

    setTimeout(() => {
      if (onLogout) {
        onLogout();
      }
      setLoading(false);
      navigate('/');
    }, 3000);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div className="custcontainer">
      <nav className="navcust">
        <h2><img src={logo} alt="roopper" /> <span>LogiGo</span></h2>
        <ul>
          {/* <li>
            <NavLink to="/customer/dashboard" className={location.pathname === "/customer/dashboard" ? "active" : ""}>
              <FontAwesomeIcon icon={faHouse} className="nav-icon" /> Dashboard
            </NavLink>
          </li> */}
          <li>
            <NavLink to="/customer/products" className={location.pathname === "/customer/products" ? "active" : ""}>
              <FontAwesomeIcon icon={faBoxOpen} className="nav-icon" /> Products
            </NavLink>
          </li>
          <li>
            <NavLink to="/customer/orders" className={location.pathname === "/customer/orders" ? "active" : ""}>
              <FontAwesomeIcon icon={faShoppingCart} className="nav-icon" /> Orders
            </NavLink>
          </li>
          <li>
            <NavLink to="/customer/checkout" className={location.pathname === "/customer/checkout" ? "active" : ""}>
              <FontAwesomeIcon icon={faCreditCard} className="nav-icon" /> Checkout
            </NavLink>
          </li>
          <li>
            <NavLink to="/customer/cart" className={location.pathname === "/customer/cart" ? "active" : ""}>
              <FontAwesomeIcon icon={faCreditCard} className="nav-icon" />My cart
            </NavLink>
          </li>
          <li>
            <NavLink to="/customer/profile" className={location.pathname === "/customer/profile" ? "active" : ""}>
              <FontAwesomeIcon icon={faUser} className="nav-icon" /> Profile
            </NavLink>
          </li>
          <li>
            <button className="logout-button" onClick={handleLogoutClick}>
              <FontAwesomeIcon icon={faRightFromBracket} className="nav-icon" /> Logout
            </button>
          </li>
        </ul>
      </nav>
      <main className="main">
        <Outlet />
      </main>

      {showLogoutConfirm && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-box">
            <p>Are you sure you want to logout?</p>
            <div className="logout-confirm-buttons">
              <button onClick={handleConfirmLogout} className="confirm-button">OK</button>
              <button onClick={handleCancelLogout} className="can-button">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="logout-overlay">
          <div className="logout-spinner"></div>
        </div>
      )}
    </div>
  );
}
