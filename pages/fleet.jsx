import React, { useState, useEffect } from "react";
import "../styles/fleet.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faCirclePlus } from "@fortawesome/free-solid-svg-icons";

const FleetManagement = () => {
  const [fleet, setFleet] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [showModal, setShowModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    id: "",
    vehicle: "",
    driver: "",
    location: "",
    lastService: "",
    nextService: "",
  });

  // Fetch all fleet data once on component load
  useEffect(() => {
    fetch("http://localhost:5000/api/fleet")
      .then((res) => res.json())
      .then((data) => setFleet(data))
      .catch((err) => console.error("Error fetching fleet:", err));
  }, []);

  // Auto-generate ID when modal opens
  useEffect(() => {
    if (showModal) {
      fetch("http://localhost:5000/api/fleet/next-id")
        .then((res) => res.json())
        .then((data) => {
          setNewVehicle((prev) => ({ ...prev, id: data.nextId }));
        })
        .catch((err) => console.error("Error fetching next ID:", err));
    }
  }, [showModal]);

  const handleInputChange = (e) => {
    setNewVehicle({ ...newVehicle, [e.target.name]: e.target.value });
  };

  const handleAddVehicle = () => {
    fetch("http://localhost:5000/api/fleet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newVehicle),
    })
      .then((res) => res.json())
      .then((data) => {
        setFleet([...fleet, data]); // use returned item
        setNewVehicle({
          id: "",
          vehicle: "",
          driver: "",
          location: "",
          lastService: "",
          nextService: "",
        });
        setShowModal(false);
      })
      .catch((err) => console.error("Error adding vehicle:", err));
  };

  const filteredFleet = fleet.filter((vehicle) =>
    [vehicle.id, vehicle.driver, vehicle.vehicle, vehicle.location]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredFleet.length / itemsPerPage);
  const paginatedFleet = filteredFleet.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="fleet-container">
      <h1 className="title">Fleet Management</h1>

      <div className="fleet-controls">
        <div className="input-icon-group">
          <FontAwesomeIcon icon={faSearch} className="input-iconn" />
          <input
            type="text"
            placeholder="Search by ID, Driver, Type or Location"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-inputt"
          />
        </div>

        <button className="pp-button" onClick={() => setShowModal(true)}>
          <FontAwesomeIcon icon={faCirclePlus} /> Add New
        </button>
      </div>

      {showModal && (
        <div className="vehicle-pop">
          <div className="veh-pop">
            <h2>Add New Vehicle</h2>
            <form>
              <input
                type="text"
                name="id"
                placeholder="Fleet ID"
                value={newVehicle.id}
                readOnly
              />
              <input
                type="text"
                name="vehicle"
                placeholder="Enter Vehicle Type"
                value={newVehicle.vehicle}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="driver"
                placeholder="Enter Name of Driver"
                value={newVehicle.driver}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="location"
                placeholder="Enter the Location"
                value={newVehicle.location}
                onChange={handleInputChange}
              />
              <input
                type="date"
                name="lastService"
                value={newVehicle.lastService}
                onChange={handleInputChange}
              />
              <input
                type="date"
                name="nextService"
                value={newVehicle.nextService}
                onChange={handleInputChange}
              />
              <div className="pop-actions">
                <button type="button" className="add-fbtn" onClick={handleAddVehicle}>
                  Add
                </button>
                <button
                  type="button"
                  className="cancel-fbtn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="fleet-table">
          <thead>
            <tr>
              <th>Fleet ID</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Location</th>
              <th>Last Service</th>
              <th>Next Service</th>
            </tr>
          </thead>
          <tbody>
            {paginatedFleet.map((vehicle, index) => (
              <tr key={index}>
                <td>{vehicle.id}</td>
                <td>{vehicle.vehicle}</td>
                <td>{vehicle.driver}</td>
                <td>{vehicle.location}</td>
                <td>{vehicle.lastService}</td>
                <td>{vehicle.nextService}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="paginationf">
          <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
            &lt;
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
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default FleetManagement;
