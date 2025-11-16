import React, { useState, useRef } from "react";
import axios from "axios";
import { apiUrl } from "../services/api";

export default function Upload() {
  const [progress, setProgress] = useState(null);
  const [status, setStatus] = useState("");
  const [lastError, setLastError] = useState(null);
  const esRef = useRef(null);

  // ------------------------- UPLOAD FUNCTION -------------------------
  async function doUpload(form) {
    setStatus("Uploading file...");
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

  // ------------------------- HANDLE SUBMIT -------------------------
  async function handleSubmit(e) {
    e.preventDefault();

    const file = e.target.file.files[0];
    if (!file) return alert("Please select a CSV file.");

    const form = new FormData();
    form.append("file", file);

    try {
      const data = await doUpload(form);
      const upload_id = data.upload_id;

      setStatus("File uploaded. Processing has started...");
      setProgress(null);

      if (esRef.current) esRef.current.close();

      // Server-Sent Events (SSE)
      const es = new EventSource(`${apiUrl}/api/events/${upload_id}`);
      esRef.current = es;

      es.onmessage = (ev) => {
        const d = JSON.parse(ev.data);

        if (["processing", "parsing", "queued"].includes(d.status)) {
          if (d.total && d.processed !== undefined) {
            const pct = Math.round((d.processed / d.total) * 100);
            setProgress(pct);
            setStatus(`${d.status} - ${d.processed}/${d.total}`);
          } else {
            setStatus(d.status);
          }
        } 
        
        // Processing complete
        else if (d.status === "complete") {
          setProgress(100);
          setStatus("Import completed. You can view the results on the Products page.");
          es.close();
        } 
        
        // Processing error
        else if (d.status === "error") {
          setStatus("Error: " + d.message);
          es.close();
        }
      };

      es.onerror = () => {
        setStatus("Connection error while receiving updates.");
      };

    } catch (err) {
      // Error already handled
    }
  }

  // ------------------------- RENDER -------------------------
  return (
    <div>
      <h2>Upload CSV</h2>

      <form onSubmit={handleSubmit}>
        <input type="file" name="file" accept=".csv" />
        <button type="submit">Upload & Import</button>
      </form>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontWeight: "500" }}>{status}</div>

        {lastError && (
          <div style={{ marginTop: 8 }}>
            <button onClick={() => setLastError(null)}>Retry Upload</button>
          </div>
        )}

        {progress != null && (
          <div style={{ width: 400, border: "1px solid #ccc", marginTop: 8 }}>
            <div
              style={{
                width: `${progress}%`,
                height: 16,
                background: progress === 100 ? "#2e7d32" : "#4caf50",
                transition: "width 0.3s ease"
              }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
