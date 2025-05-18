import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTrash } from "@fortawesome/free-solid-svg-icons";
import "../styles/crm.css";

const CRM = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        let ordersData = await response.json();
        console.log('Orders data fetched:', ordersData);

        // Sort orders by date ascending if date field exists
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
            // Assign id based on current map size + 1 to append new customers last
            uniqueCustomersMap.set(customerKey, {
              id: `cust-${uniqueCustomersMap.size + 1}`,
              name: rawCustomer.name || "Unnamed",
              email: rawCustomer.email || "N/A",
              phone: rawCustomer.phone || "N/A",
            });
          }
        });

        const customersArray = Array.from(uniqueCustomersMap.values());
        // Sort customers by their id to ensure the first added person is cust-1 and others follow in order
        customersArray.sort((a, b) => {
          const aNum = parseInt(a.id.split('-')[1], 10);
          const bNum = parseInt(b.id.split('-')[1], 10);
          return aNum - bNum;
        });
        setCustomers(customersArray);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, [customers]);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="crm-container">
      <h1>Customer Relationship Management (CRM)</h1>

      <div className="crm-controls">
        <div className="search-wrapper">
          <FontAwesomeIcon icon={faSearch} className="cr-icon" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <table className="crm">
        <thead>
          <tr>
            <th>Customer ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {paginatedCustomers.length > 0 ? (
            paginatedCustomers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.id}</td>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                {/* Removed delete action button as per request */}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No matching customers found.</td>
            </tr>
          )}
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

export default CRM;
