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

  // --------------------- LOAD WEBHOOKS ---------------------
  async function load() {
    try {
      const res = await axios.get(`${apiUrl}/api/webhooks`);
      setHooks(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load webhooks: " + (err.response?.data?.detail || err.message));
    }
  }

  useEffect(() => {
    load();
  }, []);

  // --------------------- ADD WEBHOOK ---------------------
  async function add() {
    try {
      await axios.post(`${apiUrl}/api/webhooks`, form);

      setForm({
        url: "",
        event: "product.import",
        enabled: true
      });

      load();
    } catch (err) {
      alert("Failed to add: " + (err.response?.data?.detail || err.message));
    }
  }

  // --------------------- TEST WEBHOOK ---------------------
  async function test(id) {
    try {
      const res = await axios.post(`${apiUrl}/api/webhooks/${id}/test`);
      alert("Test response: " + JSON.stringify(res.data));
    } catch (e) {
      alert("Failed: " + (e.response?.data?.detail || e.message));
    }
  }

  // --------------------- DELETE WEBHOOK ---------------------
  async function del(id) {
    if (!confirm("Delete this webhook?")) return;
    try {
      await axios.delete(`${apiUrl}/api/webhooks/${id}`);
      load();
    } catch (e) {
      alert("Failed: " + (e.response?.data?.detail || e.message));
    }
  }

  // --------------------- RENDER ---------------------
  return (
    <div className="webhooks-container">
      <h2 className="webhooks-title">Webhooks</h2>

      {/* Create Webhook Form */}
      <div className="webhooks-form">
        <input
          className="webhook-input"
          placeholder="Webhook URL"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
        />

        <input
          className="webhook-input"
          placeholder="Event"
          value={form.event}
          onChange={(e) => setForm({ ...form, event: e.target.value })}
        />

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
          Enabled
        </label>

        <button className="add-button" onClick={add}>
          Add
        </button>
      </div>

      {/* Webhook List */}
      <ul className="webhooks-list">
        {hooks.map((h) => (
          <li key={h.id} className="webhook-item">
            <span>
              <strong>{h.id}</strong>: {h.url} ({h.event}) — {h.enabled ? "Enabled" : "Disabled"}
            </span>

            <div className="button-group">
              <button className="test-button" onClick={() => test(h.id)}>
                Test
              </button>
              <button className="delete-button" onClick={() => del(h.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}

        {hooks.length === 0 && <li>No webhooks found.</li>}
      </ul>
    </div>
  );
}
