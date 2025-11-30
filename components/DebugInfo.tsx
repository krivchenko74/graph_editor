// components/DebugInfo.tsx
"use client";
import React from "react";
import { useVisualization } from "@/hooks/useVisualization";

export const DebugInfo: React.FC = () => {
  const { isRunning, step, steps, speed, speedIndex, currentStep } =
    useVisualization();

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        background: "white",
        padding: "10px",
        border: "2px solid red",
        borderRadius: "5px",
        zIndex: 10000,
        fontSize: "12px",
        maxWidth: "300px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
      }}
    >
      <h4 style={{ margin: "0 0 8px 0", color: "red" }}>🐛 Debug Info</h4>
      <div>
        <strong>isRunning:</strong> {isRunning.toString()}
      </div>
      <div>
        <strong>Step:</strong> {step} / {steps.length}
      </div>
      <div>
        <strong>Speed:</strong> {speed}ms (index: {speedIndex})
      </div>
      <div>
        <strong>Current Action:</strong>{" "}
        {currentStep?.description?.substring(0, 30)}...
      </div>
      <div style={{ marginTop: "8px", fontSize: "10px", color: "#666" }}>
        Speeds: [5000, 2000, 1000, 667, 500, 200, 100, 20, 10, 2, 0.2]
      </div>
    </div>
  );
};
