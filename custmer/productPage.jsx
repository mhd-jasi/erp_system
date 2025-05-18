import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import '../styles/custproduct.css';

const ProductPage = () => {
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/inventory')
      .then((res) => res.json())
      .then((data) => {
        setInventory(data);
        const uniqueCategories = Array.from(new Set(data.map(item => item.category))).filter(Boolean);
        setCategories(uniqueCategories);
      })
      .catch((error) => console.error('Failed to fetch inventory:', error));
  }, []);

  useEffect(() => {
    // Decode token to get user email or id for cart key
    const token = localStorage.getItem('token');
    let userKey = 'cart';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.email) {
        userKey = `cart_${payload.email}`;
      } else if (payload.sub) {
        userKey = `cart_${payload.sub}`;
      }
      console.log('ProductPage userKey:', userKey);
    } catch (e) {
      console.error('Failed to decode token payload', e);
    }
    const storedCart = localStorage.getItem(userKey);
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  const handleAddToCart = (product) => {
    const token = localStorage.getItem('token');
    let userKey = 'cart';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.email) {
        userKey = `cart_${payload.email}`;
      } else if (payload.sub) {
        userKey = `cart_${payload.sub}`;
      }
      console.log('ProductPage userKey on add:', userKey);
    } catch (e) {
      console.error('Failed to decode token payload', e);
    }
    const storedCart = localStorage.getItem(userKey);
    const currentCart = storedCart ? JSON.parse(storedCart) : [];

    const isAlreadyInCart = currentCart.some(p => p.id === product.id);
    if (!isAlreadyInCart) {
      const updatedCart = [...currentCart, product];
      localStorage.setItem(userKey, JSON.stringify(updatedCart));
      setCart(updatedCart);
    } else {
      alert('This product is already in your cart.');
    }
  };

  const handleBuyNow = (product) => {
    setCart([product]);
    navigate('/customer/checkout', { state: { cart: [product] } });
  };

  const filteredProducts = inventory.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="product-page">
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', color: 'white', transform: 'scaleX(-1)' }}>
        <div
          style={{ cursor: 'pointer', position: 'relative', fontSize: '24px' }}
          title="Go to Cart"
          onClick={() => navigate('/customer/cart')}
          aria-label="Cart"
        >
          <FontAwesomeIcon icon={faShoppingCart} />
          {cart.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-9px',
              right: '15px',
              background: 'red',
              color: 'white',
              transform: 'scaleX(-1)',
              borderRadius: '50%',
              padding: '1px 4px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}>
              {cart.length}
            </span>
          )}
        </div>
      </div>

      <h1>Inventory Products</h1>

      <div className="custfilter-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="category-select"
        >
          <option value="All">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="product-grid">
        {filteredProducts.map((product, index) => {
          const quantity = product.quantity || 0;
          const isOutOfStock = quantity === 0;
          const isLowStock = quantity <= 20 && quantity > 0;

          return (
            <div
              key={product.id}
              className={`product-card ${isOutOfStock ? 'out-of-stock-card' : ''}`}
            >
              {isOutOfStock && (
                <div className="out-of-stock-overlay">Out of Stock</div>
              )}

              <h2 className="product-name">{product.name}</h2>
              <p className="product-description">{product.description}</p>
              <p className="product-price">
                ${typeof product.price === 'number' ? product.price.toFixed(2) : Number(product.price).toFixed(2)}
              </p>
              <p className="delivery-date">
                Delivery Date: {new Date(Date.now() + ((index % 20) + 8) * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>

              {isLowStock && (
                <p className="low-stock-warning">Hurry! Only {quantity} left</p>
              )}

              <div className="product-buttons">
                <button className="buy-button" onClick={() => handleBuyNow(product)} disabled={isOutOfStock}>Buy</button>
                <button className="add-to-cart-button" onClick={() => handleAddToCart(product)} disabled={isOutOfStock}>Add to Cart</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductPage;
