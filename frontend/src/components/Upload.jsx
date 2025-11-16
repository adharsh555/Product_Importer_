import React, { useState, useRef } from "react";
import axios from "axios";

export default function Upload() {
  const [progress, setProgress] = useState(null);
  const [status, setStatus] = useState("");
  const [lastError, setLastError] = useState(null);
  const esRef = useRef(null);

  async function doUpload(form) {
    setStatus("Uploading file...");
    setLastError(null);

    try {
      const res = await axios.post("/api/upload", form, {
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

    const file = e.target.file.files[0];
    if (!file) return alert("Choose csv");

    const form = new FormData();
    form.append("file", file);

    try {
      const data = await doUpload(form);
      const upload_id = data.upload_id;

      setStatus("File uploaded. Processing started...");
      setProgress(null);

      if (esRef.current) {
        esRef.current.close();
      }

      const es = new EventSource(`/api/events/${upload_id}`);
      esRef.current = es;

      es.onmessage = (ev) => {
        const d = JSON.parse(ev.data);

        if (["processing", "parsing", "queued"].includes(d.status)) {
          if (d.total && d.processed !== undefined) {
            const pct = Math.round((d.processed / d.total) * 100);
            setProgress(pct);
            setStatus(`${d.status} - ${d.processed}/${d.total}`);
          } else {
            setStatus(JSON.stringify(d));
          }
        } else if (d.status === "complete") {
          setProgress(100);
          setStatus(`Complete: ${d.processed}/${d.total}`);
          es.close();
        } else if (d.status === "error") {
          setStatus("Error: " + d.message);
          es.close();
        }
      };

      es.onerror = () => {
        setStatus("EventSource error");
      };

    } catch (err) {
      // Error already handled in doUpload()
    }
  }

  return (
    <div>
      <h2>Upload CSV</h2>

      <form onSubmit={handleSubmit}>
        <input type="file" name="file" accept=".csv" />
        <button type="submit">Upload & Import</button>
      </form>

      <div style={{ marginTop: 10 }}>
        <div>{status}</div>

        {lastError && (
          <div>
            <button onClick={() => setLastError(null)}>Retry Upload</button>
          </div>
        )}

        {progress != null && (
          <div style={{ width: 400, border: "1px solid #ccc", marginTop: 5 }}>
            <div
              style={{
                width: `${progress}%`,
                height: 16,
                background: "#4caf50"
              }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
