import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../services/api";

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
      <div className="modal-content fade-in">
        <h3 style={{ marginBottom: "1.5rem" }}>{initial ? "Edit Product" : "Create Product"}</h3>

        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "var(--text-secondary)" }}>SKU</label>
            <input
              className="form-input"
              placeholder="e.g. PROD-001"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "var(--text-secondary)" }}>Product Name</label>
            <input
              className="form-input"
              placeholder="e.g. Acme Widget"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "var(--text-secondary)" }}>Description</label>
            <textarea
              className="form-input"
              style={{ minHeight: "80px" }}
              placeholder="Brief description..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "var(--text-secondary)" }}>Price ($)</label>
              <input
                className="form-input"
                type="number"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.875rem" }}>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                Active
              </label>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSubmit(form)}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [limit] = useState(10); // Reduced limit for cleaner dashboard feel
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState({ sku: "", name: "", description: "", active: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState(null);

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
      console.error(e);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, [page]);

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
      alert("Error: " + (e.response?.data?.detail || e.message));
    }
  }

  async function deleteProduct(p) {
    if (!window.confirm(`Delete product ${p.sku}?`)) return;
    try {
      await axios.delete(`${apiUrl}/api/products/${encodeURIComponent(p.sku)}`);
      fetchProducts();
    } catch (e) {
      alert("Delete failed.");
    }
  }

  return (
    <div className="fade-in">
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="form-input"
            style={{ width: "150px" }}
            placeholder="Search SKU"
            value={filters.sku}
            onChange={(e) => setFilters({ ...filters, sku: e.target.value })}
          />
          <input
            className="form-input"
            style={{ width: "200px" }}
            placeholder="Product Name"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
          <select
            className="form-input"
            style={{ width: "130px" }}
            value={filters.active}
            onChange={(e) => setFilters({ ...filters, active: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button className="btn btn-secondary" onClick={() => { setPage(0); fetchProducts(); }}>Filter</button>
          <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={() => { setModalInitial(null); setModalOpen(true); }}>
            + Create Product
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: "0" }}>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Information</th>
                <th>Price</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.sku}>
                  <td style={{ fontWeight: "600", color: "var(--text-secondary)" }}>{p.sku}</td>
                  <td>
                    <div style={{ fontWeight: "500" }}>{p.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.description?.substring(0, 50)}...</div>
                  </td>
                  <td>${parseFloat(p.price).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${p.active ? "badge-success" : "badge-gray"}`}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn btn-secondary" style={{ padding: "4px 8px", marginRight: "8px" }} onClick={() => { setModalInitial(p); setModalOpen(true); }}>Edit</button>
                    <button className="btn btn-secondary" style={{ padding: "4px 8px", color: "var(--error)" }} onClick={() => deleteProduct(p)}>Delete</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
                    No products found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-light)" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Page {page + 1}</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" style={{ padding: "4px 12px" }} disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button className="btn btn-secondary" style={{ padding: "4px 12px" }} disabled={products.length < limit} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} initial={modalInitial} onClose={() => setModalOpen(false)} onSubmit={onModalSubmit} />
    </div>
  );
}
