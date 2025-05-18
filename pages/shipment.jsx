import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTruck,
  faBoxOpen,
  faShippingFast,
  faCheckCircle,
  faTimesCircle,
  faSearch,
  faFilter
} from "@fortawesome/free-solid-svg-icons";
import "../styles/shipment.css";

const shipmentStatusOptions = ["All", "Added to Shipment", "In Transit", "Delivered", "Delayed", "Cancelled"];

const getStatusClass = (status) => {
  switch (status) {
    case "Delivered":
      return "status-delivered";
    case "In Transit":
      return "status-intransit";
    case "Delayed":
      return "status-delayed";
    case "Cancelled":
      return "status-cancelled";
    default:
      return "";
  }
};

const ShipmentPage = () => {
  const [shipments, setShipments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = () => {
    axios
      .get("http://localhost:5000/api/shipments")
      .then((response) => setShipments(response.data))
      .catch((error) => console.error("Error fetching shipments:", error));
  };

  const updateStatus = (shipmentId, newStatus) => {
    console.log("🔄 Updating status...");
    console.log("📦 Shipment ID:", shipmentId);
    console.log("📌 New Status:", newStatus);

    axios
      .put(`http://localhost:5000/api/shipments/${shipmentId}`, { status: newStatus })
      .then(async (response) => {
        console.log("✅ Shipment status updated successfully:", response.data);
        fetchShipments();

        // If shipment status is "Added to Shipment", "In Transit" or "Delivered", update order status to "shipped"
        if (newStatus === "Added to Shipment" || newStatus === "In Transit" || newStatus === "Delivered") {
          try {
            const orderId = shipmentId; // shipmentId is actually orderId in the current code usage
            const token = localStorage.getItem('token');
            if (!token) {
              console.error('No auth token found for order status update');
              return;
            }
            await axios.put(
              `http://localhost:5000/api/orders/${orderId}/status`,
              { order_status: "shipped" },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(`Order status for order ${orderId} updated to shipped`);
            // Dispatch custom event to notify order status update
            window.dispatchEvent(new CustomEvent('orderStatusUpdated', { detail: { orderId, status: 'shipped' } }));
          } catch (error) {
            console.error("❌ Error updating order status:", error);
          }
        }
      })
      .catch((error) => {
        console.error("❌ Error updating shipment status:", error.message);
        if (error.response) {
          console.error("📡 Server response:", error.response.data);
          console.error("📋 Status code:", error.response.status);
        } else if (error.request) {
          console.error("📡 No response received from server:", error.request);
        } else {
          console.error("⚠️ Request setup error:", error.message);
        }
      });
  };
  

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch =
      shipment.shipmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    // Normalize and trim strings for comparison
    const normalizedShipmentStatus = shipment.status ? shipment.status.trim().toLowerCase() : "";
    const normalizedFilterStatus = filterStatus ? filterStatus.trim().toLowerCase() : "";

    const matchesFilter = normalizedFilterStatus === "all" || normalizedShipmentStatus === normalizedFilterStatus;

    // Debug logs
    // console.log("FilterStatus:", normalizedFilterStatus, "ShipmentStatus:", normalizedShipmentStatus, "Matches:", matchesFilter);

    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    // Sort by shipmentId ascending (assuming shipmentId is string, sort lexicographically)
    if (a.shipmentId < b.shipmentId) return -1;
    if (a.shipmentId > b.shipmentId) return 1;
    return 0;
  });

  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="shipment-container">
      <h2>Shipments</h2>

      <div className="shipment-controls">
        <div className="search-boxe">
          <FontAwesomeIcon icon={faSearch} className="search-iconn" />
          <input
            type="text"
            placeholder="Search by Shipment ID or Order ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="input-icon-group">
          <FontAwesomeIcon icon={faFilter} className="inputt-icon" />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="filteer-select"
          >
            {shipmentStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="shippy">
        {paginatedShipments.length === 0 ? (
          <p className="no-results">No shipments found matching your criteria.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Shipment ID</th>
                <th>Order ID</th>
                <th>Carrier</th>
                <th>Tracking Number</th>
                <th>Customer</th>
                <th>Status</th>
                <th>From</th>
                <th>To</th>
                <th>Shipment Date</th>
                <th>Estimated Delivery</th>
              </tr>
            </thead>
            <tbody>
              {paginatedShipments.map((shipment) => (
                <tr key={shipment.shipmentId}>
                  <td>{shipment.shipmentId}</td>
                  <td>{shipment.orderId}</td>
                  <td>{shipment.carrier}</td>
                  <td>{shipment.trackingNumber}</td>
                  <td>{shipment.customerName}</td>
                  <td className={getStatusClass(shipment.status)}>
                    <FontAwesomeIcon
                      icon={
                        shipment.status === "Delivered"
                          ? faCheckCircle
                          : shipment.status === "In Transit"
                          ? faShippingFast
                          : shipment.status === "Delayed"
                          ? faTruck
                          : shipment.status === "Cancelled"
                          ? faTimesCircle
                          : faBoxOpen
                      }
                      className="status-icon"
                    />{" "}
                    <select style={{width:'80px'}}
                      value={shipment.status}
                      onChange={(e) => updateStatus(shipment.orderId, e.target.value)}
                    >
                      {shipmentStatusOptions
                        .filter((status) => status !== "All")
                        .map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        )) }
                    </select>
                  </td>
                  <td>{shipment.fromLocation}</td>
                  <td>{shipment.toLocation}</td>
                  <td>{shipment.shipmentDate}</td>
                  <td>{shipment.estimatedDelivery}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="paginationS">
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
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          {">"}
        </button>
      </div>
    </div>
  );
};

export default ShipmentPage;
