

import React, { useState, useEffect, useCallback } from "react";
import { initialInventory } from "./inventory";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faClock,
  faTimesCircle,
  faUndo,
  faSearch,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";

import "../styles/order.css";

const getProductTotal = (productId, quantity) => {
  const product = initialInventory.find(p => p.id === productId);
  if (!product) return "0.00";
  const price = parseFloat(product.price.replace('$', ''));

  return (price * quantity).toFixed(2);
};

const formatProducts = (products) => {
  return products.map(p => {
    return p.name ? `${p.name} (${p.quantity}) ` : 'Unknown Product';
  }).join(', ');
};

const orderStatusOptions = ["All", "Shipped", "Processing", "Cancelled", "Pending", "Delivered", "Returned"];

const getPaymentStatusDetails = (status) => {
  if (!status) return { className: "", icon: null };
  switch (status.toLowerCase()) {
    case "paid":
      return { className: "status-paid", icon: faCheckCircle};
    case "pending":
      return { className: "status-pending", icon: faClock };
    case "failed":
      return { className: "status-failed", icon: faTimesCircle };
    case "refunded":
      return { className: "status-refunded", icon: faUndo};
    default:
      return { className: "", icon: null };
  }
};

const getOrderStatusClass = (status) => {
  if (!status) return "";
  switch (status.toLowerCase()) {
    case "shipped":
      return "status-shipped";
    case "processing":
      return "status-processing";
    case "cancelled":
      return "status-cancelled";
    case "pending":
      return "status-pending";
    case "delivered":
      return "status-delivered";
    case "returned":
      return "status-returned";
    default:
      return "";
  }
};

