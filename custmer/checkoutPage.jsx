import React, { useState, useEffect } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import '../styles/custcheckout.css';

const CheckoutPage = () => {
  const location = useLocation();
  const cartFromState = location.state && location.state.cart ? location.state.cart : [];

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('');
  const [upiPaid, setUpiPaid] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [netBankingBank, setNetBankingBank] = useState('');
//   const upiId = 'yourname@upi';
// const payeeName = 'Your Name';
  const [newAddress, setNewAddress] = useState({
    fullname: '',
    phone: '',
    email: '',
    pincode: '',
    state: '',
    city: '',
    house: '',
    road: '',
  });
  const [editingAddressIndex, setEditingAddressIndex] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [orders, setOrders] = useState([]); // New state to store placed orders (will be saved to localStorage)
  const [inventoryQuantities, setInventoryQuantities] = useState({}); // New state for inventory quantities
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAddresses = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found, cannot fetch addresses');
        return;
      }
      try {
        const response = await fetch('http://localhost:5000/api/user/address', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          console.error('Failed to fetch addresses');
          return;
        }
        const data = await response.json();
        setAddresses(data);
        if (data.length > 0) {
          setSelectedAddressId(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    };

    fetchAddresses();
  }, []);

  // New useEffect to fetch inventory quantities for products in cart
  useEffect(() => {
    const fetchInventoryQuantities = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found, cannot fetch inventory');
        return;
      }
      try {
        // Assuming backend API endpoint to get inventory quantities for multiple products
        const productIds = cartFromState.map(product => product.id);
        const response = await fetch('http://localhost:5000/api/inventory/quantities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ productIds }),
        });
        if (!response.ok) {
          console.error('Failed to fetch inventory quantities');
          return;
        }
        const data = await response.json(); // Expected format: { productId: quantity, ... }
        setInventoryQuantities(data);
      } catch (error) {
        console.error('Error fetching inventory quantities:', error);
      }
    };

    if (cartFromState.length > 0) {
      fetchInventoryQuantities();
    }
  }, [cartFromState]);

  useEffect(() => {
    if (cartFromState.length > 0) {
      const initialQuantities = Array.isArray(cartFromState) ? cartFromState.reduce((acc, product) => {
        acc[product.id] = 1;
        return acc;
      }, {}) : {};
      setQuantities(initialQuantities);
    }
  }, [cartFromState]);

  const handleQuantityChange = (productId, value) => {
    const maxQuantity = inventoryQuantities[productId] || Infinity;
    let newValue = value === '' ? '' : Number(value);
    if (newValue > maxQuantity) {
      newValue = maxQuantity;
      alert(`Quantity cannot be more than available inventory (${maxQuantity})`);
    }
    setQuantities(prev => ({
      ...prev,
      [productId]: newValue,
    }));
  };
  
  

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    if (isAddingNewAddress) {
      setNewAddress(prev => ({
        ...prev,
        [name]: value,
      }));
    } else if (editingAddressIndex !== null) {
      setAddresses(prev => prev.map((addr, idx) => idx === editingAddressIndex ? { ...addr, [name]: value } : addr));
    }
  };

  const openChangeAddressPopup = () => {
    if (addresses.length > 1) {
      setShowAddressPopup(true);
    }
  };

  const closeChangeAddressPopup = () => {
    setShowAddressPopup(false);
  };

  const selectAddress = (id) => {
    setSelectedAddressId(id);
    setIsEditingAddress(false);
    setIsAddingNewAddress(false);
    setEditingAddressIndex(null);
    setShowAddressPopup(false);
  };

  const toggleEditAddress = async () => {
    if (isEditingAddress && selectedAddressId !== null && editingAddressIndex !== null) {
      // Save edited address to backend
      const editedAddress = addresses[editingAddressIndex];
      const token = localStorage.getItem('token');
      if (!token) {
        alert('User not authenticated. Please login.');
        return;
      }
      try {
        const response = await fetch(`http://localhost:5000/api/user/address/${editedAddress.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(editedAddress),
        });
        if (!response.ok) {
          throw new Error('Failed to update address');
        }
        const data = await response.json();
        // Update addresses state with updated address
        setAddresses(prev => prev.map(addr => addr.id === data.id ? data : addr));
        alert('Address updated successfully');
      } catch (error) {
        console.error('Error updating address:', error);
        alert('Failed to update address');
      }
    }
    setIsEditingAddress(!isEditingAddress);
    if (!isEditingAddress && selectedAddressId !== null) {
      const index = addresses.findIndex(addr => addr.id === selectedAddressId);
      setEditingAddressIndex(index);
    } else {
      setEditingAddressIndex(null);
    }
  };

  const toggleAddNewAddress = async () => {
    if (isAddingNewAddress) {
      // Save new address to backend
      const token = localStorage.getItem('token');
      if (!token) {
        alert('User not authenticated. Please login.');
        return;
      }
      try {
        const response = await fetch('http://localhost:5000/api/user/address', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(newAddress),
        });
        if (!response.ok) {
          throw new Error('Failed to add new address');
        }
        const data = await response.json();
        // Add new address to addresses state and select it
        setAddresses(prev => [...prev, data]);
        setSelectedAddressId(data.id);
        alert('New address added successfully');
      } catch (error) {
        console.error('Error adding new address:', error);
        alert('Failed to add new address');
      }
    }
    setIsAddingNewAddress(!isAddingNewAddress);
    setIsEditingAddress(false);
    setEditingAddressIndex(null);
    setNewAddress({
      fullname: '',
      phone: '',
      email: '',
      pincode: '',
      state: '',
      city: '',
      house: '',
      road: '',
    });
  };

  const calculateSubtotal = () => {
    return Array.isArray(cartFromState) ? cartFromState.reduce((sum, product) => {
      const qtyRaw = quantities[product.id];
      const qty = qtyRaw === '' ? 0 : (Number(qtyRaw) || 1);
      const price = typeof product.price === 'number' ? product.price : Number(product.price);
      return sum + price * qty;
    }, 0) : 0;
  };
  
  

  const gstRate = 0.08;
  const subtotal = calculateSubtotal();
  const gstAmount = subtotal * gstRate;
  const total = subtotal + gstAmount;

  if (cartFromState.length === 0) {
    return <div className='no-check'>No products to checkout.</div>;
  }

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
  const otherAddresses = addresses.filter(addr => addr.id !== selectedAddressId);
  
  
  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <div className="checkout-container">
        <div className="delivery-address">
          <h2>Delivery Address</h2>
          {selectedAddress ? (
            <div className="saved-address">
              <p>{selectedAddress.fullname}</p>
              <p>{selectedAddress.house}</p>
              <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}</p>
              <p>{selectedAddress.phone}</p>
              <p>{selectedAddress.email}</p>
              <button className='chnadd' onClick={openChangeAddressPopup}>Change Address</button>
              <button className='adine' onClick={toggleAddNewAddress}>Add New Address</button>
            </div>
          ) : (
            <p>No address selected.</p>
          )}

          {isEditingAddress && selectedAddress && editingAddressIndex !== null && (
            <form>
          <label>
            Full Name:
            <input type="text" name="fullname" value={selectedAddress.fullname} onChange={handleAddressChange} />
          </label>
          <label>
            Phone:
            <input type="text" name="phone" value={selectedAddress.phone} onChange={handleAddressChange} />
          </label>
          <label>
            Email:
            <input type="email" name="email" value={selectedAddress.email || ''} onChange={handleAddressChange} />
          </label>
          <label>
            Pincode:
            <input type="text" name="pincode" value={selectedAddress.pincode} onChange={handleAddressChange} />
          </label>
          <label>
            State:
            <input type="text" name="state" value={selectedAddress.state} onChange={handleAddressChange} />
          </label>
          <label>
            City:
            <input type="text" name="city" value={selectedAddress.city} onChange={handleAddressChange} />
          </label>
          <label>
            House No / Building:
            <input type="text" name="house" value={selectedAddress.house} onChange={handleAddressChange} />
          </label>
          <label>
            Road / Area:
            <input type="text" name="road" value={selectedAddress.road} onChange={handleAddressChange} />
          </label>
          <button type="button" onClick={toggleEditAddress}>Save Address</button>
        </form>
      )}

          {isAddingNewAddress && (
            <form>
          <label>
            Full Name:
            <input type="text" name="fullname" value={newAddress.fullname} onChange={handleAddressChange} />
          </label>
          <label>
            Phone:
            <input type="text" name="phone" value={newAddress.phone} onChange={handleAddressChange} />
          </label>
          <label>
            Email:
            <input type="email" name="email" value={newAddress.email || ''} onChange={handleAddressChange} />
          </label>
          <label>
            Pincode:
            <input type="text" name="pincode" value={newAddress.pincode} onChange={handleAddressChange} />
          </label>
          <label>
            State:
            <input type="text" name="state" value={newAddress.state} onChange={handleAddressChange} />
          </label>
          <label>
            City:
            <input type="text" name="city" value={newAddress.city} onChange={handleAddressChange} />
          </label>
          <label>
            House No / Building:
            <input type="text" name="house" value={newAddress.house} onChange={handleAddressChange} />
          </label>
          <label>
            Road / Area:
            <input type="text" name="road" value={newAddress.road} onChange={handleAddressChange} />
          </label>
          <button type="button" className='svcu' onClick={toggleAddNewAddress}>Save New Address</button>
        </form>
      )}
          

          {showAddressPopup && (
            <div className="address-popup-overlay" style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}>
              <div className="address-popup" style={{
                backgroundColor: 'var(--two2)',
                color: 'var(--white)',
                padding: '20px',
                borderRadius: '8px',
                width: '400px',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}>
                <h3>Select Delivery Address</h3>
                {otherAddresses.length === 0 ? (
                  <p>No other saved addresses.</p>
                ) : (
                  otherAddresses.map(addr => (
                    <div key={addr.id} style={{ borderBottom: '1px solid var(--white)', padding: '10px 0' }}>
                      <p><strong>{addr.fullname}</strong></p>
                      <p>{addr.house}</p>
                      <p>{addr.city}, {addr.state} {addr.pincode}</p>
                      <p>{addr.phone}</p>
                      <button onClick={() => selectAddress(addr.id)}>Select This Address</button>
                    </div>
                  ))
                )}
                <button onClick={closeChangeAddressPopup} style={{ marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/1828/1828778.png"
                    alt="Close"
                    style={{ width: '20px', height: '20px',filter:'brightness(0) invert(1)',position:'absolute',right:'37%',top:'17%' }}
                  />
                </button>

              </div>
            </div>
          )}
        </div>
        <div className="order-summary">
          <h2>Product Summary</h2>
          <table className="summary-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {cartFromState.map(product => {
                const qty = quantities[product.id] || 1;
                const price = typeof product.price === 'number' ? product.price : Number(product.price);
                return (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>
                    <input
  type="number"
  min={1}
  max={inventoryQuantities[product.id] || 9999}
  value={quantities[product.id] ?? ''}
  onChange={(e) => {
    let value = e.target.value;
    // Allow only digits (empty string is also allowed for typing)
    if (/^\d*$/.test(value)) {
      // Clamp value to max inventory quantity
      const maxQty = inventoryQuantities[product.id] || 9999;
      if (value === '') {
        handleQuantityChange(product.id, '');
      } else {
        let numValue = Number(value);
        if (numValue > maxQty) {
          alert(`The quantity entered exceeds the available stock. Please enter a value less than or equal to the available quantity: ${maxQty}.`);
          // Revert input value to previous valid quantity
          e.target.value = quantities[product.id] ?? 1;
          return;
        }
        handleQuantityChange(product.id, numValue);
      }
    }
  }}
  style={{ width: '60px' }}
/>

                    </td>
                    <td>${price.toFixed(2)}</td>
                    <td>${(price * qty).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="price-summary">
            <p>Subtotal: ${subtotal.toFixed(2)}</p>
            <p>GST (8%): ${gstAmount.toFixed(2)}</p>
            <p><strong>Total: ${total.toFixed(2)}</strong></p>
          </div>
        </div>
        <button className='pric' onClick={() => setShowPaymentSection(true)}>Proceed to payment</button>
      </div>
      {showPaymentSection && (
        <div className="payment-section" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'var(--two2)',
            padding: '20px',
            margin:'50px',
            borderRadius: '8px',
            width: '400px',
            maxHeight: '80vh',
            color:'var(--white)',
            overflowY: 'auto',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            
          }}>
            <h2>Payment Section</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              let message = `Payment Method: ${paymentMethod}\n`;
              if (paymentMethod === 'UPI') {
                message += `UPI ID: ${upiId}`;
              } else if (paymentMethod === 'Credit Card') {
                message += `Card Number: ${cardNumber}\nExpiry: ${cardExpiry}\nCVV: ${cardCvv}`;
              } else if (paymentMethod === 'Net Banking') {
                message += `Bank: ${netBankingBank}`;
              } else if (paymentMethod === 'Cash on Delivery') {
                message += 'Cash on Delivery selected';
              }
              alert(message);
              // Instead of alert, save order details and close payment section
              e.preventDefault();

              // Generate unique order ID
              const orderId = 'ORD-' + Date.now();

              // Prepare products list with quantities and delivery date
              const orderedProducts = cartFromState.map((product, index) => ({
                id: product.id,
                name: product.name,
                quantity: quantities[product.id] || 1,
                price: typeof product.price === 'number' ? product.price : Number(product.price)
              }));

              // Format delivery address including email as JSON string
              const deliveryAddress = selectedAddress
                ? JSON.stringify(selectedAddress)
                : '';

              // Current date in MySQL DATETIME format: YYYY-MM-DD HH:mm:ss
              const orderDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

              // Create order object
              const newOrder = {
                orderId,
                products: orderedProducts,
                deliveryAddress,
                date: orderDate,
                price: subtotal,
                paymentMethod,
                gst: gstAmount,
                total,
              };

              // Save order to backend database and localStorage with cumulative orders, avoid duplicate product orders at the same time
              const token = localStorage.getItem('token');
              if (!token) {
                alert('User not authenticated. Please login.');
                return;
              }
              // Prepare order data for backend
              // Validate order data before sending
              if (!selectedAddress) {
                alert('Please select a delivery address.');
                return;
              }
              if (!paymentMethod) {
                alert('Please select a payment method.');
                return;
              }
              if (newOrder.products.length === 0) {
                alert('No products in the order.');
                return;
              }
              for (const p of newOrder.products) {
                if (!p.id || !p.name || p.quantity <= 0 || p.price <= 0) {
                  alert('Invalid product details in the order.');
                  return;
                }
              }
              if (!newOrder.deliveryAddress ) {
                alert('Delivery address is missing or invalid.');
                return;
              }
              
              const orderData = {
                orderId: newOrder.orderId,
                products: newOrder.products.map(p => ({
                  id: p.id,
                  name: p.name,
                  quantity: p.quantity,
                  price: p.price,
                })),
                deliveryAddress: newOrder.deliveryAddress,  // ✅ Fix here
                date: newOrder.date,
                price: newOrder.price,
                paymentMethod: newOrder.paymentMethod,
                gst: newOrder.gst,
                total: newOrder.total,
              };
              
              console.log('Sending order data:', orderData);
              fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(orderData),
              })
                .then(response => {
                  if (!response.ok) {
                    throw new Error('Failed to save order to database');
                  }
                  return response.json();
                })
                .then(data => {
                  console.log('Order saved to database:', data);
                  // Update localStorage orders
                  try {
                    const existingOrders = JSON.parse(localStorage.getItem('orders')) || [];
                    const newProductIds = newOrder.products.map(p => p.id).sort().join(',');
                    const isDuplicate = existingOrders.some(order => {
                      const existingProductIds = order.products.map(p => p.id).sort().join(',');
                      return existingProductIds === newProductIds;
                    });
                    if (!isDuplicate) {
                      const updatedOrders = [...existingOrders, newOrder];
                      localStorage.setItem('orders', JSON.stringify(updatedOrders));
                      setOrders(updatedOrders);
                    }
                  } catch (e) {
                    console.error('Error updating localStorage orders:', e);
                  }
                })
                .catch(error => {
                  console.error('Error saving order:', error);
                  alert('Error saving order. Please try again.');
                });

              // Close payment section
              setShowPaymentSection(false);

              // Navigate to order page after placing order
              navigate('/customer/orders');

              // Optionally clear cart or reset payment inputs here if needed
            }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ marginBottom: '10px',marginLeft:'10px' }}>
              <input
                type="radio"
                name="paymentMethod"
                value="UPI"
                checked={paymentMethod === 'UPI'}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setUpiPaid(false);
                }}
              />
              UPI
            </label>
                <label style={{ marginLeft: '10px' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Credit Card"
                    checked={paymentMethod === 'Credit Card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  Credit Card
                </label>
                <label style={{ marginLeft: '10px' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Net Banking"
                    checked={paymentMethod === 'Net Banking'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  Net Banking
                </label>
                <label style={{ marginLeft: '10px' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Cash on Delivery"
                    checked={paymentMethod === 'Cash on Delivery'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  Cash on Delivery
                </label>
              </div>

              {paymentMethod === 'UPI' && (
                <div style={{ marginBottom: '10px' }}>
                  <p>Select UPI App:</p>
                  <label style={{ marginBottom: '10px',marginLeft:'10px' }}>
                    <input
                      type="radio"
                      name="upiApp"
                      value="GPay"
                      checked={selectedUpiApp === 'GPay'}
                      onChange={(e) => {
                        setSelectedUpiApp(e.target.value);
                        setUpiId('sanusanu71800@oksbi');
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    GPay
                  </label>
                  <label style={{ marginLeft: '10px' }}>
                    <input
                      type="radio"
                      name="upiApp"
                      value="PhonePe"
                      checked={selectedUpiApp === 'PhonePe'}
                      onChange={(e) => {
                        setSelectedUpiApp(e.target.value);
                        setUpiId('8921252868@axl');
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    PhonePe
                  </label>
                  <label style={{ marginLeft: '10px' }}>
                    <input
                      type="radio"
                      name="upiApp"
                      value="Paytm"
                      checked={selectedUpiApp === 'Paytm'}
                      onChange={(e) => {
                        setSelectedUpiApp(e.target.value);
                        setUpiId('8921252868@ptyes');
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    Paytm
                  </label>
                  {selectedUpiApp && (
                    <div style={{ marginTop: '10px' }}>
                      <p>UPI ID: <strong>{upiId}</strong></p>
                      <button type="button" onClick={() => {
                        let url = '';
                        const amount = total.toFixed(2);
                        if (selectedUpiApp === 'GPay') {
                          url = `upi://pay?pa=${upiId}&am=${amount}&cu=INR&pn=YourName`;
                        } else if (selectedUpiApp === 'PhonePe') {
                          url = `upi://pay?pa=${upiId}&am=${amount}&cu=INR&pn=YourName`;
                        } else if (selectedUpiApp === 'Paytm') {
                          url = `upi://pay?pa=${upiId}&am=${amount}&cu=INR&pn=YourName`;
                        }
                        window.open(url, '_blank');
                        setUpiPaid(true);
                        // Do not close payment section here, allow user to place order after paying
                        // setShowPaymentSection(false);
                      }}>
                        Pay Now (${total.toFixed(2)})
                      </button>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'Credit Card' && (
                <div style={{ marginBottom: '10px' }}>
                  <label>
                    Card Number:
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxLength={16}
                      required
                    />
                  </label>
                  <label>
                    Expiry Date:
                    <input
                      type="month"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    CVV:
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      maxLength={4}
                      required
                    />
                  </label>
                </div>
              )}

              {paymentMethod === 'Net Banking' && (
                <div style={{ marginBottom: '10px' }}>
                  <label>
                    Select Bank:
                    <select
                      value={netBankingBank}
                      onChange={(e) => setNetBankingBank(e.target.value)}
                      required
                    >
                      <option value="">--Select Bank--</option>
                      <option value="HDFC">HDFC Bank</option>
                      <option value="ICICI">ICICI Bank</option>
                      <option value="SBI">State Bank of India</option>
                      <option value="Axis">Axis Bank</option>
                      <option value="Kotak">Kotak Mahindra Bank</option>
                    </select>
                  </label>
                </div>
              )}

              {paymentMethod === 'Cash on Delivery' && (
                <div style={{ marginBottom: '10px' }}>
                  <p>You have selected Cash on Delivery. Please keep the exact amount ready.</p>
                </div>
              )}

              <button type="submit" className='pls' disabled={
                paymentMethod === 'UPI' ? !upiPaid : !paymentMethod
              }>Place order</button>
              <button type="button" className='plcan' onClick={() => setShowPaymentSection(false)} >Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CheckoutPage;
