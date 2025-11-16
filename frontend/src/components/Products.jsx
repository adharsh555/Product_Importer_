import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../services/api";

// ------------------------- MODAL COMPONENT -------------------------
function Modal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(
    initial || { sku: "", name: "", description: "", price: "", active: true }
  );

  useEffect(() => {
    setForm(initial || { sku: "", name: "", description: "", price: "", active: true });
  }, [initial]);

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>{initial ? "Edit Product" : "Create Product"}</h3>

        <input
          className="modal-input"
          placeholder="SKU"
          value={form.sku}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
        />

        <input
          className="modal-input"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="modal-input"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <input
          className="modal-input"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />

        <label>
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          {" "}Active
        </label>

        <div className="modal-actions">
          <button className="save-button" onClick={() => onSubmit(form)}>
            Save
          </button>
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------- PRODUCTS PAGE -------------------------
export default function Products() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [limit] = useState(25);
  const [status, setStatus] = useState("");

  const [filters, setFilters] = useState({
    sku: "",
    name: "",
    description: "",
    active: ""
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState(null);

  // ------------------------- FETCH PRODUCTS -------------------------
  async function fetchProducts() {
    const params = {
      skip: page * limit,
      limit,
      sku: filters.sku,
      name: filters.name,
      description: filters.description
    };

    if (filters.active !== "") params.active = filters.active;

    try {
      const res = await axios.get(`${apiUrl}/api/products`, { params });
      setProducts(res.data || []);
    } catch (e) {
      alert("Failed to fetch: " + (e.response?.data?.detail || e.message));
    }
  }

  useEffect(() => {
    fetchProducts();
  }, [page]);

  // ------------------------- DELETE ALL -------------------------
  async function handleDeleteAll() {
    if (!window.confirm("Are you sure you want to delete ALL products?")) return;

    setStatus("Deleting all products...");

    try {
      await axios.delete(`${apiUrl}/api/products?confirm=true`);
      alert("All products deleted successfully!");
      fetchProducts();
      setStatus("");
    } catch (err) {
      alert("Failed to delete: " + err.message);
      setStatus("");
    }
  }

  // ------------------------- MODAL ACTIONS -------------------------
  function createProductModal() {
    setModalInitial(null);
    setModalOpen(true);
  }

  function editProductModal(p) {
    setModalInitial(p);
    setModalOpen(true);
  }

  async function onModalSubmit(form) {
    try {
      if (modalInitial) {
        await axios.put(`${apiUrl}/api/products/${encodeURIComponent(modalInitial.sku)}`, form);
      } else {
        await axios.post(`${apiUrl}/api/products`, form);
      }
      setModalOpen(false);
      fetchProducts();
    } catch (e) {
      alert("Save failed: " + (e.response?.data?.detail || e.message));
    }
  }

  async function deleteProduct(p) {
    if (!window.confirm(`Delete product ${p.sku}?`)) return;

    try {
      await axios.delete(`${apiUrl}/api/products/${encodeURIComponent(p.sku)}`);
      fetchProducts();
    } catch (e) {
      alert("Delete failed: " + (e.response?.data?.detail || e.message));
    }
  }

  // ------------------------- UI -------------------------
  return (
    <div className="products-container">
      <h2 className="products-title">Products</h2>

      {status && <div className="status-message">{status}</div>}

      {/* Filters */}
      <div className="filter-row">
        <input
          className="products-input"
          placeholder="SKU"
          value={filters.sku}
          onChange={(e) => setFilters({ ...filters, sku: e.target.value })}
        />

        <input
          className="products-input"
          placeholder="Name"
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
        />

        <input
          className="products-input"
          placeholder="Description"
          value={filters.description}
          onChange={(e) => setFilters({ ...filters, description: e.target.value })}
        />

        <select
          className="products-select"
          value={filters.active}
          onChange={(e) => setFilters({ ...filters, active: e.target.value })}
        >
          <option value="">Any</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button className="products-button" onClick={() => { setPage(0); fetchProducts(); }}>
          Filter
        </button>

        <button className="products-button clear-button" onClick={() => {
          setFilters({ sku: "", name: "", description: "", active: "" });
          setPage(0);
          fetchProducts();
        }}>
          Clear
        </button>

        <button className="products-button create-button" onClick={createProductModal}>
          Create
        </button>

        <button className="products-button delete-all-button" onClick={handleDeleteAll}>
          Delete All
        </button>
      </div>

      {/* Table */}
      <table className="products-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Description</th>
            <th>Price</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => (
            <tr key={p.sku}>
              <td>{p.sku}</td>
              <td>{p.name}</td>
              <td>{p.description}</td>
              <td>{p.price}</td>
              <td>{String(p.active)}</td>
              <td>
                <button className="action-button" onClick={() => editProductModal(p)}>
                  Edit
                </button>
                <button className="action-button delete-button" onClick={() => deleteProduct(p)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {products.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center" }}>
                No products
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        <button onClick={() => page > 0 && setPage((p) => p - 1)}>Prev</button>
        <span>Page {page + 1}</span>
        <button onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} initial={modalInitial} onClose={() => setModalOpen(false)} onSubmit={onModalSubmit} />
    </div>
  );
}
