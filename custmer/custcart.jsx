import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/custcart.css';

const CustCart = () => {
  const [cart, setCart] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (token && isAuthenticated === 'true') {
      setIsLoggedIn(true);
      // Decode token to get user email or id
      let userKey = 'cart';
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.email) {
          userKey = `cart_${payload.email}`;
        } else if (payload.sub) {
          userKey = `cart_${payload.sub}`;
        }
        console.log('CustCart userKey:', userKey);
      } catch (e) {
        console.error('Failed to decode token payload', e);
      }
      const storedCart = localStorage.getItem(userKey);
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } else {
      setIsLoggedIn(false);
      navigate('/login');
    }
  }, [navigate]);

  const handleBuyNow = (product) => {
    navigate('/customer/checkout', { state: { cart: [product] } });
  };

  const handleRemoveFromCart = (product) => {
    const token = localStorage.getItem('token');
    let userKey = 'cart';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.email) {
        userKey = `cart_${payload.email}`;
      } else if (payload.sub) {
        userKey = `cart_${payload.sub}`;
      }
      console.log('CustCart userKey on remove:', userKey);
    } catch (e) {
      console.error('Failed to decode token payload', e);
    }
    const newCart = cart.filter(p => p.id !== product.id);
    setCart(newCart);
    localStorage.setItem(userKey, JSON.stringify(newCart));
  };

  const handleBuyAll = () => {
    navigate('/customer/checkout', { state: { cart } });
  };

  if (!isLoggedIn) {
    return <div className="empty-cart-message"><h2>Please log in to view your cart.</h2></div>;
  }

  if (cart.length === 0) {
    return <div className="empty-cart-message"><h2>Your cart is empty.</h2></div>;
  }

  return (
    <div className="cart-container">
      <h1 style={{color:'var(--white)'}}>Your Cart</h1>
      <button
        onClick={handleBuyAll}
        className="buy-all-button"
      >
        Buy All ({cart.length})
      </button>
      <ul className="product-list">
        {cart.map(product => (
          <li key={product.id} className="product-item">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p className="product-price">Price: ${typeof product.price === 'number' ? product.price.toFixed(2) : Number(product.price).toFixed(2)}</p>
            <div className="product-buttons">
              <button
                onClick={() => handleBuyNow(product)}
                className="product-button buy-button"
              >
                Buy
              </button>
              <button
                onClick={() => handleRemoveFromCart(product)}
                className="product-button remove-button"
              >
                Remove from Cart
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CustCart;
