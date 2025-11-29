// components/GraphEditor/GraphEditor.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Vertex from "./Vertex/Vertex";
import { Edge } from "./Edge/Edge";
import { TEdge, TVertex } from "@/types/graph";
import { useGraphStore } from "@/stores/graph-store";
import styles from "./GraphEditor.module.css";
import { useGraphStorage } from "@/hooks/useGraphStorage";
import { useVisualization } from "@/hooks/useVisualization";
import { getEdgeColor, getVertexColor } from "@/utils/colors-utils";
import Logs from "../Logs/Logs";

const CANVAS_SIZE = 5000;

export default function GraphEditor() {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [edgeStartVertexId, setEdgeStartVertexId] = useState<string | null>(
    null
  );
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const { isRunning, currentStep, steps } = useVisualization();
  const containerRef = useRef<HTMLDivElement>(null);

  useGraphStorage();

  const {
    graph,
    addVertex,
    addEdge,
    updateVertex,
    deleteVertex,
    updateEdge,
    deleteEdge,
  } = useGraphStore();

  // ==== CREATE VERTEX (double click) ====
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const worldX = (e.clientX - rect.left - offset.x) / zoom;
    const worldY = (e.clientY - rect.top - offset.y) / zoom;

    const newVertex: TVertex = {
      id: Date.now().toString(),
      x: worldX,
      y: worldY,
      text: (graph.vertices.length + 1).toString(),
      index: graph.vertices.length, // автоматический индекс
    };

    addVertex(newVertex);
  };

  // ==== CLICK ON VERTEX (edges) ====
  const handleVertexClick = (id: string, event?: React.MouseEvent) => {
    if (!edgeStartVertexId) {
      setEdgeStartVertexId(id);
      return;
    }
    if (edgeStartVertexId === id) {
      setEdgeStartVertexId(null);
      return;
    }

    // Проверяем, нажата ли клавиша Alt в момент клика
    const isShiftPressed = event ? event.shiftKey : false;

    const newEdge: TEdge = {
      id: Date.now().toString(),
      source: edgeStartVertexId,
      target: id,
      directed: isShiftPressed, // направленное только при нажатом Alt
      weight: 1,
      curvature: 0,
    };
    addEdge(newEdge);

    setEdgeStartVertexId(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (
      e.target === containerRef.current ||
      (e.target as HTMLElement).closest("svg") ||
      (e.target as HTMLElement).tagName === "svg"
    ) {
      setEdgeStartVertexId(null);
      setSelectedEdgeId(null);
    }
  };

  // ==== ZOOM (cursor-centered) ====
  const clampView = (newZoom: number, newOffset: { x: number; y: number }) => {
    if (!containerRef.current) return { zoom: newZoom, offset: newOffset };

    const container = containerRef.current.getBoundingClientRect();
    const minZoom = Math.max(
      container.width / CANVAS_SIZE,
      container.height / CANVAS_SIZE
    );

    const z = Math.max(minZoom, Math.min(newZoom, 5));

    const minX = container.width - CANVAS_SIZE * z;
    const minY = container.height - CANVAS_SIZE * z;

    return {
      zoom: z,
      offset: {
        x: Math.min(0, Math.max(minX, newOffset.x)),
        y: Math.min(0, Math.max(minY, newOffset.y)),
      },
    };
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) return;

    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.95 : 1.05;

    const newZoomRaw = zoom * delta;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - offset.x) / zoom;
    const worldY = (mouseY - offset.y) / zoom;

    const newOffsetRaw = {
      x: mouseX - worldX * newZoomRaw,
      y: mouseY - worldY * newZoomRaw,
    };

    const { zoom: finalZoom, offset: finalOffset } = clampView(
      newZoomRaw,
      newOffsetRaw
    );
    setZoom(finalZoom);
    setOffset(finalOffset);
  };

  // ==== PAN ====
  const handleMouseDown = (e: React.MouseEvent) => {
    const shouldPan = e.button === 1 || (e.button === 0 && e.shiftKey);
    if (!shouldPan) return;

    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  // ==== SHIFT ====
  useEffect(() => {
    const down = (e: KeyboardEvent) =>
      e.key === "Shift" && setIsShiftPressed(true);
    const up = (e: KeyboardEvent) =>
      e.key === "Shift" && setIsShiftPressed(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // ==== UPDATE VERTEX POSITION (оптимизированная версия) ====
  const handleVertexUpdate = (id: string, updates: Partial<TVertex>) => {
    updateVertex(id, updates);
  };

  // ==== UPDATE EDGE ====
  const handleEdgeUpdate = (id: string, updates: Partial<TEdge>) => {
    updateEdge(id, updates);
  };
  // ==== DELETE VERTEX ====
  const handleVertexDelete = (id: string) => {
    deleteVertex(id);
  };

  // ==== SVG viewBox ====
  const viewBox = containerRef.current
    ? `${-offset.x / zoom} ${-offset.y / zoom} ${
        containerRef.current.clientWidth / zoom
      } ${containerRef.current.clientHeight / zoom}`
    : "0 0 1000 1000";

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
      onDoubleClick={handleCanvasDoubleClick}
      style={{
        cursor: isDragging ? "grabbing" : isShiftPressed ? "grab" : "default",
      }}
    >
      {/* === HTML VERTEX LAYER (пиксельные координаты, без scale!) === */}
      <div
        className={styles.canvas}
        style={{
          position: "absolute",
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          pointerEvents: "none",
        }}
      >
        {graph.vertices.map((v: TVertex) => {
          const screenX = offset.x + v.x * zoom;
          const screenY = offset.y + v.y * zoom;
          const animationColor = getVertexColor(
            v.id,
            currentStep,
            edgeStartVertexId
          );
          return (
            <div
              key={v.id}
              style={{ pointerEvents: isRunning ? "none" : "all" }}
            >
              <Vertex
                vertex={{ ...v, x: screenX, y: screenY }}
                zoom={zoom}
                offset={offset}
                isSelected={edgeStartVertexId === v.id}
                onClick={(id, event) => {
                  if (isRunning) return;
                  handleVertexClick(id, event);
                }}
                onUpdate={handleVertexUpdate}
                onDelete={handleVertexDelete}
                animationColor={animationColor}
              />
            </div>
          );
        })}
      </div>

      {/* === SVG EDGE LAYER === */}
      <svg
        className={styles.edgesLayer}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          overflow: "visible",
        }}
        viewBox={viewBox}
      >
        {graph.edges.map((e: TEdge) => {
          const animationColor = getEdgeColor(
            e.id,
            currentStep,
            e.id === selectedEdgeId
          );

          return (
            <Edge
              key={e.id}
              edge={e}
              vertices={Object.fromEntries(
                graph.vertices.map((v: TVertex) => [v.id, v])
              )}
              zoom={zoom}
              onUpdate={handleEdgeUpdate}
              onSelect={setSelectedEdgeId}
              onDelete={deleteEdge}
              isSelected={e.id === selectedEdgeId}
              animationColor={animationColor}
            />
          );
        })}
      </svg>
      <Logs steps={steps} currentStepIndex={steps.indexOf(currentStep!)} />
    </div>
  );
}
