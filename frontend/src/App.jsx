import React, { useState } from "react";
import "./App.css"; // Core layout and animations
import Upload from "./components/Upload";
import Products from "./components/Products";
import Webhooks from "./components/Webhooks";

export default function App() {
  const [view, setView] = useState("products"); // Default to products for better UX

  const navItems = [
    { id: "products", label: "Products", icon: "📦" },
    { id: "upload", label: "Import Data", icon: "📤" },
    { id: "webhooks", label: "Webhooks", icon: "🔗" },
  ];

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">ACME Product</div>
        <nav>
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${view === item.id ? "active" : ""}`}
              onClick={() => setView(item.id)}
            >
              <span style={{ marginRight: "12px" }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", marginBottom: "0.5rem" }}>
            {navItems.find((n) => n.id === view)?.label}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Manage your product inventory and integrations efficiently.
          </p>
        </header>

        <section className="fade-in">
          {view === "upload" && <Upload />}
          {view === "products" && <Products />}
          {view === "webhooks" && <Webhooks />}
        </section>
      </main>
    </div>
  );
}
