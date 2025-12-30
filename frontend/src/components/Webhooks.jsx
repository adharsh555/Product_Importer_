import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../services/api";

export default function Webhooks() {
  const [hooks, setHooks] = useState([]);
  const [form, setForm] = useState({
    url: "",
    event: "product.import",
    enabled: true
  });

  async function load() {
    try {
      const res = await axios.get(`${apiUrl}/api/webhooks`);
      setHooks(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!form.url) return alert("Please provide a URL.");
    try {
      await axios.post(`${apiUrl}/api/webhooks`, form);
      setForm({ url: "", event: "product.import", enabled: true });
      load();
    } catch (err) {
      alert("Failed to add: " + (err.response?.data?.detail || err.message));
    }
  }

  async function test(id) {
    try {
      const res = await axios.post(`${apiUrl}/api/webhooks/${id}/test`);
      alert("Connectivity Test: " + (res.data.status || "Success"));
    } catch (e) {
      alert("Test failed.");
    }
  }

  async function del(id) {
    if (!confirm("Delete this webhook configuration?")) return;
    try {
      await axios.delete(`${apiUrl}/api/webhooks/${id}`);
      load();
    } catch (e) {
      alert("Delete failed.");
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: "800px" }}>
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h3 style={{ marginBottom: "1.5rem" }}>Configure New Webhook</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "var(--text-secondary)" }}>Endpoint URL</label>
            <input
              className="form-input"
              placeholder="https://your-api.com/webhook"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "var(--text-secondary)" }}>Event Trigger</label>
            <select
              className="form-input"
              value={form.event}
              onChange={(e) => setForm({ ...form, event: e.target.value })}
            >
              <option value="product.import">product.import</option>
              <option value="product.update">product.update</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={add}>+ Add Hook</button>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.875rem" }}>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            Enabled by default
          </label>
        </div>
      </div>

      <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>Active Webhooks</h3>
      <div style={{ display: "grid", gap: "1rem" }}>
        {hooks.map((h) => (
          <div key={h.id} className="card" style={{ marginBottom: "0", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <div style={{ fontSize: "1.5rem" }}>🔗</div>
              <div>
                <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{h.url}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Event: <span style={{ color: "var(--accent-primary)", fontWeight: "500" }}>{h.event}</span> • Created: {h.id.substring(0, 8)}...
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span className={`badge ${h.enabled ? "badge-success" : "badge-gray"}`}>
                {h.enabled ? "Enabled" : "Disabled"}
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-secondary" style={{ padding: "4px 12px" }} onClick={() => test(h.id)}>Test</button>
                <button className="btn btn-secondary" style={{ padding: "4px 12px", color: "var(--error)" }} onClick={() => del(h.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}

        {hooks.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            No webhooks configured yet.
          </div>
        )}
      </div>
    </div>
  );
}
