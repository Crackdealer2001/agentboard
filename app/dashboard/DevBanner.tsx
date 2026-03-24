"use client";
import { useState } from "react";

export default function DevBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#0a1a00",
      border: "1px solid rgba(200, 241, 53, 0.25)",
      padding: "10px 16px",
      marginBottom: 32,
    }}>
      <span style={{ fontSize: 13, color: "#c8f135", fontWeight: 500 }}>
        🛠 Developer mode active — full access enabled
      </span>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: "none",
          border: "none",
          color: "rgba(200, 241, 53, 0.5)",
          fontSize: 16,
          cursor: "pointer",
          padding: "0 4px",
          lineHeight: 1,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
