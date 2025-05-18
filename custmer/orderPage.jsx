import React, { useEffect, useState } from 'react';
import '../styles/custorder.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {

  faSearch,

} from "@fortawesome/free-solid-svg-icons";




const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchOrderId, setSearchOrderId] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated. Please login.');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch('http://localhost:5000/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        let userEmail = null;
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          userEmail = tokenPayload.email || null;
        } catch (e) {
          userEmail = localStorage.getItem('userEmail') || null;
        }

        const updatedData = data.map(order => {
          if (order.delivery_address && typeof order.delivery_address === 'object') {
            if (!order.delivery_address.email && userEmail) {
              order.delivery_address.email = userEmail;
            }
          }
          // Mark orders that are newly added after checkout with a flag to color order confirmed timeline
          if (order.order_status === 'Order Confirmed' && order.isNewlyAdded) {
            order.highlightOrderConfirmed = true;
          }
          return order;
        });

        setOrders(updatedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const closeTrackingPopup = () => {
    setTrackingOrder(null);
  };

  const handleCancelOrder = async (orderId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('User not authenticated. Please login.');
      return;
    }
  
    try {
    // Update to use new endpoint for customer order cancellation
    const response = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel order');
      }
  
      // Update UI state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.order_id === orderId
            ? { ...order, order_status: 'Cancelled' }
            : order
        )
      );
  
      setTrackingOrder(prev =>
        prev && prev.order_id === orderId
          ? { ...prev, order_status: 'Cancelled' }
          : prev
      );
  
      alert('Order cancelled successfully');
  
  
  
  
      // Also update shipment status for this order
      try {
        const shipmentResponse = await fetch(`http://localhost:5000/api/shipments/${orderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'Cancelled' }),
        });
        if (!shipmentResponse.ok) {
          throw new Error('Failed to update shipment status');
        }
      } catch (shipmentError) {
        console.warn('Failed to update shipment status:', shipmentError);
      }

    } catch (error) {
      alert('Failed to cancel order');
    }
  };

  const updateDeliveryEmail = async (orderId, newEmail) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('User not authenticated. Please login.');
      return false;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/delivery-email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail }),
      });
      if (!response.ok) throw new Error('Failed to update delivery email');
      return true;
    } catch (error) {
      alert('Failed to update delivery email');
      return false;
    }
  };

  const handleEmailChange = (orderId, newEmail) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        (order.order_id === orderId || order.id === orderId)
          ? {
            ...order,
            delivery_address: {
              ...order.delivery_address,
              email: newEmail,
            },
          }
          : order
      )
    );
  };

  const handleEmailBlur = async (orderId, email) => {
    const success = await updateDeliveryEmail(orderId, email);
    if (!success) {
      console.warn('Email update failed');
    }
  };

  // Filter and paginate
  const filteredOrders = Array.isArray(orders) ? orders.filter(order =>
    (order.order_id || order.id || '')
      .toString()
      .toLowerCase()
      .includes(searchOrderId.toLowerCase())
  ) : [];

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div>Error: {error}</div>;
  if (orders.length === 0) return <div>No orders found.</div>;

  return (
    <div className="custorder-container">
      <h1>Your Orders</h1>

      <div className="search-bar">
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <input
          type="text"
          placeholder="Search by Order ID"
          value={searchOrderId}
          onChange={(e) => {
            setSearchOrderId(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <table className="custorder-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Products</th>
            <th>Delivery Address</th>
            <th>Payment Method</th>
            <th>Price</th>
            <th>GST 8%</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(currentOrders) ? currentOrders.map((order) => (
            <tr key={order.order_id || order.id}>
              <td>{order.order_id || order.orderId}</td>
              <td>{order.date}</td>
              <td>
                <ul>
                  {Array.isArray(order.products) ? order.products.map(product => (
                    <li key={product.product_id || product.id}>
                      {product.product_name || product.name} - Qty: {product.quantity} - Price: ${Number(product.price).toFixed(2)}
                    </li>
                  )) : null}
                </ul>
              </td>
              <td>
                {order.delivery_address && typeof order.delivery_address === 'object' ? (
                  <div className="delivery-address">
                    <div className="customer-name">{order.delivery_address.name}</div>
                    <div>{order.delivery_address.address}</div>
                    {order.delivery_address.address2 && <div>{order.delivery_address.address2}</div>}
                    <div>{order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.zip}</div>
                    <div className="customer-phone">{order.delivery_address.phone}</div>
                    <div className="customer-email">
                      <strong>Email:</strong> {order.delivery_address.email || 'No email provided'}
                    </div>
                  </div>
                ) : (
                  <div>Delivery address not available</div>
                )}
              </td>
              <td>{order.payment_method || order.paymentMethod}</td>
              <td>${Number(order.price).toFixed(2)}</td>
              <td>${Number(order.gst).toFixed(2)}</td>
              <td>${Number(order.total).toFixed(2)}</td>
              <td>
                {order.order_status === 'Delivered' ? (
                  <button onClick={() => alert('Return process initiated')} style={{backgroundColor:'var(--awit)',padding:'4px 7px',margin:'7px 7px 20px',border:'none',borderRadius:'3px'}}>Return</button>
                ) : order.order_status === 'Cancelled' ? (
                  <span style={{ color: 'red', fontWeight: 'bold' }}>Cancelled</span>
                ) : (
                  <button className='track-cancel' onClick={() => handleCancelOrder(order.order_id)}>Cancel</button>
                )}
                <button className='tracker' onClick={() => setTrackingOrder(order)} style={{ marginLeft: '8px' }}>
                  Track
                </button>
              </td>
            </tr>
          )) : null}
        </tbody>
      </table>

      {/* Pagination controls */}
      <div className="pagination">
        <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
          {"<"}
        </button>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            className={currentPage === index + 1 ? "active-page" : ""}
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
        <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
          {">"}
        </button>
      </div>

      {/* Tracking Popup */}
      {trackingOrder && (
        <div className="tracking-popup-overlay" onClick={closeTrackingPopup}>
          <div className="tracking-popup" onClick={(e) => e.stopPropagation()}>
            <h2>Order Tracking</h2>
            {trackingOrder.order_status === 'Cancelled' ? (
              <div className="order-cancelled-message">
                <h3>Order Cancelled</h3>
                <p>Your order has been cancelled.</p>
              </div>
            ) : (
              <ul className="tracking-timeline">
                <li className={`timeline-step completed current filled`}>
                  <div className={`circle filled`}></div>
                  <div className="step-content">
                    <h4>Order Confirmed, {new Date(trackingOrder.date).toLocaleDateString()}</h4>
                    <p>Your order has been placed</p>
                  </div>
                </li>

                <li className={`timeline-step ${(trackingOrder.order_status === 'Processing' || trackingOrder.order_status === 'Shipped' || trackingOrder.order_status === 'Out for Delivery' || trackingOrder.order_status === 'Delivered') ? 'completed' : ''} ${trackingOrder.order_status === 'Shipped' ? 'current' : ''}`}>
                  <div className={`circle ${(trackingOrder.order_status === 'Processing' || trackingOrder.order_status === 'Shipped' || trackingOrder.order_status === 'Out for Delivery' || trackingOrder.order_status === 'Delivered') ? 'filled' : ''}`}></div>
                  <div className="step-content"><h4>Shipped</h4></div>
                </li>

                <li className={`timeline-step ${(trackingOrder.order_status === 'Processing' || trackingOrder.order_status === 'Out for Delivery' || trackingOrder.order_status === 'Delivered') ? 'completed' : ''} ${(trackingOrder.order_status === 'Processing' || trackingOrder.order_status === 'Out for Delivery') ? 'current' : ''}`}>
                  <div className={`circle ${(trackingOrder.order_status === 'Processing' || trackingOrder.order_status === 'Out for Delivery' || trackingOrder.order_status === 'Delivered') ? 'filled' : ''}`}></div>
                  <div className="step-content"><h4>Out for Delivery</h4></div>
                </li>

                <li className={`timeline-step ${trackingOrder.order_status === 'Delivered' ? 'completed current' : ''}`}>
  <div className={`circle ${trackingOrder.order_status === 'Delivered' ? 'filled' : ''}`}></div>
  <div className="step-content">
    <h4>{trackingOrder.order_status === 'Delivered' ? 'Delivered' : 'Delivery'}</h4>
    {trackingOrder.order_status === 'Delivered' ? (
      <p>Delivered on {new Date(trackingOrder.delivered_date || new Date()).toLocaleDateString()}</p>
    ) : (
      <p>Expected by {new Date(new Date(trackingOrder.date).setDate(new Date(trackingOrder.date).getDate() + 10)).toLocaleDateString()}</p>
    )}
  </div>
</li>


              </ul>

            )}
            <button className="close-bbtn" onClick={closeTrackingPopup}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;
