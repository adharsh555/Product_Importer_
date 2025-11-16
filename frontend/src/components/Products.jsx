import React, { useEffect, useState } from "react";
import axios from "axios";

function Modal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(
    initial || { sku: "", name: "", description: "", price: "", active: true }
  );

  useEffect(() => {
    setForm(initial || { sku: "", name: "", description: "", price: "", active: true });
  }, [initial]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999
      }}
    >
      <div style={{ background: "white", padding: 20, minWidth: 320, borderRadius: 4 }}>
        <h3>{initial ? "Edit Product" : "Create Product"}</h3>

        <div style={{ marginTop: 10 }}>
          <input
            placeholder="SKU"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            style={{ width: "100%", marginBottom: 6 }}
          />
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ width: "100%", marginBottom: 6 }}
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ width: "100%", marginBottom: 6 }}
          />
          <input
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            style={{ width: "100%", marginBottom: 6 }}
          />

          <label>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />{" "}
            Active
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={() => onSubmit(form)} style={{ marginRight: 8 }}>
            Save
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {

  const API = import.meta.env.VITE_API_URL;   // ✅ IMPORTANT

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

  // ------------------ FETCH ------------------
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
      const res = await axios.get(`${API}/products`, { params });   // ✅ FIXED
      setProducts(res.data || []);
    } catch (e) {
      alert("Failed to fetch: " + (e.response?.data?.detail || e.message));
    }
  }

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ------------------ DELETE ALL ------------------
  async function handleDeleteAll() {
    if (!window.confirm("Are you sure you want to delete ALL products? This cannot be undone.")) {
      return;
    }

    setStatus("Deleting all products...");

    try {
      await axios.delete(`${API}/products?confirm=true`);   // ✅ FIXED
      alert("All products deleted successfully!");

      fetchProducts();
      setStatus("");
    } catch (err) {
      console.error(err);
      alert("Failed to delete products: " + err.message);
      setStatus("");
    }
  }

  // ------------------ MODAL ACTIONS ------------------
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
        await axios.put(`${API}/products/${encodeURIComponent(modalInitial.sku)}`, form);   // FIXED
      } else {
        await axios.post(`${API}/products`, form);   // FIXED
      }
      setModalOpen(false);
      fetchProducts();
    } catch (e) {
      alert("Save failed: " + (e.response?.data?.detail || e.message));
    }
  }

  // ------------------ DELETE SINGLE ------------------
  async function deleteProduct(p) {
    if (!window.confirm(`Delete product ${p.sku}?`)) return;

    try {
      await axios.delete(`${API}/products/${encodeURIComponent(p.sku)}`);   // FIXED
      fetchProducts();
    } catch (e) {
      alert("Delete failed: " + (e.response?.data?.detail || e.message));
    }
  }

  return (
    <div>
      <h2>Products</h2>

      {status && <div style={{ marginBottom: 10, color: "blue" }}>{status}</div>}

      <div style={{ marginBottom: 10 }}>

        <input
          placeholder="SKU"
          value={filters.sku}
          onChange={(e) => setFilters({ ...filters, sku: e.target.value })}
        />
        <input
          placeholder="Name"
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
        />
        <input
          placeholder="Description"
          value={filters.description}
          onChange={(e) => setFilters({ ...filters, description: e.target.value })}
        />

        <select
          value={filters.active}
          onChange={(e) => setFilters({ ...filters, active: e.target.value })}
        >
          <option value="">Any</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button
          onClick={() => {
            setPage(0);
            fetchProducts();
          }}
        >
          Filter
        </button>

        <button
          onClick={() => {
            setFilters({ sku: "", name: "", description: "", active: "" });
            setPage(0);
            fetchProducts();
          }}
        >
          Clear
        </button>

        <button style={{ marginLeft: 12 }} onClick={createProductModal}>
          Create
        </button>

        <button style={{ marginLeft: 8, color: "red" }} onClick={handleDeleteAll}>
          Delete All
        </button>
      </div>


      <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
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
                <button onClick={() => editProductModal(p)}>Edit</button>
                <button onClick={() => deleteProduct(p)} style={{ marginLeft: 6, color: "red" }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {products.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center" }}>No products</td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: 10 }}>
        <button onClick={() => page > 0 && setPage((p) => p - 1)}>Prev</button>
        <span style={{ margin: "0 10px" }}>Page {page + 1}</span>
        <button onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>

      <Modal
        open={modalOpen}
        initial={modalInitial}
        onClose={() => setModalOpen(false)}
        onSubmit={onModalSubmit}
      />
    </div>
  );
}
