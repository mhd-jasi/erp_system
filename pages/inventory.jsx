import React, { useState, useEffect, useRef } from "react";
import "../styles/invent.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faFilter, faPenToSquare } from "@fortawesome/free-solid-svg-icons";

// Load initialInventory from localStorage or empty array
export const initialInventory = JSON.parse(localStorage.getItem("initialInventory")) || [];

const Inventory = () => {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [inventory, setInventory] = useState(initialInventory);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    description:"",
    quantity: 0,
    status: "In Stock",
    price: 0,
    supplier: "",
    sku: "",
    warehouse: "",
    weight_kg: 0,
  });

  const [categories, setCategories] = useState(() => {
    const uniqueCategories = Array.from(new Set(inventory.map(item => item.category)));
    return uniqueCategories;
  });

  const warehouseOptions = [
    "Delhi-warehouse",
    "Bengaluru-warehouse",
    "Mumbai-warehouse",
    "Kolkata-warehouse",
    "Chennai-warehouse",
    "Jaipur-warehouse"
  ];

  // State for dropdown visibility and filtered options for category and warehouse
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState(categories);

  const [warehouseDropdownVisible, setWarehouseDropdownVisible] = useState(false);
  const [filteredWarehouses, setFilteredWarehouses] = useState(warehouseOptions);

  // Refs for detecting outside clicks to close dropdowns
  const categoryRef = useRef(null);
  const warehouseRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/inventory")
      .then((res) => res.json())
      .then((data) => {
        setInventory(data);
        // Also update initialInventory if needed
        initialInventory.length = 0;
        data.forEach(item => initialInventory.push(item));
      })
      .catch((error) => console.error("Failed to fetch inventory:", error));
  }, []);

  // Update categories whenever inventory changes
  useEffect(() => {
    const uniqueCategories = Array.from(new Set(inventory.map(item => item.category)));
    setCategories(uniqueCategories);
    setFilteredCategories(uniqueCategories);
  }, [inventory]);

  // Save inventory to localStorage whenever it changes (including initialInventory)
  useEffect(() => {
    // Sync localStorage
    localStorage.setItem("initialInventory", JSON.stringify(inventory));

    // Also update the exported initialInventory array content (mutate it)
    // Clear the array and push new items
    initialInventory.length = 0;
    inventory.forEach(item => initialInventory.push(item));
  }, [inventory]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setCategoryDropdownVisible(false);
      }
      if (warehouseRef.current && !warehouseRef.current.contains(event.target)) {
        setWarehouseDropdownVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });

    if (name === "category") {
      const filtered = categories.filter(cat =>
        cat.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(filtered);
      setCategoryDropdownVisible(true);
    }

    if (name === "warehouse") {
      const filtered = warehouseOptions.filter(wh =>
        wh.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredWarehouses(filtered);
      setWarehouseDropdownVisible(true);
    }
  };

  // Open edit modal and populate fields
  const openEditModal = (item) => {
    setEditMode(true);
    setEditItemId(item.id);
    setNewItem({
      name: item.name,
      category: item.category,
      description: item.description,
      quantity: item.quantity,
      status: item.status,
      price: item.price,
      supplier: item.supplier,
      sku: item.sku,
      warehouse: item.warehouse,
      weight_kg: item.weight_kg,
    });
    setShowModal(true);
  };

  // Handle update item
  const handleUpdateItem = async () => {
    if (
      !newItem.name ||
      !newItem.category ||
      newItem.quantity === "" ||
      newItem.price === "" ||
      !newItem.supplier ||
      !newItem.sku ||
      !newItem.warehouse ||
      newItem.weight_kg === ""
    ) {
      alert("Please fill in all fields before updating the product.");
      return;
    }

    const itemToSend = {
      ...newItem,
      quantity: Number(newItem.quantity),
      price: Number(newItem.price),
      weight_kg: Number(newItem.weight_kg)
    };

    try {
      const response = await fetch(`http://localhost:5000/api/inventory/${editItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemToSend),
      });

      if (!response.ok) throw new Error('Failed to update item');

      const data = await response.json();

      // Update inventory state
      setInventory(prev => prev.map(item => (item.id === editItemId ? data : item)));

      setShowModal(false);
      setEditMode(false);
      setEditItemId(null);
      setNewItem({
        name: "",
        category: "",
        description: "",
        quantity: 0,
        status: "In Stock",
        price: 0,
        supplier: "",
        sku: "",
        warehouse: "",
        weight_kg: 0,
      });
      setCategoryDropdownVisible(false);
      setWarehouseDropdownVisible(false);
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item in database');
    }
  };

  // Handle add or update item based on mode
  const handleAddItem = () => {
    if (editMode) {
      handleUpdateItem();
    } else {
      if (
        !newItem.name ||
        !newItem.category ||
        newItem.quantity === "" ||
        newItem.price === "" ||
        !newItem.supplier ||
        !newItem.sku ||
        !newItem.warehouse ||
        newItem.weight_kg === ""
      ) {
        alert("Please fill in all fields before adding the product.");
        return;
      }

      const itemToSend = {
        ...newItem,
        quantity: Number(newItem.quantity),
        price: Number(newItem.price),
        weight_kg: Number(newItem.weight_kg)
      };

      fetch('http://localhost:5000/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemToSend),
      })
        .then(response => {
          if (!response.ok) throw new Error('Failed to add item');
          return response.json();
        })
        .then(data => {
          const newItemWithId = { id: data.id, ...itemToSend };
          setInventory(prev => [...prev, newItemWithId]);
          setShowModal(false);
          setNewItem({
            name: "",
            category: "",
            description: "",
            quantity: 0,
            status: "In Stock",
            price: 0,
            supplier: "",
            sku: "",
            warehouse: "",
            weight_kg: 0,
          });
          setCategoryDropdownVisible(false);
          setWarehouseDropdownVisible(false);
        })
        .catch(error => {
          console.error('Error adding item:', error);
          alert('Failed to add item to database');
        });
    }
  };

  const filteredInventory = inventory.filter(
    (item) =>
      (filter === "All" || item.status === filter) &&
      (item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="inventory-container">
      <h2>Inventory Management</h2>
      <div className="controls">
        <div className="search-boxx">
          <FontAwesomeIcon icon={faSearch} className="search-iconn" />
          <input
            type="text"
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="input-icon-group">
          <FontAwesomeIcon icon={faFilter} className="input-iconr" />
          <select
            onChange={(e) => setFilter(e.target.value)}
            className="filter-selectt"
          >
            <option value="All">All</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        <button className="add-product-btn" onClick={() => { setShowModal(true); setEditMode(false); }}>
          <i className="fa-solid fa-circle-plus"></i> Add New
        </button>
      </div>

      <table className="inv-ta">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>description</th>
            <th>Quantity</th>
            <th>Stock Status</th>
            <th>Price</th>
            <th>Supplier</th>
            <th>SKU</th>
            <th>Warehouse</th>
            <th>Weight (kg)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedInventory.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>{item.description}</td>
              <td>{item.quantity}</td>
              <td className={item.status.replace(/\s+/g, "-").toLowerCase()}>
                {item.status}
              </td>
              <td>{item.price}</td>
              <td>{item.supplier}</td>
              <td>{item.sku}</td>
              <td>{item.warehouse}</td>
              <td>{item.weight_kg}</td>
              <td>
              <button onClick={() => openEditModal(item)} style={{ background: 'none', border: 'none', cursor: 'pointer',fontSize:'20px',marginLeft:'10px' }}>
                <FontAwesomeIcon icon={faPenToSquare} />
              </button>
              </td>
            </tr>
          ))}
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

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editMode ? "Edit Item" : "Add New Item"}</h2>

            <input
              type="text"
              name="name"
              placeholder="Enter the Product Name"
              value={newItem.name}
              onChange={handleInputChange}
            />

            <div className="dropdown-input" ref={categoryRef} style={{ position: "relative" }}>
              <input
                type="text"
                name="category"
                placeholder="Enter or select Category"
                value={newItem.category}
                onChange={handleInputChange}
                onFocus={() => {
                  setFilteredCategories(categories);
                  setCategoryDropdownVisible(true);
                }}
                autoComplete="off"
              />
              {categoryDropdownVisible && filteredCategories.length > 0 && (
                <ul className="dropdown-list-cate" style={{
                  position: "absolute",
                  zIndex: 1000,
                  backgroundColor: "white",
                  color:"black",
                  border: "1px solid #ccc",
                  width: "100%",
                  maxHeight: "150px",
                  overflowY: "auto",
                  marginTop: 0,
                  paddingLeft: 0,
                  listStyleType: "none",
                }}>
                  {filteredCategories.map((cat, idx) => (
                    <li
                      key={idx}
                      onClick={() => {
                        setNewItem(prev => ({ ...prev, category: cat }));
                        setCategoryDropdownVisible(false);
                      }}
                      style={{ padding: "5px", cursor: "pointer" }}
                      onMouseDown={e => e.preventDefault()} // prevent input blur
                    >
                      {cat}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <input
              type="text"
              name="description"
              placeholder="Enter the description"
              value={newItem.description}
              onChange={handleInputChange}
            />

            <input
              type="number"
              name="quantity"
              placeholder="Enter the Quantity"
              value={newItem.quantity}
              onChange={handleInputChange}
            />

            <input
              type="number"
              name="price"
              placeholder="Enter the Price"
              value={newItem.price}
              onChange={handleInputChange}
            />

            <input
              type="text"
              name="supplier"
              placeholder="Enter the Supplier"
              value={newItem.supplier}
              onChange={handleInputChange}
            />

            <input
              type="text"
              name="sku"
              placeholder="Enter the SKU"
              value={newItem.sku}
              onChange={handleInputChange}
            />

            <div className="dropdown-input" ref={warehouseRef} style={{ position: "relative" }}>
              <input
                type="text"
                name="warehouse"
                placeholder="Enter or select Warehouse"
                value={newItem.warehouse}
                onChange={handleInputChange}
                onFocus={() => {
                  setFilteredWarehouses(warehouseOptions);
                  setWarehouseDropdownVisible(true);
                }}
                autoComplete="off"
              />
              {warehouseDropdownVisible && filteredWarehouses.length > 0 && (
                <ul className="dropdown-list-ware" style={{
                  position: "absolute",
                  zIndex: 1000,
                  backgroundColor: "white",
                  color:"black",
                  border: "1px solid #ccc",
                  width: "100%",
                  maxHeight: "150px",
                  overflowY: "auto",
                  marginTop: 0,
                  paddingLeft: 0,
                  listStyleType: "none",
                }}>
                  {filteredWarehouses.map((wh, idx) => (
                    <li
                      key={idx}
                      onClick={() => {
                        setNewItem(prev => ({ ...prev, warehouse: wh }));
                        setWarehouseDropdownVisible(false);
                      }}
                      style={{ padding: "5px", cursor: "pointer" }}
                      onMouseDown={e => e.preventDefault()} // prevent input blur
                    >
                      {wh}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <input
              type="number"
              name="weight_kg"
              placeholder="Enter Weight (kg)"
              value={newItem.weight_kg}
              onChange={handleInputChange}
            />

            <select name="status" value={newItem.status} onChange={handleInputChange}>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>

            <button className="add" onClick={handleAddItem}>
              {editMode ? "Update" : "Add"}
            </button>
            <button className="cancel" onClick={() => setShowModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
