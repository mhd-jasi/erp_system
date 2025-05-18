import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import logo from "../photos/logo.png";
import {
  faHouse,
  faShoppingCart,
  faShippingFast,
  faTruck,
  faBox,
  faWarehouse,
  faFileInvoiceDollar,
  faUsers,
  faAddressBook,
  faRightFromBracket
} from '@fortawesome/free-solid-svg-icons';
import '../styles/layout.css';

const Layout = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    setLoading(true); // show spinner immediately

    // Keep spinner visible for 3 seconds before logout & redirect
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
    <div>
      <nav className='navadm'>
        <h2><img src={logo} alt="roopper" /> <span>LogiGo</span></h2>

        <ul>
          <li><Link to="/" className={location.pathname === "/" ? "active" : ""}><FontAwesomeIcon icon={faHouse} className="nav-icon" /> Dashboard</Link></li>
          <li><Link to="/orders" className={location.pathname === "/orders" ? "active" : ""}><FontAwesomeIcon icon={faShoppingCart} className="nav-icon" /> Orders</Link></li>
          <li><Link to="/shipment" className={location.pathname === "/shipment" ? "active" : ""}><FontAwesomeIcon icon={faShippingFast} className="nav-icon" /> Shipment</Link></li>
          <li><Link to="/fleet" className={location.pathname === "/fleet" ? "active" : ""}><FontAwesomeIcon icon={faTruck} className="nav-icon" /> Fleet </Link></li>
          <li><Link to="/inventory" className={location.pathname === "/inventory" ? "active" : ""}><FontAwesomeIcon icon={faBox} className="nav-icon" /> Inventory</Link></li>
          <li><Link to="/warehouse" className={location.pathname === "/warehouse" ? "active" : ""}><FontAwesomeIcon icon={faWarehouse} className="nav-icon" /> WareHouse</Link></li>
          <li><Link to="/billing" className={location.pathname === "/billing" ? "active" : ""}><FontAwesomeIcon icon={faFileInvoiceDollar} className="nav-icon" /> Billing </Link></li>
          <li><Link to="/crm" className={location.pathname === "/crm" ? "active" : ""}><FontAwesomeIcon icon={faAddressBook} className="nav-icon" /> CRM</Link></li>
          <li><Link to="/usermana" className={location.pathname === "/usermana" ? "active" : ""}><FontAwesomeIcon icon={faUsers} className="nav-icon" />users</Link></li>
          <li><button className="logout-button" onClick={handleLogoutClick}><FontAwesomeIcon icon={faRightFromBracket} className="nav-icon" /> Logout</button></li>
        </ul>
      </nav>
      <Outlet />

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
};

export default Layout;
