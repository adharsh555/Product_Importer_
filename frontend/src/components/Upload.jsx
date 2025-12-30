import React, { useState, useRef } from "react";
import axios from "axios";
import { apiUrl } from "../services/api";

export default function Upload() {
  const [progress, setProgress] = useState(null);
  const [status, setStatus] = useState("");
  const [lastError, setLastError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const esRef = useRef(null);
  const fileInputRef = useRef(null);

  async function doUpload(form) {
    setStatus("Uploading secure file...");
    setLastError(null);

    try {
      const res = await axios.post(`${apiUrl}/api/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => {
          if (ev.total) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setProgress(pct);
            setStatus(`Uploading: ${pct}%`);
          }
        }
      });
      return res.data;
    } catch (err) {
      setLastError(err);
      setStatus("Upload failed: " + (err.response?.data?.detail || err.message));
      throw err;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const file = e.target.file ? e.target.file.files[0] : fileInputRef.current.files[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    try {
      const data = await doUpload(form);
      const upload_id = data.upload_id;

      setStatus("Processing data...");
      setProgress(null);

      if (esRef.current) esRef.current.close();
      const es = new EventSource(`${apiUrl}/api/events/${upload_id}`);
      esRef.current = es;

      es.onmessage = (ev) => {
        const d = JSON.parse(ev.data);
        if (["processing", "parsing", "queued"].includes(d.status)) {
          if (d.total && d.processed !== undefined) {
            const pct = Math.round((d.processed / d.total) * 100);
            setProgress(pct);
            setStatus(`${d.status.toUpperCase()} - ${d.processed}/${d.total} items`);
          } else {
            setStatus(d.status.toUpperCase());
          }
        } else if (d.status === "complete") {
          setProgress(100);
          setStatus("Import completed successfully.");
          es.close();
        } else if (d.status === "error") {
          setStatus("Error: " + d.message);
          es.close();
        }
      };
      es.onerror = () => setStatus("Connection lost. Retrying...");
    } catch (err) { }
  }

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragOver(true);
    else if (e.type === "dragleave") setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      fileInputRef.current.files = e.dataTransfer.files;
      handleSubmit({ preventDefault: () => { } });
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: "600px" }}>
      <div className="card">
        <h3 style={{ marginBottom: "1.5rem" }}>Import Products via CSV</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          Upload a CSV file containing your product catalog. Supported fields: SKU, Name, Description, Price, Active.
        </p>

        <form onSubmit={handleSubmit}>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            style={{
              border: `2px dashed ${isDragOver ? "var(--accent-primary)" : "var(--border-medium)"}`,
              borderRadius: "var(--radius-lg)",
              padding: "3rem 2rem",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: isDragOver ? "var(--accent-soft)" : "transparent",
              transition: "all 0.2s"
            }}
          >
            <input
              type="file"
              name="file"
              accept=".csv"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleSubmit}
            />
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📄</div>
            <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
              Click to upload or drag and drop
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              CSV files only (max. 10MB)
            </div>
          </div>
        </form>

        {status && (
          <div style={{ marginTop: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "var(--text-secondary)" }}>{status}</span>
              {progress != null && <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>{progress}%</span>}
            </div>
            {progress != null && (
              <div style={{ width: "100%", height: "8px", backgroundColor: "var(--border-light)", borderRadius: "4px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    backgroundColor: progress === 100 ? "var(--success)" : "var(--accent-primary)",
                    transition: "width 0.3s ease"
                  }}
                />
              </div>
            )}
          </div>
        )}

        {lastError && (
          <div style={{ marginTop: "1rem" }}>
            <button className="btn btn-danger" style={{ width: "100%" }} onClick={() => setLastError(null)}>
              Dismiss Error and Retry
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h4 style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>Import Tips</h4>
        <ul style={{ paddingLeft: "1.25rem", color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: "1.6" }}>
          <li>Ensure your SKU values are unique to avoid duplicates.</li>
          <li>Dates should be in YYYY-MM-DD format if applicable.</li>
          <li>Price field should be numeric without currency symbols.</li>
        </ul>
      </div>
    </div>
  );
}
