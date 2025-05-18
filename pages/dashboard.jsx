import React, { useState, useEffect, useCallback } from 'react';
import '../styles/dash.css';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement
} from 'chart.js';

import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage'; // We'll create this utility function below

import OrderPage from './orders';
import { initialInventory } from './inventory';
// Removed import of initialFleetData because it does not exist in './fleet'
import { color } from 'chart.js/helpers';

// Register the components once
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement
);

function App() {
  const [timeframe, setTimeframe] = useState('Monthly');  // <-- New: 'Today' | 'Weekly' | 'Monthly'
  const [showBar] = useState(true);
  const [showLine] = useState(true);

  const [customers, setCustomers] = useState([]);

  // New state for fleet data
  const [fleetData, setFleetData] = useState([]);

  // New state for orders data
  const [ordersData, setOrdersData] = useState([]);

  // New state for shipments data
  const [shipmentsData, setShipmentsData] = useState([]);

  // New state for profile popup visibility
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  // New state for user profile info
  const [profile, setProfile] = useState({
    name: 'Admin User',
    role: 'Admin',
    email: 'admin@example.com',
    image: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
  });

  // Missing state variables for editing and cropping
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Missing functions for cropping
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const showCroppedImage = useCallback(async () => {
    try {
      if (!croppedAreaPixels) {
        console.error('No cropped area pixels available');
        return;
      }
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      setCroppedImage(croppedImage);
      setProfile(prev => ({ ...prev, image: croppedImage }));
      setImageSrc(null);
    } catch (e) {
      console.error(e);
    }
  }, [imageSrc, croppedAreaPixels]);

  const onCancelCrop = () => {
    setImageSrc(null);
  };

  // Fetch user profile, fleet data, and orders data from backend on mount
  useEffect(() => {
    const token = localStorage.getItem('token');

    const fetchUserProfile = async () => {
      console.log('Token in fetchUserProfile:', token);
      if (!token) {
        console.warn('No auth token found in localStorage');
        return;
      }
  
      try {
        const response = await fetch('http://localhost:5000/api/user/profile', {  // Replace 192.168.x.x with your local machine IP
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch user profile:', response.statusText, errorText);
          return;
        }
  
        const data = await response.json();
        console.log('Fetched user profile data:', data);
        let imageUrl = data.image || '';
        if (imageUrl && imageUrl.startsWith('/')) {
          imageUrl = 'http://localhost:5000' + imageUrl;
        }
        setProfile(prev => ({
          ...prev,
          name: data.name || 'Unknown User',
          email: data.email || '',
          role: data.role || '',
          image: imageUrl,
        }));
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    const fetchFleetData = async () => {
      try {
      const response = await fetch('http://localhost:5000/api/fleet');  // Replace 192.168.x.x with your local machine IP
        if (!response.ok) {
          console.error('Failed to fetch fleet data:', response.statusText);
          return;
        }
        const data = await response.json();
        setFleetData(data);
      } catch (error) {
        console.error('Error fetching fleet data:', error);
      }
    };

    const fetchOrdersData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/orders', {  // Replace 192.168.x.x with your local machine IP
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });
        if (!response.ok) {
          console.error('Failed to fetch orders data:', response.statusText);
          return;
        }
        const data = await response.json();
        setOrdersData(data);
      } catch (error) {
        console.error('Error fetching orders data:', error);
      }
    };

    const fetchShipmentsData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/shipments', {  // Replace 192.168.x.x with your local machine IP
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });
        if (!response.ok) {
          console.error('Failed to fetch shipments data:', response.statusText);
          return;
        }
        const data = await response.json();
        console.log('Fetched shipments data:', data);
        setShipmentsData(data);
      } catch (error) {
        console.error('Error fetching shipments data:', error);
      }
    };

        const fetchCustomersFromOrders = async () => {
          try {
            const response = await fetch('http://localhost:5000/api/orders', {  // Replace 192.168.x.x with your local machine IP
              headers: {
                'Authorization': token ? `Bearer ${token}` : '',
              },
            });
            if (!response.ok) {
              console.error('Failed to fetch orders data for customers:', response.statusText);
              return;
            }
            const ordersData = await response.json();

            // Sort orders by date ascending to match CRM order
            ordersData.sort((a, b) => {
              const dateA = new Date(a.date || a.orderDate || 0);
              const dateB = new Date(b.date || b.orderDate || 0);
              return dateA - dateB;
            });

            const uniqueCustomersMap = new Map();

            ordersData.forEach((order) => {
              let rawCustomer = order.deliveryAddress || order.delivery_address || order.customer || {};

              if (typeof rawCustomer === "string") {
                // Parse plain string to extract name, phone, and email
                const nameMatch = rawCustomer.match(/^([^,]+)/);
                const phoneMatch = rawCustomer.match(/Phone:\s*([\d\-+]+)/i);
                const emailMatch = rawCustomer.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                const name = nameMatch ? nameMatch[1].trim() : "Unnamed";
                const phone = phoneMatch ? phoneMatch[1].trim() : "N/A";
                const email = emailMatch ? emailMatch[0].trim() : "N/A";
                rawCustomer = {
                  name,
                  phone,
                  email,
                };
              }

              // Create keys for merging
              const keyFull = `${rawCustomer.name.toLowerCase()}|${rawCustomer.email.toLowerCase()}|${rawCustomer.phone}`;
              const keyNamePhone = `${rawCustomer.name.toLowerCase()}|${rawCustomer.phone}`;

              let customerKey = null;
              if (uniqueCustomersMap.has(keyFull)) {
                customerKey = keyFull;
              } else if (uniqueCustomersMap.has(keyNamePhone)) {
                customerKey = keyNamePhone;
              } else {
                customerKey = keyFull;
              }

              if (!uniqueCustomersMap.has(customerKey)) {
                uniqueCustomersMap.set(customerKey, {
                  id: `cust-${uniqueCustomersMap.size + 1}`,
                  name: rawCustomer.name || "Unnamed",
                  email: rawCustomer.email || "N/A",
                  phone: rawCustomer.phone || "N/A",
                  orders: [],
                });
              }
              // Add order details to the customer
              uniqueCustomersMap.get(customerKey).orders.push(order);
            });

            const customersArray = Array.from(uniqueCustomersMap.values());
            // Sort customers by their id ascending to match CRM order
            customersArray.sort((a, b) => {
              const aNum = parseInt(a.id.split('-')[1], 10);
              const bNum = parseInt(b.id.split('-')[1], 10);
              return aNum - bNum;
            });

            console.log('Extracted customers array:', customersArray);
            setCustomers(customersArray);
          } catch (error) {
            console.error('Error fetching customers from orders:', error);
          }
        };

    fetchUserProfile();
    fetchFleetData();
    fetchOrdersData();
    fetchShipmentsData();
    fetchCustomersFromOrders();
  }, []);

  console.log('Shipments data:', shipmentsData);
  // Fix: Use correct property name 'status' instead of 'shipmentStatus' to match shipment page data
  const deliveredShipmentsCount = shipmentsData.filter(shipment => shipment.status && shipment.status.toLowerCase() === 'delivered').length;
  console.log('Delivered shipments count:', deliveredShipmentsCount);

  // Calculate total amount from all orders including GST (8%)
  const totalAmount = ordersData.reduce((sum, order) => {
    const orderTotal = order.total !== undefined && !isNaN(parseFloat(order.total)) ? parseFloat(order.total) : 0;
    return sum + orderTotal;
  }, 0);

  // Calculate total products in inventory (instead of total products sold)
  const totalProductsInInventory = initialInventory.reduce((sum, item) => sum + item.quantity, 0);

  const deliveredOrders = ordersData.filter(order => {
    const status = (order.orderStatus || order.order_status || '').toLowerCase();
    return status === 'delivered';
  }).length;
  const totalOrders = ordersData.length;


  const totalProducts = initialInventory.reduce((sum, item) => sum + item.quantity, 0);
  // Normalize categories by trimming and lowercasing to avoid duplicates like "Accessories" and " accessories"
  const normalizedCategoriesMap = new Map();

  initialInventory.forEach(item => {
    const normalizedCategory = item.category.trim().toLowerCase();
    if (!normalizedCategoriesMap.has(normalizedCategory)) {
      normalizedCategoriesMap.set(normalizedCategory, {
        originalCategory: item.category.trim(),
        quantity: 0,
      });
    }
    const current = normalizedCategoriesMap.get(normalizedCategory);
    current.quantity += item.quantity;
  });

  const categories = Array.from(normalizedCategoriesMap.values()).map(c => c.originalCategory);
  const categoryQuantities = Array.from(normalizedCategoriesMap.values()).map(c => c.quantity);

  const ordersChartData = {
    labels: ['Orders', 'Delivered'],
    datasets: [
      {
        label: 'Orders',
        data: [totalOrders, 0],
        backgroundColor: '#384860',
        barThickness: 90,
        maxBarThickness: 90,
      },
      {
        label: 'Delivered',
        data: [0, deliveredOrders],
        backgroundColor: '#97a6c4',
        barThickness: 90,
        maxBarThickness: 90,
      },
    ],
  };

  const inventoryData = {
    labels: categories,
    datasets: [
      {
        label: 'Inventory',
        data: categoryQuantities,
        backgroundColor: ['#05173f', '#0a2e78', '#036cfc', '#5588fe', '#a4b3d4', '#cbcddc', '#48c9b0', ],
      },
    ],
  };


  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);
  
    try {
      const response = await fetch('http://localhost:5000/api/user/profile/image', {  // Replace 192.168.x.x with your local machine IP
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData, // Don't set Content-Type manually; browser sets it correctly for FormData
      });
  
      if (!response.ok) {
        throw new Error('Image upload failed');
      }
  
      const data = await response.json();
      setProfile(prev => ({
        ...prev,
        image: data.imageUrl, // update image in UI
      }));
    } catch (err) {
      console.error('Error uploading image:', err);
    }
  };
  

  // Products Sold Data
  // Use ordersData to calculate products sold per timeframe
  const getProductsSoldData = (timeframe) => {
    const now = new Date();
    let filteredOrders = [];

    if (timeframe === 'Today') {
      filteredOrders = ordersData.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate.toDateString() === now.toDateString();
      });
    } else if (timeframe === 'Weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
      filteredOrders = ordersData.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= startOfWeek && orderDate <= endOfWeek;
      });
    } else { // Monthly
      filteredOrders = ordersData.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      });
    }

    // Aggregate products sold per day or month depending on timeframe
    const productsSoldMap = new Map();

    filteredOrders.forEach(order => {
      let label = '';
      const orderDate = new Date(order.date);
      if (timeframe === 'Today' || timeframe === 'Weekly') {
        // Use day label: e.g. 'Mon 12'
        label = orderDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      } else {
        // Monthly: use month-year label
        label = orderDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }

      const totalProductsInOrder = Array.isArray(order.products) ? order.products.reduce((sum, p) => sum + (p.quantity || 0), 0) : 0;
      if (productsSoldMap.has(label)) {
        productsSoldMap.set(label, productsSoldMap.get(label) + totalProductsInOrder);
      } else {
        productsSoldMap.set(label, totalProductsInOrder);
      }
    });

    // Sort labels chronologically
    const sortedLabels = Array.from(productsSoldMap.keys()).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA - dateB;
    });

    const data = sortedLabels.map(label => productsSoldMap.get(label));

    return { labels: sortedLabels, data };
  };

  const { labels: dynamicLabels, data: dynamicData } = getProductsSoldData(timeframe);

  const productsSoldChartData = {
    labels: dynamicLabels,
    datasets: [
      {
        type: 'bar',
        label: 'Products Sold (Bar)',
        data: dynamicData,
        backgroundColor: '#5483B3',
        hidden: !showBar,
        barThickness: 50, // reduced bar thickness
        maxBarThickness: 60, // max bar thickness
      },
      {
        type: 'line',
        label: 'Products Sold (Line)',
        data: dynamicData,
        borderColor: '#2E4156',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#AAB7B7',
        hidden: !showLine,
      }
    ],
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Logistics Dashboard</h1>
        {console.log('Profile image URL:', profile.image)}
        <img
          src={profile.image || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
          alt="Profile"
          className="profile-icon"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
          }}
          onClick={() => {
            setShowProfilePopup(!showProfilePopup);
            setIsEditing(false);
            setEditName(profile.name);
            setImageSrc(null);
          }}
        />
      </div>

      <div className="stats">
        <div className="card1"><h2>Total Amount</h2><p>${totalAmount.toFixed(2)}</p></div>
        <div className="card2"><h2>Delivered Shipments</h2><p>{deliveredShipmentsCount}</p></div>
        <div className="card3"><h2>Vehicles</h2><p>{fleetData.length}</p></div>
        <div className="card4"><h2>Inventory Items</h2><p>{totalProductsInInventory}</p></div>
      </div>

      <div className="charts">
        
        <div className="chart-card1" >
          <h3 >Orders vs Deliveries</h3>
          <Bar 
            data={ordersChartData} 
            options={{
              plugins: {
                legend: {
                  display: true,
                  position: 'top',
                  labels: {
                    boxWidth:40,
                    boxHeight: 12,
                    padding: 10,
                    color: 'black'
                  }
                },
                title: {
                  display: false,
                  color: 'white',
                },
                tooltip: {
                  titleColor: 'white',
                  bodyColor: 'white',
                }
              },
              scales: {
                x: {
                  ticks: {
                    color: 'var(--black)' // Set X axis labels color to white
                  },
                  grid: {
                    
                    color: 'var(--black)' // Set X axis grid lines color to white
                  }
                },
                y: {
                  ticks: {
                    color: 'var(--black)' // Set Y axis labels color to white
                  },
                  grid: {
                    color: 'var(--black)' // Set Y axis grid lines color to white
                  }
                }
              },
              responsive: true,
              maintainAspectRatio: false,
            }}
          />
        </div> <div className="chart-card2" style={{backgroundColor: 'white', padding: '10px', borderRadius: '8px'}}>
          <h3 style={{color: 'var(--white)'}}>Products Sold</h3>
          {/* --- BUTTONS --- */}
          <div className="timeframe-buttons">
            <button
              className={timeframe === 'Today' ? 'active' : ''}
              onClick={() => setTimeframe('Today')}
            >
              Today
            </button>
            <button
              className={timeframe === 'Weekly' ? 'active' : ''}
              onClick={() => setTimeframe('Weekly')}
            >
              Weekly
            </button>
            <button
              className={timeframe === 'Monthly' ? 'active' : ''}
              onClick={() => setTimeframe('Monthly')}
            >
              Monthly
            </button>
          </div>

          <Bar 
  data={productsSoldChartData}
  options={{
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const chart = elements[0].element.$context.chart;
        const index = elements[0].index;
        const datasetIndex = elements[0].datasetIndex;
        const label = chart.data.labels[index];
        const value = chart.data.datasets[datasetIndex].data[index];
        // alert(`Details for ${label}: ${value} products sold`);
      }
    },
    plugins: {
      tooltip: {
        enabled: true,
        mode: 'index', // <-- important for showing tooltip even with 1 dataset
        intersect: false, // <-- hover even if mouse is close, not just exactly on the bar
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `${context.parsed.y} products sold`;
            }
            return label;
          }
        }
      },
      legend: {
        display: true,
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    hover: {
      mode: 'index', // <-- important for hover behavior
      intersect: false,
    },
    scales: {
      x: {
        ticks: {
          color: 'var(--black)' // Set X axis labels color to white
        },
        grid: {
          color: 'var(--black)' // Set X axis grid lines color to white
        }
      },
      y: {
        ticks: {
          color: 'var(--black)' // Set Y axis labels color to white
        },
        grid: {
          color: 'var(--black)' // Set Y axis grid lines color to white
        }
      }
    }
  }}
