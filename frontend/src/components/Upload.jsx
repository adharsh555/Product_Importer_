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

      setStatus("File uploaded. Processing started.");
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
            setStatus(`${d.status} - ${d.processed}/${d.total}`);
          } else {
            setStatus(d.status);
          }
        } else if (d.status === "complete") {
          setProgress(100);
          setStatus("Import completed. You can now view the results in the Products section.");
          es.close();
        } else if (d.status === "error") {
          setStatus("Error: " + d.message);
          es.close();
        }
      };

      es.onerror = () => setStatus("Connection error while receiving updates.");
    } catch (err) {}
  }

  // ------------------------- RENDER -------------------------
  return (
    <div className="upload-container">
      <h2 className="upload-title">Upload CSV</h2>

      <form onSubmit={handleSubmit}>
        <input type="file" name="file" accept=".csv" />
        <br /><br />
        <button type="submit" className="upload-button">
          Upload and Import
        </button>
      </form>

      <div className="upload-status">{status}</div>

      {lastError && (
        <button className="retry-button" onClick={() => setLastError(null)}>
          Retry Upload
        </button>
      )}

      {progress != null && (
        <div className="progress-container">
          <div
            className={
              progress === 100
                ? "progress-bar complete"
                : "progress-bar"
            }
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
