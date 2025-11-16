import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Webhooks() {
  const [hooks, setHooks] = useState([]);
  const [form, setForm] = useState({ url: "", event: "product.import", enabled: true });

  async function load() {
    try {
      const res = await axios.get("/api/webhooks");
      setHooks(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load webhooks: " + (err.response?.data?.detail || err.message));
    }
  }

  useEffect(() => { load(); }, []);

  async function add() {
    try {
      await axios.post("/api/webhooks", form);
      setForm({ url: "", event: "product.import", enabled: true });
      load();
    } catch (err) {
      alert("Failed to add: " + (err.response?.data?.detail || err.message));
    }
  }

  async function test(id) {
    try {
      const res = await axios.post(`/api/webhooks/${id}/test`);
      alert("Test response: " + JSON.stringify(res.data));
    } catch (e) {
      alert("Failed: " + (e.response?.data?.detail || e.message));
    }
  }

  async function del(id) {
    if (!confirm("Delete?")) return;
    try {
      await axios.delete(`/api/webhooks/${id}`);
      load();
    } catch (e) {
      alert("Failed: " + (e.response?.data?.detail || e.message));
    }
  }

  return (
    <div className="card container">
      <h2>Webhooks</h2>
      <div style={{ marginBottom: 8 }}>
        <input placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        <input placeholder="Event" value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} />
        <label style={{ marginLeft: 8 }}>
          <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Enabled
        </label>
        <button onClick={add} style={{ marginLeft: 8 }}>Add</button>
      </div>

      <ul>
        {hooks.map(h => (
          <li key={h.id} style={{ marginBottom: 6 }}>
            <strong>{h.id}:</strong> {h.url} ({h.event}) [{h.enabled ? "enabled" : "disabled"}]
            <button onClick={() => test(h.id)} style={{ marginLeft: 8 }}>Test</button>
            <button onClick={() => del(h.id)} style={{ marginLeft: 6 }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