/>


        </div>
        <div className="chart-card3">
          <h3>Inventory Breakdown</h3>
          <Pie data={inventoryData} />
        </div>
       
      </div>

      {/* Recently Added Customers Table */}
      <div className="recent-customers">
        <h3>Recently Added Customers</h3>
        <table className="recent-customers-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
      <tbody>
        {customers.length > 0 ? (
          // Show last 3 customers (most recently added) from last to first (most recent first)
          customers.slice(-3).reverse().map(cust => {
            // Find the order that matches this customer's id exactly
            const matchingOrder = cust.orders.find(order => {
              // Check if order.customerId or order.customer_id matches cust.id
              return order.customerId === cust.id || order.customer_id === cust.id;
            }) || null;
            return (
              <tr key={cust.id}>
                <td>{cust.id}</td>
                <td>{cust.name}</td>
                <td>{cust.email}</td>
                <td>{cust.phone}</td>
                {/* <td>{matchingOrder ? matchingOrder.customerId || matchingOrder.customer_id || 'N/A' : 'N/A'}</td> */}
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="5">No customers found.</td>
          </tr>
        )}
      </tbody>
        </table>
      </div>

      {showProfilePopup && (
        <div className="profile-popup-overlay" onClick={() => setShowProfilePopup(false)}>
          <div className="profile-popup" onClick={e => e.stopPropagation()}>
            {!isEditing ? (
              <>
                <img src={profile.image || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="Profile" className="profile-popup-image" />
                <h2>{profile.name}</h2>
                <p> {profile.role}</p>
                <p>{profile.email}</p>
                <div className="editer">
                   <button className='edit-prof'onClick={() => setIsEditing(true)}>Edit</button>
                <button className='can-prof' onClick={() => setShowProfilePopup(false)}>Close</button>
                </div>
               
              </>
            ) : (
              <>
                <label>
                  Name:
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                  />
                </label>

                {!imageSrc ? (
                  <>
                    <label>
                      Select Profile Image:
                      <input type="file" accept="image/*" onChange={handleImageUpload} />

                    </label>
                    {croppedImage && (
                      <img
                        src={croppedImage}
                        alt="Cropped"
                        style={{ width: '100px', height: '100px', borderRadius: '50%', marginTop: '10px' }}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ position: 'relative', width: '100%', height: 200, background: '#333' }}>
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    </div>
                    <div className="profile-popup-buttons" style={{ marginTop: '10px' }}>
                      <button onClick={showCroppedImage}>Crop</button>
                      <button onClick={onCancelCrop}>Cancel</button>
                    </div>
                  </>
                )}

                <div className="profile-popup-buttons" style={{ marginTop: '15px' }}>
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem('token');
                      if (!token) {
                        alert('No auth token found. Please login again.');
                        return;
                      }
                      const apiUrl = 'http://localhost:5000/api/user/profile';  // Replace 192.168.x.x with your local machine IP
                      console.log('Updating profile with URL:', apiUrl);
                      try {
                        const response = await fetch(apiUrl, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            name: editName,
                            email: profile.email,
                            role: profile.role,
                          }),
                        });
                        if (!response.ok) {
                          let errorMessage = response.statusText;
                          const responseText = await response.text();
                          try {
                            const errorData = JSON.parse(responseText);
                            errorMessage = errorData.message || errorMessage;
                          } catch (jsonError) {
                            console.error('Non-JSON error response:', responseText);
                            errorMessage = responseText;
                          }
                          alert('Failed to update profile: ' + errorMessage);
                          return;
                        }
                        setProfile(prev => ({
                          ...prev,
                          name: editName,
                        }));
                        setIsEditing(false);
                        setImageSrc(null);
                        setCroppedImage(null);
                      } catch (error) {
                        alert('Error updating profile: ' + error.message);
                      }
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(profile.name);
                      setImageSrc(null);
                      setCroppedImage(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
