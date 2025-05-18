import React, { useState, useEffect } from "react";
import "../styles/warehouse.css";
import { initialInventory } from "./inventory";

const Warehouse = () => {
  const [inventory, setInventory] = useState(initialInventory);
  const [warehouses, setWarehouses] = useState({
     "Delhi-warehouse": [],
    "Bengaluru-warehouse": [],
  "Mumbai-warehouse": [],
    "Kolkata-warehouse": [],
    "Chennai-warehouse": [],
    "Jaipur-warehouse": []
  });
  const [expandedWarehouse, setExpandedWarehouse] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Group items by warehouse whenever inventory changes
    const grouped = {
       "Delhi-warehouse": [],
      "Bengaluru-warehouse": [],
      "Mumbai-warehouse": [],
      "Kolkata-warehouse": [],
      "Chennai-warehouse": [],
      "Jaipur-warehouse": []
    };

    inventory.forEach(item => {
      if (item.warehouse && grouped[item.warehouse]) {
        grouped[item.warehouse].push(item);
      }
    });

    setWarehouses(grouped);
  }, [inventory]);

  const handleViewMore = (whName) => {
    setExpandedWarehouse(whName);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setExpandedWarehouse(null);
  };

  return (
    <div className="warehouse-container">
      <h2>Warehouse Management</h2>
      
      <div className="warehouse-tables">
        {Object.entries(warehouses).map(([whName, items]) => (
          <div key={whName} className="warehouse-section">
            <h3>{whName}</h3>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  <>
                    {items.slice(0, 5).map(item => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td className={item.status.replace(/\s+/g, "-").toLowerCase()}>
                          {item.status}
                        </td>
                      </tr>
                    ))}
                    {items.length > 5 && (
                      <tr className="view-more-row">
                        <td colSpan="3" className="view-more" onClick={() => handleViewMore(whName)}>
                          View More ({items.length - 5} more) →
                        </td>
                      </tr>
                    )}
                  </>
                ) : (
                  <tr>
                    <td colSpan="3">No items in this warehouse</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {showModal && expandedWarehouse && (
        <div className="pop">
          <div className="pop-content">
            <span className="close-xe" onClick={closeModal}>&times;</span>
            <h3>{expandedWarehouse} - All Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {warehouses[expandedWarehouse].map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td className={item.status.replace(/\s+/g, "-").toLowerCase()}>
                      {item.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouse;
