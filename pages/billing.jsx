import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OrderPage from './orders';
import { initialInventory } from './inventory'; // Import initialInventory for product details
import "../styles/bill.css"

const Modall = ({ children, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'var(--two)',
        padding: '20px 30px',

        borderRadius: '8px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90%',
        overflowY: 'auto',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            color: 'white',
            position: 'absolute',
            top: '0px',
            right: '0px',
            fontSize: '30px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          aria-label="Close"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

const BillingPage = () => {
  const [orderDetails, setOrderDetails] = useState({
    invoiceNo: '',
    orderId: '',
    customerName: '',
    customerAddress: '',
    phone: '',
    productName: '',
    productPrice: 0,
    quantity: 0,
    paymentMethod: '',
    gstRate: 8,
  });


  // New state to hold all orders for dropdown
  const [allOrders, setAllOrders] = useState([]);

  // New state for previous bills and shipments fetched from backend
  const [fetchedBills, setFetchedBills] = useState([]);
  const [fetchedShipments, setFetchedShipments] = useState([]);

  useEffect(() => {
    // Fetch all orders for dropdown
    const fetchAllOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch('http://localhost:5000/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) return;
        const data = await response.json();
        setAllOrders(data);
      } catch (error) {
        console.error('Error fetching orders for dropdown:', error);
      }
    };

    // Fetch previous bills from backend
    const fetchBills = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch('http://localhost:5000/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) return;
        const data = await response.json();
        setFetchedBills(data);
      } catch (error) {
        console.error('Error fetching previous bills:', error);
      }
    };

    // Fetch shipments from backend
    const fetchShipments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch('http://localhost:5000/api/shipments', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) return;
        const data = await response.json();
        setFetchedShipments(data);
      } catch (error) {
        console.error('Error fetching shipments:', error);
      }
    };

    fetchAllOrders();
    fetchBills();
    fetchShipments();
  }, []);

  // New state for validation errors
  const [validationErrors, setValidationErrors] = useState({});

  const validateOrderDetails = () => {
    const {
      invoiceNo,
      orderId,
      customerName,
      customerAddress,
      phone,
      productName,
      productPrice,
      quantity,
      paymentMethod,
    } = orderDetails;

    if (
      !invoiceNo.trim() ||
      !orderId.trim() ||
      !customerName.trim() ||
      !customerAddress.trim() ||
      !phone.trim() ||
      !productName.trim() ||
      productPrice <= 0 ||
      quantity <= 0 ||
      !paymentMethod.trim()
    ) {
      return false;
    }
    return true;
  };


  const [shipmentDetails, setShipmentDetails] = useState({
    shipmentId: '',
    orderId: '',
    customerName: '',
    fromLocation: '',
    toLocation: '',
    trackingNumber: '',
    carrier: '',
    shipmentDate: '',
    estimatedDelivery: '',
    shipmentStatus: 'Pending',
  });

  const [totalPrice, setTotalPrice] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Set shipmentId automatically when shipment modal is shown
  useEffect(() => {
    if (showModal) {
      const nextId = generateNextShipmentId();
      setShipmentDetails(prev => ({ ...prev, shipmentId: nextId }));
    }
  }, [showModal]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Initialize previous bills as empty array; will add bills dynamically after submission
  const [previousBills, setPreviousBills] = useState([]);

  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [shipmentOrderSearchQuery, setShipmentOrderSearchQuery] = useState('');


  const [shipmentList, setShipmentList] = useState([]);

  const generateNextShipmentId = () => {
    if (fetchedShipments.length === 0) return "0001";
    // Extract shipmentIds and find max
    const shipmentIds = fetchedShipments.map(s => parseInt(s.shipmentId, 10)).filter(id => !isNaN(id));
    const maxId = shipmentIds.length > 0 ? Math.max(...shipmentIds) : 0;
    const nextId = (maxId + 1).toString().padStart(4, "0");
    return nextId;
  };

  const handleAddShipment = () => {
    // Add current shipment to the list
    setShipmentList([...shipmentList, shipmentDetails]);

    // Generate and set the next ID
    const nextId = generateNextShipmentId();
    setShipmentDetails({ ...shipmentDetails, shipmentId: nextId });
  };


  useEffect(() => {
    const price = orderDetails.productPrice * orderDetails.quantity;
    const gst = (price * orderDetails.gstRate) / 100;
    const total = price + gst;

    setTotalPrice(price);
    setGstAmount(gst);
    setTotalAmount(total);
  }, [orderDetails.productPrice, orderDetails.quantity]);

  // Sync shipmentList and previousBills from localStorage on component mount
  useEffect(() => {
    const storedShipmentList = localStorage.getItem('shipmentList');
    if (storedShipmentList) {
      setShipmentList(JSON.parse(storedShipmentList));
    }
    const storedPreviousBills = localStorage.getItem('previousBills');
    if (storedPreviousBills) {
      setPreviousBills(JSON.parse(storedPreviousBills));
    }
  }, []);

  const generateInvoiceNo = () => {
    // Instead of using current invoiceNo, find max invoice number from previousBills and fetchedBills to avoid duplicates
    const allInvoices = [...previousBills, ...fetchedBills];
    let maxNumber = 0;
    allInvoices.forEach(bill => {
      if (bill.invoiceNo) {
        const parts = bill.invoiceNo.split('-');
        if (parts.length === 2) {
          const num = parseInt(parts[1], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    });
    const newNumber = maxNumber + 1;
    return 'INV-' + newNumber.toString().padStart(4, '0');
  };

  const handleOrderSelect = (order) => {
    if (!order.delivery_address) {
      setOrderDetails({
        invoiceNo: orderDetails.invoiceNo || 'INV-0001',
        orderId: order.order_id,
        customerName: '',
        customerAddress: '',
        phone: '',
        productName: '',
        productPrice: 0,
        quantity: 0,
        paymentMethod: '',
        gstRate: 8,
      });
      setShowOrderDropdown(false);
      setOrderSearchQuery('');
      return;
    }

    let customerName = '';
    let customerAddress = '';
    let phone = '';

    if (typeof order.delivery_address === 'string') {
      // If delivery_address is a string, try to extract customerName and phone from it
      customerAddress = order.delivery_address;

      // Attempt to extract phone number (simple regex for digits, may be improved)
      const phoneMatch = order.delivery_address.match(/(\+?\d{7,15})/);
      phone = phoneMatch ? phoneMatch[0] : '';

      // Attempt to extract customer name assuming it's the first line or before phone
      // Split by commas or new lines
      const parts = order.delivery_address.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        // If phone found, remove it from parts
        const filteredParts = parts.filter(part => !part.includes(phone));
        customerName = filteredParts.length > 0 ? filteredParts[0] : '';
      } else {
        customerName = '';
      }
    } else if (typeof order.delivery_address === 'object' && order.delivery_address !== null) {
      // If delivery_address is an object, extract fields
      customerName = order.delivery_address.name || '';
      phone = order.delivery_address.phone || '';
      // Exclude name and phone from address string
      const { name, phone: phoneField, ...addressParts } = order.delivery_address;
      customerAddress = `${addressParts.address || ''}${addressParts.address2 ? ', ' + addressParts.address2 : ''}, ${addressParts.city || ''}, ${addressParts.state || ''} ${addressParts.zip || ''}`;
    }

    // Concatenate product names and sum prices and quantities from all products in the order
    let productNames = [];
    let totalPrice = 0;
    let totalQuantity = 0;

    if (Array.isArray(order.products)) {
      order.products.forEach(productInOrder => {
        const productInInventory = initialInventory.find(p => p.id === productInOrder.id);
        const name = productInInventory ? productInInventory.name : '';
        let price = productInInventory ? parseFloat(productInInventory.price.replace('$', '')) : 0;
        if (isNaN(price)) price = 0;
        const quantity = productInOrder?.quantity || 1;

        if (name) productNames.push(name);
        totalPrice += price * quantity;
        totalQuantity += quantity;
      });
    }

    const productName = productNames.join(', ');
    const productPrice = totalPrice;
    const quantity = totalQuantity;

    // Normalize payment method to match select options
    let normalizedPaymentMethod = '';
    if (order.payment_method) {
      const pm = order.payment_method.toLowerCase();
      if (pm.includes('upi')) {
        normalizedPaymentMethod = 'Upi';
      } else if (pm.includes('cash')) {
        normalizedPaymentMethod = 'Cash';
      } else if (pm.includes('credit')) {
        normalizedPaymentMethod = 'Credit Card';
      } else if (pm.includes('bank')) {
        normalizedPaymentMethod = 'Bank Transfer';
      } else {
        normalizedPaymentMethod = order.payment_method;
      }
    }

    setOrderDetails({
      invoiceNo: generateInvoiceNo(),
      orderId: order.order_id,
      customerName,
      customerAddress,
      phone,
      productName,
      productPrice,
      quantity,
      paymentMethod: normalizedPaymentMethod, // Set normalized payment method from order
      gstRate: 8,
    });

    setShowOrderDropdown(false);
    setOrderSearchQuery('');
  };

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysToDate = (dateString, days) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const handleShipmentOrderSelect = (order) => {
    console.log('handleShipmentOrderSelect called with order.order_id:', order.order_id);
    console.log('Current fetchedShipments:', fetchedShipments);

    // Use delivery_address instead of deliveryAddress for consistency with order object
    if (!order.delivery_address) {
      setShipmentDetails((prev) => ({
        ...prev,
        orderId: order.order_id,
        customerName: '',
        toLocation: '',
        fromLocation: '',
        estimatedDelivery: '', // Clear estimatedDelivery if no delivery address
      }));
      setShowOrderDropdown(false);
      setOrderSearchQuery('');
      return;
    }

    const deliveryAddress = order.delivery_address;

    // Construct address string depending on whether delivery_address is object or string
    let address = '';
    let customerName = '';
    if (typeof deliveryAddress === 'string') {
      address = deliveryAddress;

      // Attempt to extract customer name from address string (assume first line or before first comma)
      const parts = deliveryAddress.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      customerName = parts.length > 0 ? parts[0] : '';

    } else if (typeof deliveryAddress === 'object' && deliveryAddress !== null) {
      address = `${deliveryAddress.address || ''}${deliveryAddress.address2 ? ', ' + deliveryAddress.address2 : ''}, ${deliveryAddress.city || ''}, ${deliveryAddress.state || ''} ${deliveryAddress.zip || ''}`;
      customerName = deliveryAddress.name || '';
    }

    const productInOrder = order.products[0];
    let warehouseLocation = '';
    if (productInOrder) {
      const productInInventory = initialInventory.find(p => p.id === productInOrder.id);
      if (productInInventory && productInInventory.warehouse) {
        warehouseLocation = productInInventory.warehouse;
      }
    }

    // Use the date field from the order as the estimated delivery date, formatted for date input
    const estimatedDeliveryDate = addDaysToDate(order.date, 10);

    setShipmentDetails((prev) => ({
      ...prev,
      orderId: order.order_id,
      customerName: customerName,
      toLocation: address,
      fromLocation: warehouseLocation,
      estimatedDelivery: estimatedDeliveryDate,
    }));

    setShowOrderDropdown(false);
    setOrderSearchQuery('');
  };

  // ordersData removed because it is not defined
  // You may want to fetch orders data here or pass it as props
  const filteredOrders = [];

  const handleSubmit = async () => {
    try {
      // Generate fresh shipmentId from latest fetchedShipments before submission
      const freshShipmentId = generateNextShipmentId();

      // Prepare shipment data for API request with fresh shipmentId
      const shipmentData = { ...shipmentDetails, shipmentId: freshShipmentId };
      shipmentData.status = shipmentDetails.shipmentStatus || 'Pending';

      // Validate before submitting
      if (!validateOrderDetails()) {
        alert("Please fill all the fields correctly before submitting.");
        return;
      }

      // Validate shipmentDetails required fields
      const requiredShipmentFields = ['shipmentId', 'orderId', 'carrier', 'trackingNumber', 'status', 'shipmentDate', 'estimatedDelivery', 'fromLocation', 'toLocation', 'customerName'];
      for (const field of requiredShipmentFields) {
        let value = shipmentData[field];
        if (field === 'status') {
          value = shipmentData.shipmentStatus;
        }
        if (!value || value.toString().trim() === '') {
          alert(`Please fill the shipment field: ${field}`);
          return;
        }
      }

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authorization token is missing. Please login again.');
        return;
      }

      console.log('Submitting shipment data:', shipmentData);

      // Remove shipmentStatus from shipmentData before sending
      const { shipmentStatus, ...shipmentDataToSend } = shipmentData;

      const shipmentResponse = await axios.post('http://localhost:5000/api/shipments', shipmentDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!shipmentResponse || shipmentResponse.status < 200 || shipmentResponse.status >= 300) {
        alert('Failed to add shipment. Please try again.');
        return;
      }

      // Also add shipment details to shipmentList state and sync to localStorage
      const newShipmentList = [
        ...shipmentList,
        { ...shipmentData }
      ];
      setShipmentList(newShipmentList);
      localStorage.setItem('shipmentList', JSON.stringify(newShipmentList));

      alert('Shipment added successfully!');

      // Update fetchedShipments state to include the new shipment to avoid duplicate shipmentId
      setFetchedShipments(prev => [...prev, shipmentData]);

      // Add current billing summary to previousBills state for history
      setPreviousBills(prev => {
        const newBills = [...prev, { 
          ...orderDetails,
          totalPrice,
          gstAmount,
          totalAmount
        }];
        localStorage.setItem('previousBills', JSON.stringify(newBills));
        // Generate next invoice number after adding new bill
        const nextInvoiceNo = generateInvoiceNo();
        // Reset orderDetails with next invoice number and clear all input fields
        setOrderDetails({
          invoiceNo: nextInvoiceNo,
          orderId: '',
          customerName: '',
          customerAddress: '',
          phone: '',
          productName: '',
          productPrice: 0,
          quantity: 0,
          paymentMethod: '',
          gstRate: 8,
        });
        return newBills;
      });

      // Reset shipmentDetails to initial empty state for next shipment
      setShipmentDetails({
        shipmentId: '',
        orderId: '',
        customerName: '',
        fromLocation: '',
        toLocation: '',
        trackingNumber: '',
        carrier: '',
        shipmentDate: '',
        estimatedDelivery: '',
        shipmentStatus: 'Pending',
      });

      // Reset totals
      setTotalPrice(0);
      setGstAmount(0);
      setTotalAmount(0);

      // Close the billing summary modal after submission
      setShowModal(false);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        alert(`Error processing shipment: ${error.response.data.message || error.message}`);
      } else {
        alert('There was an error processing the shipment.');
      }
      if (error.response && error.response.status === 401) {
        alert('Unauthorized. Please login again.');
      }
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const receiptStyle = `
 .recipt {
  width: 600px;
  margin: 40px auto;
  margin-top:20px;
  padding: 30px;
  // background:rgb(255, 0, 0);
  border: 1px solid #000000;
  border-radius: 10px;
  font-family: 'Poppins', sans-serif;
  color: #333;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.recipt-header {
  background-color: #3b5998; /* Deep Blue */
  margin-top:-50px
  color: #fff;
  text-align: center;
  padding: 25px 20px;
  border-radius: 10px 10px 0 0;
}

.recipt-header h2 {
  margin: 0;
  font-size: 30px;
  letter-spacing: 1px;
}

.recipt-header p {
  margin: 5px 0;
  font-size: 15px;
}

.recipt-section {
  margin: 20px 0;
  padding: 12px;
  background-color: #e0f7fa; /* Light Teal */
  border-radius: 6px;
}

.recipt-section strong {
  display: inline-block;
  width: 100px;
  color: #00796b; /* Darker Teal */
  font-weight: 600;
    white-space: pre-wrap;
  font-size: 11px;
  line-height: 1.4;
  margin: 0;
  margin-left: 0px;
  word-break: break-word;
}

.recipt-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  overflow: hidden;
  border-radius: 8px;
}

.recipt-table th {
  background-color: #ffeb3b; /* Pastel Yellow */
  color: #333;
  font-weight: bold;
  padding: 14px;
  border: 1px solid #ddd;
  font-size: 16px;
}

.recipt-table td {
  padding: 12px;
  border: 1px solid #ddd;
  text-align: center;
  background-color: #fafafa;
  transition: background 0.3s;
}

.recipt-table tr:hover td {
  background-color: #ffe082; /* Light pastel yellow on hover */
}

.recipt-total {
  text-align: right;
  margin-top: 20px;
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  font-size: 18px;
}

.recipt-total hr {
  margin: 10px 0;
  border: none;
  border-top: 1px solid #bbb;
}

.receipt-footer {
  margin-top: 30px;
  text-align: center;
  font-size: 14px;
  color: #666;
  font-style: italic;
}



/* Print friendly */
@media print {
  .invoice {
    box-shadow: none;
    border: 1px solid black;
    margin: 0;
    width: 100%;
    padding: 0;
  }
}

   ` ;
    const content = `
     <div class="recipt">
  <div class="recipt-header">
    <h2>LogiGo Pvt. Ltd</h2>
    <p>No.42, Warehouse Road, Logistics Park, Sector 8</p>
    <p>Phone: +918921252868</p>
    <p>GSTIN No: 27AAACL1234C1ZV</p>
  </div> 

  <div class="recipt-section">
    <strong>Invoice No:</strong> ${orderDetails.invoiceNo}<br>
    <strong>Order ID:</strong> ${orderDetails.orderId}<br>
<strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
  </div>

  <div class="recipt-section">
    <strong>Customer:</strong> ${orderDetails.customerName}<br>
    <strong>Phone:</strong> ${orderDetails.phone}<br>
    <strong>Address:</strong> ${orderDetails.customerAddress}
  </div>

  <table class="recipt-table">
    <thead>
      <tr>
        <th>Product</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Amount</th>
        <th>Payment Method </th> 
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${orderDetails.productName}</td>
        <td>${orderDetails.quantity}</td>
        <td>₹${orderDetails.productPrice}</td>
        <td>₹${totalPrice}</td>
        <td>${orderDetails.paymentMethod}</td>
      </tr>
    </tbody>
 

  </table>

  <div class="recipt-total">
    Subtotal: ₹${totalPrice} <br>
    GST (8%): ₹${gstAmount.toFixed(2)} <br>
    <hr>
    TOTAL: ₹${totalAmount.toFixed(2)}
  </div>


  <div class="receipt-footer">
    Thank you for your purchase!
  </div>
</div>

    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice</title>
<style>
            ${receiptStyle}
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${content}
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handlePrintShipmentLabel = () => {
    const printWindow = window.open('', '_blank');
    const shipmentLabelStyles = `
      .shipment-label {
        width: 400px;
        padding: 70px;
        margin: 20px auto;
        margin-top:100px;
        border: 2px solid #333;
        border-radius: 8px;
        font-family: 'Arial', sans-serif;
        font-size: 12px;
        color: #333;
        background-color: #fff;
      }
      .label-header {
        text-align: center;
        margin-bottom: 15px;
        margin-top:-40px;
      }
      .label-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: bold;
      }
      .label-header p {
        margin: 2px 0;
        font-size: 12px;
      }
      .label-section {
        margin-bottom: 12px;
        line-height: 1.5;
       
      
      }
      .label-section strong {
        display: inline-block;
        width: 130px;
          white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.4;
 
  margin-left: -40px;
  word-break: break-word;
      }
      .label-footer {
        margin-top: 20px;
        text-align: center;
        font-style: italic;
        font-size: 12px;
        color: #555;
        border-top: 1px dashed #aaa;
        padding-top: 10px;
      }
    `;
    const content = `
      <div class="shipment-label">
        <div class="label-header">
          <h2>LogiGo Pvt. Ltd - Shipment Label</h2>
          <p>No.42, Warehouse Road, Logistics Park, Sector 8</p>
          <p>Phone: +918921252868</p>
        </div>
  
        <div class="label-section">
          <strong>Shipment ID:</strong> ${shipmentDetails.shipmentId}<br>
          <strong>Order ID:</strong> ${shipmentDetails.orderId}<br>
          
          <strong>Shipment Date:</strong> ${shipmentDetails.shipmentDate}<br>
          <strong>Estimated Delivery:</strong> ${shipmentDetails.estimatedDelivery}<br>
          <strong>Status:</strong> ${shipmentDetails.shipmentStatus}
        </div>
  
        <div class="label-section">
          <strong>Carrier:</strong> ${shipmentDetails.carrier}<br>
          <strong>Tracking Number:</strong> ${shipmentDetails.trackingNumber}
        </div>
  
        <div class="label-section">
          <strong>From:</strong><br>
          ${shipmentDetails.fromLocation}
        </div>
  
        <div class="label-section">
          <strong>To:</strong><br>
          ${shipmentDetails.customerName}<br>
          ${shipmentDetails.toLocation}
        </div>
  
        <div class="label-footer">
          Handle with care. Thank you for choosing LogiGo.
        </div>
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Shipment Label</title>
          <style>
            ${shipmentLabelStyles}
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${content}
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className='bill'>
      <h1>Billing Page</h1>
      <form>
        {/* Removed onSubmit handler from form */}
        <div className='invoice'>
          <div className='invoice-ip'>
            <label>Order ID:</label>
            <input
              type="text"
              value={orderDetails.orderId}
              onChange={(e) => {
                const enteredOrderId = e.target.value;
                setOrderDetails({ ...orderDetails, orderId: enteredOrderId });
                setShowOrderDropdown(true);
                setOrderSearchQuery(enteredOrderId);

                // Autofill all fields if order_id matches an order
                const matchedOrder = allOrders.find(order => order.order_id.toString() === enteredOrderId);
                if (matchedOrder) {
                  handleOrderSelect(matchedOrder);
                }
              }}
              onFocus={() => setShowOrderDropdown(true)}
              onBlur={() => {
                setTimeout(() => setShowOrderDropdown(false), 200);
              }}
              autoComplete="off"
            />
            {showOrderDropdown && (
              <div className='drop-or'>
                {allOrders.length > 0 ? (
                  // Filter out orders that are already added to shipmentList or fetchedShipments
                  (orderSearchQuery === '' ? allOrders : allOrders.filter(order => order.order_id.toString().includes(orderSearchQuery)))
                    .filter(order => {
                      const orderId = order.order_id;
                      const inShipmentList = shipmentList.some(shipment => shipment.orderId === orderId);
                      const inFetchedShipments = fetchedShipments.some(shipment => shipment.orderId === orderId);
                      return !inShipmentList && !inFetchedShipments;
                    })
                    .map((order) => (
                      <div
                        key={order.order_id}
                        onClick={() => handleOrderSelect(order)}
                        style={{ padding: '10px', cursor: 'pointer', marginTop: '10px', borderBottom: '1px solid black' }}
                      >
                        {order.order_id}
                      </div>
                    ))
                ) : (
                  <div style={{ padding: '5px' }}>No orders found</div>
                )}
              </div>
            )}

            <label>Invoice No:</label>
            <input
              type="text"
              value={orderDetails.invoiceNo}
              onChange={(e) => setOrderDetails({ ...orderDetails, invoiceNo: e.target.value })}
            />
            {/* Show error message */}
            {validationErrors.invoiceNo && <div className="error-message">{validationErrors.invoiceNo}</div>}

            <label>Customer Name:</label>
            <input
              type="text"
              value={orderDetails.customerName}
              onChange={(e) => setOrderDetails({ ...orderDetails, customerName: e.target.value })}
            />
            {validationErrors.customerName && <div className="error-message">{validationErrors.customerName}</div>}

            <label>Phone:</label>
            <input
              type="tel"
              value={orderDetails.phone}
              onChange={(e) => setOrderDetails({ ...orderDetails, phone: e.target.value })}
            />
            {validationErrors.phone && <div className="error-message">{validationErrors.phone}</div>}

            <label>Customer Address:</label>
            <textarea
              type="text"
              value={orderDetails.customerAddress}
              onChange={(e) => setOrderDetails({ ...orderDetails, customerAddress: e.target.value })}
            />
            {validationErrors.customerAddress && <div className="error-message">{validationErrors.customerAddress}</div>}

            <label>Product Name:</label>
            <input
              type="text"
              value={orderDetails.productName}
              onChange={(e) => setOrderDetails({ ...orderDetails, productName: e.target.value })}
            />
            {validationErrors.productName && <div className="error-message">{validationErrors.productName}</div>}

            <label>Product Price:</label>
            <input
              type="number"
              value={orderDetails.productPrice}
              onChange={(e) => setOrderDetails({ ...orderDetails, productPrice: parseFloat(e.target.value) })}
            />
            {validationErrors.productPrice && <div className="error-message">{validationErrors.productPrice}</div>}

            <label>Quantity:</label>
            <input
              type="number"
              value={orderDetails.quantity}
              onChange={(e) => setOrderDetails({ ...orderDetails, quantity: parseInt(e.target.value) })}
            />
            {validationErrors.quantity && <div className="error-message">{validationErrors.quantity}</div>}

            <label>Payment Method:</label>
            <select className='pay-op'
              value={orderDetails.paymentMethod}
              onChange={(e) => setOrderDetails({ ...orderDetails, paymentMethod: e.target.value })}
            >
              <option value="Credit Card">Credit Card</option>
              <option value="Cash">Cash on delivery</option>
              <option value="Upi">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
            {validationErrors.paymentMethod && <div className="error-message">{validationErrors.paymentMethod}</div>}
          </div>

          <button className='ok-op'
            type="button"
            onClick={() => {
              if (validateOrderDetails()) {
                setShowModal(true);
              } else {
                alert("Please fill all the fields");
              }
            }}
            style={{ marginBottom: '10px' }}
          >
            Proceed to shipment
          </button>

          <button className='history-btn'
            type="button"
            onClick={() => setShowHistoryModal(true)}
            style={{ marginLeft: '10px', marginBottom: '10px' }}
          >
            History
          </button>
        </div>
      </form>

      {showModal && (
        <Modall onClose={() => setShowModal(false)}>
          <div className='bill-sum'>
            <h2>Billing Summary</h2>
            {console.log('Billing Summary orderDetails:', orderDetails)}

            <table className='summary-table'>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                            <tr>
                              <td>Invoice No</td>
                              <td>{orderDetails.invoiceNo}</td>
                            </tr>
                <tr>
                  <td>Order ID</td>
                  <td>{orderDetails.orderId}</td>
                </tr>
                <tr>
                  <td>Customer Name</td>
                  <td>{orderDetails.customerName}</td>
                </tr>

                <tr>
                  <td>Phone</td>
                  <td>{orderDetails.phone}</td>
                </tr>
                <tr>
                  <td>Address</td>
                  <td>
                    <pre style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '13px',
                      lineHeight: '1.4',

                      margin: '0',
                      marginLeft: '0px',
                      width: '150px',
                      wordBreak: 'break-word'
                    }}>
                      {orderDetails.customerAddress}
                    </pre>
                  </td>
                </tr>
                <tr>
                  <td>Product</td>
                  <td>{orderDetails.productName}</td>
                </tr>
                <tr>
                  <td>Quantity</td>
                  <td>{orderDetails.quantity}</td>
                </tr>
                <tr>
                  <td>Rate</td>
                  <td>{`₹${orderDetails.productPrice}`}</td>
                </tr>
                <tr>
                  <td>Payment Method</td>
                  <td>{orderDetails.paymentMethod}</td>
                </tr>
                <tr>
                  <td>Subtotal</td>
                  <td>{`₹${orderDetails.productPrice * orderDetails.quantity}`}</td>
                </tr>
                <tr>
                  <td>GST (8%)</td>
                  <td>{`₹${((orderDetails.productPrice * orderDetails.quantity) * 0.08).toFixed(2)}`}</td>
                </tr>
                <tr>
                  <td>Total</td>
                  <td><strong>{`₹${((orderDetails.productPrice * orderDetails.quantity) * 1.08).toFixed(2)}`}</strong></td>
                </tr>
              </tbody>
            </table>


            <div className='ship-he'>
              <h3>Shipment Details</h3>
            </div>

            <div className='shipment-form'>

              <div>
                <label>Shipment ID:</label>
                <input
                  type="text"
                  value={shipmentDetails.shipmentId}
                  readOnly
                />
              </div>

              <div style={{ position: 'relative' }}>
                <label>Order ID:</label>
                <input
                  type="text"
                  value={shipmentDetails.orderId}
                  onChange={(e) => {
                    const newOrderId = e.target.value;
                    setShipmentDetails({ ...shipmentDetails, orderId: newOrderId });

                    // Autofill shipment details if orderId matches an order
                    const matchedOrder = allOrders.find(order => order.order_id.toString() === newOrderId);
                    if (matchedOrder) {
                      handleShipmentOrderSelect(matchedOrder);
                    }

                    setShowOrderDropdown(true);
                    setShipmentOrderSearchQuery(newOrderId);
                  }}
                  onFocus={() => setShowOrderDropdown(true)}
                  onBlur={() => setTimeout(() => setShowOrderDropdown(false), 200)}
                  autoComplete="off"
                />
                {showOrderDropdown && (
                  <div style={{ position: 'absolute', backgroundColor: 'white', border: '1px solid #ccc', maxHeight: '150px', overflowY: 'auto', width: '100%', zIndex: 1000 }}>
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={shipmentOrderSearchQuery}
                    onChange={(e) => setShipmentOrderSearchQuery(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '5px' }}
                  />
                  {allOrders.length > 0 ? (
                    (shipmentOrderSearchQuery === '' ? allOrders : allOrders.filter(order => order.order_id.toString().includes(shipmentOrderSearchQuery)))
                      .filter(order => {
                        const orderId = order.order_id;
                        const inShipmentList = shipmentList.some(shipment => shipment.orderId === orderId);
                        const inFetchedShipments = fetchedShipments.some(shipment => shipment.orderId === orderId);
                        return !inShipmentList && !inFetchedShipments;
                      })
                      .map((order) => (
                        <div
                          key={order.order_id}
                          onClick={() => {
                            handleShipmentOrderSelect(order);
                            setShowOrderDropdown(false);
                            setShipmentOrderSearchQuery('');
                          }}
                          style={{ padding: '5px', cursor: 'pointer' }}
                        >
                          {order.order_id} - {order.delivery_address?.name || 'No Name'}
                        </div>
                      ))
                  ) : (
                    <div style={{ padding: '5px' }}>No orders found</div>
                  )}
                </div>
              )}
              </div>

              <div>
                <label>Customer Name:</label>
                <input
                  type="text"
                  value={shipmentDetails.customerName}
                  onChange={(e) => setShipmentDetails({ ...shipmentDetails, customerName: e.target.value })}
                />
              </div>
              <div>
                <label>From Location:</label>
                <input
                  type="text"
                  value={shipmentDetails.fromLocation}
                  onChange={(e) => setShipmentDetails({ ...shipmentDetails, fromLocation: e.target.value })}
                />
              </div>
              <div>
                <label>To Location:</label>
                <textarea
                  type="text"
                  value={shipmentDetails.toLocation}
                  onChange={(e) => setShipmentDetails({ ...shipmentDetails, toLocation: e.target.value })}
                />
              </div>
              <div>
                <label>Carrier:</label>
                <input
                  type="text"
                  value={shipmentDetails.carrier}
                  onChange={(e) => {
                    const newCarrier = e.target.value;
                    const generatedTrackingNumber = `${newCarrier.replace(/\s+/g, '').toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

                    setShipmentDetails({
                      ...shipmentDetails,
                      carrier: newCarrier,
                      trackingNumber: generatedTrackingNumber, // Auto-update tracking number
                    });
                  }}
                />
              </div>

              <div>
                <label>Tracking Number:</label>
                <input
                  type="text"
                  value={shipmentDetails.trackingNumber}
                  readOnly // Optional: make read-only since it's auto-generated
                />
              </div>


              <div>
                <label>Shipment Date:</label>
                <input
                  type="date"
                  value={shipmentDetails.shipmentDate}
                  onChange={(e) => setShipmentDetails({ ...shipmentDetails, shipmentDate: e.target.value })}
                />
              </div>
              <div>
                <label>EST Delivery:</label>
                <input
                  type="date"
                  value={shipmentDetails.estimatedDelivery}
                  onChange={(e) => setShipmentDetails({ ...shipmentDetails, estimatedDelivery: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button className='add-to-ship1' type="button" onClick={handleSubmit}>
            Add to Shipment
          </button>

          <button className='add-to-ship2' type="button" onClick={handlePrint} style={{ marginLeft: '10px' }}>
            Print Receipt
          </button>

          <button className='add-to-ship3' type="button" onClick={handlePrintShipmentLabel} style={{ marginLeft: '10px' }}>
            Print Shipment Label
          </button>
        </Modall>
      )}

      {showHistoryModal && (
        <Modall onClose={() => setShowHistoryModal(false)}>
          <div className='bill-sum'>
            <h2>Previous Bills History</h2>
            {(previousBills.length === 0 && fetchedBills.length === 0) ? (
              <p>No previous bills found.</p>
            ) : (
              <>
                <p>Showing billing summaries:</p>
{(previousBills.length > 0 ? previousBills : fetchedBills)
  .filter(bill => fetchedShipments.some(s => s.orderId === bill.orderId))
  .map((bill, index) => {
    // Calculate subtotal, gst, and total for fetchedBills if not present
    const subtotal = bill.totalPrice !== undefined ? bill.totalPrice : (bill.productPrice || 0) * (bill.quantity || 0);
    const gst = bill.gstAmount !== undefined ? bill.gstAmount : subtotal * 0.08;
    const total = bill.totalAmount !== undefined ? bill.totalAmount : subtotal + gst;

    return (
      <div key={index} style={{ marginBottom: '30px', borderBottom: '1px solid #ccc', paddingBottom: '20px' }}>
        <h3>Invoice No: {bill.invoiceNo || bill.orderId}</h3>
        <table className='summary-table'>
          <thead>
            <tr>
              <th>Field</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Invoice No</td>
              <td>{bill.invoiceNo || ''}</td>
            </tr>
            <tr>
              <td>Order ID</td>
              <td>{bill.orderId}</td>
            </tr>
            <tr>
              <td>Customer Name</td>
              <td>{bill.customerName || ''}</td>
            </tr>

            <tr>
              <td>Phone</td>
              <td>{bill.phone || ''}</td>
            </tr>
            <tr>
              <td>Address</td>
              <td>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: '11px',
                  lineHeight: '1.4',
                  margin: '0',
                  marginLeft: '0px',
                  width: '130px',
                  wordBreak: 'break-word'
                }}>
                  {bill.deliveryAddress || bill.customerAddress || ''}
                </pre>
              </td>
            </tr>
            <tr>
              <td>Product</td>
              <td>{bill.productName || ''}</td>
            </tr>
            <tr>
              <td>Quantity</td>
              <td>{bill.quantity || ''}</td>
            </tr>
            <tr>
              <td>Rate</td>
              <td>{`₹${bill.productPrice || ''}`}</td>
            </tr>
            <tr>
              <td>Payment Method</td>
              <td>{bill.paymentMethod || ''}</td>
            </tr>
            <tr>
              <td>Subtotal</td>
              <td>{`₹${subtotal.toFixed(2)}`}</td>
            </tr>
            <tr>
              <td>GST (8%)</td>
              <td>{`₹${gst.toFixed(2)}`}</td>
            </tr>
            <tr>
              <td>Total</td>
              <td><strong>{`₹${total.toFixed(2)}`}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  })}
              </>
            )}
          </div>
        </Modall>
      )}
    </div>
  );
};

export default BillingPage;