const OrderPage = () => {
  const [ordersData, setOrdersData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/orders', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      if (!response.ok) {
        console.error('Failed to fetch orders:', response.statusText);
        return;
      }
      const data = await response.json();
      setOrdersData(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      // Use 'order_status' instead of 'orderStatus' to match backend field
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ order_status: newStatus }),
      });
      if (!response.ok) {
        console.error('Failed to update order status:', response.statusText);
        return;
      }
      const result = await response.json();
      console.log('Order status updated:', result);
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  }, [fetchOrders]);

  // New function to map shipment status to order status
  const mapShipmentStatusToOrderStatus = (shipmentStatus) => {
    if (!shipmentStatus) return '';
    const status = shipmentStatus.toLowerCase();
    switch (status) {
      case 'added to shipment':
      case 'shipped':
        return 'shipped';
      case 'intransit':
        return 'processing';
      case 'delayed':
        return 'pending';
      case 'delivered':
        return 'delivered';
      default:
        return '';
    }
  };

  useEffect(() => {
    fetchOrders();

    // Add event listener for orderStatusUpdated to refresh orders automatically
    const handleOrderStatusUpdated = (event) => {
      console.log('Order status updated event received:', event.detail);
      fetchOrders();
    };
    window.addEventListener('orderStatusUpdated', handleOrderStatusUpdated);

    return () => {
      window.removeEventListener('orderStatusUpdated', handleOrderStatusUpdated);
    };
  }, [fetchOrders]);

  useEffect(() => {
    // Poll orders every 10 seconds to reflect backend order status updates
    const intervalId = setInterval(() => {
      fetchOrders();
    }, 10000);

    // Initial fetch
    fetchOrders();

    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  const filteredOrders = Array.isArray(ordersData) ? ordersData.filter((order) => {
    const matchesSearch =
      String(order.order_id).toLowerCase().includes(searchQuery.toLowerCase());

    const orderStatusRaw = order.orderStatus || order.order_status || "";
    const normalizedOrderStatus = orderStatusRaw.trim().toLowerCase();
    const normalizedFilterStatus = filterStatus ? filterStatus.trim().toLowerCase() : "";

    const matchesFilter = normalizedFilterStatus === "all" || normalizedOrderStatus === normalizedFilterStatus;

    return matchesSearch && matchesFilter;
  }) : [];

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="order-container">
      <h2>Orders</h2>

      <div className="order-controls">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} className="search-i" />
          <input
            type="text"
            placeholder="Search by Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="input-icon-groupp">
          <FontAwesomeIcon icon={faFilter} className="input-icon" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filterr-select"
          >
            {orderStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Products</th>
            <th>Delivery Address</th>
            <th>Date</th>
            <th>Price</th>
            <th>Payment Method</th>
            <th>Payment Status</th>
            <th>GST (8%)</th>
            <th>Total</th>
            <th>Order Status</th>
          </tr>
        </thead>
        <tbody>
          {currentOrders.map((order) => {
            const totalPrice = Array.isArray(order.products) ? order.products.reduce((sum, p) => sum + parseFloat(getProductTotal(p.id, p.quantity)), 0) : 0;

            const orderStatusKeyRaw = order.orderStatus || order.order_status || '';
            const orderStatusKey = orderStatusKeyRaw.toLowerCase();
            const orderStatusClass = getOrderStatusClass(orderStatusKey);

            // Determine payment status based on order status and payment method
            let paymentStatusKey = order.payment_status || '';
            const paymentMethodLower = order.payment_method ? order.payment_method.toLowerCase() : '';
            if (orderStatusKey === "delivered") {
              paymentStatusKey = "paid";
            } else if (orderStatusKey === "cancelled") {
              paymentStatusKey = "failed";
            } else if (paymentMethodLower === 'cash on delivery') {
              paymentStatusKey = "pending";
            } else if (paymentMethodLower.includes('upi')) {
              paymentStatusKey = "paid";
            }

            let paymentStatusDetails = getPaymentStatusDetails(paymentStatusKey);
            let paymentClassName = paymentStatusDetails.className;
            let paymentIcon = paymentStatusDetails.icon;
            let paymentStatusText = paymentStatusKey;

            if (orderStatusKey === "cancelled") {
              paymentStatusText = "Failed";
              paymentClassName = "status-failed";
              paymentIcon = faTimesCircle;
            }

            return (
              <tr key={order.id}>
                <td>{order.order_id ? order.order_id : order.id}</td>
                <td>
                  {Array.isArray(order.products) && order.products.length > 0 ? (
                    order.products.map(p => {
                      // Use product name from order data directly to avoid mismatch
                      const productName = p.name || p.product_name || 'Unknown Product';
                      const quantity = p.quantity || 1;
                      return (
                        <div key={p.id}>
                          {`${productName} (${quantity})`}
                        </div>
                      );
                    })
                  ) : (
                    'No products'
                  )}
                </td>
                <td>
                  {order.delivery_address ? (
                    typeof order.delivery_address === 'string' ? (
                      <div>
                        <div>{order.delivery_address}</div>
                        {(() => {
                          const emailMatch = order.delivery_address.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                          return emailMatch ? <div className="customer-email">{emailMatch[0]}</div> : null;
                        })()}
                      </div>
                    ) : (
                      <div className="delivery-address">
                        <div className="customer-name">{order.delivery_address.fullname || order.delivery_address.name}</div>
                        <div>{order.delivery_address.house || order.delivery_address.address}</div>
                        {order.delivery_address.road && <div>{order.delivery_address.road}</div>}
                        <div>{order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.pincode || order.delivery_address.zip}</div>
                        <div className="customer-phone">{order.delivery_address.phone}</div>
                        {/* {order.delivery_address.email && <div className="customer-email">{order.delivery_address.email}</div>} */}
                        {order.delivery_address.notes && <div className="delivery-notes">Notes: {order.delivery_address.notes}</div>}
                      </div>
                    )
                  ) : (
                    <div>No delivery address provided</div>
                  )}
                </td>
                <td>{order.date}</td>
                <td>
                  {order.price && !isNaN(parseFloat(order.price)) ? `$${parseFloat(order.price).toFixed(2)}` : Array.isArray(order.products) ? order.products.map(p => {
                    return p.price ? `$${p.price}` : 'Unknown Price';
                  }).join(', ') : 'Unknown Price'}
                </td>
                <td>{order.payment_method ? order.payment_method : order.paymentMethod}</td>
                <td className={paymentClassName}>
                  <FontAwesomeIcon icon={paymentIcon} className="status-icon" /> {paymentStatusText}
                </td>
                <td>
                  {order.gst && !isNaN(parseFloat(order.gst)) ? `$${parseFloat(order.gst).toFixed(2)}` : `$${(totalPrice * 0.08).toFixed(2)}`}
                </td>
                <td>
                  {order.total && !isNaN(parseFloat(order.total)) ? `$${parseFloat(order.total).toFixed(2)}` : `$${(totalPrice * 1.08).toFixed(2)}`}
                </td>
                <td className={orderStatusClass}>
                  {orderStatusKeyRaw || 'Unknown'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="paginationO">
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
    </div>
  );
};

export default OrderPage;
