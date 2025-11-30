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
  const [draggingVertexId, setDraggingVertexId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isRunning,
    currentStep,
    steps,
    isSelectingStartVertex,
    isSelectingEndVertex,
    setStartVertex,
    setEndVertex,
    startVertexId,
    endVertexId,
    cancelVertexSelection,
  } = useVisualization();

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
    if (!containerRef.current || isSelectingStartVertex || isSelectingEndVertex)
      return;

    const rect = containerRef.current.getBoundingClientRect();

    // Получаем позицию курсора относительно контейнера
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Преобразуем в мировые координаты с учетом zoom и offset
    const worldX = (clientX - offset.x) / zoom;
    const worldY = (clientY - offset.y) / zoom;

    const newVertex: TVertex = {
      id: Date.now().toString(),
      x: worldX,
      y: worldY,
      text: (graph.vertices.length + 1).toString(),
      index: graph.vertices.length,
    };

    addVertex(newVertex);
  };

  // ==== CLICK ON VERTEX (edges) ====
  const handleVertexClick = (id: string, event?: React.MouseEvent) => {
    if (isRunning) return;

    const isAltPressed = event ? event.altKey : false;

    // Alt+клик - выбор стартовой/конечной вершины
    if (isAltPressed) {
      // Если уже выбрана как стартовая - снимаем выбор
      if (id === startVertexId) {
        setStartVertex(null);
        return;
      }
      // Если уже выбрана как конечная - снимаем выбор
      if (id === endVertexId) {
        setEndVertex(null);
        return;
      }

      // Выбираем вершину
      if (!startVertexId) {
        setStartVertex(id);
      } else if (!endVertexId) {
        setEndVertex(id);
      }
      return;
    }

    // Обычный клик - существующая логика создания рёбер
    if (!edgeStartVertexId) {
      setEdgeStartVertexId(id);
      return;
    }
    if (edgeStartVertexId === id) {
      setEdgeStartVertexId(null);
      return;
    }

    const isShiftPressed = event ? event.shiftKey : false;
    const newEdge: TEdge = {
      id: Date.now().toString(),
      source: edgeStartVertexId,
      target: id,
      directed: isShiftPressed,
      weight: 1,
      curvature: 0,
    };
    addEdge(newEdge);
    setEdgeStartVertexId(null);
  };

  // ==== VERTEX DRAG HANDLERS ====
  const handleVertexDragStart = (
    id: string,
    clientX: number,
    clientY: number
  ) => {
    setDraggingVertexId(id);
    setIsDragging(true);
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleVertexDrag = (clientX: number, clientY: number) => {
    if (!draggingVertexId || !isDragging) return;

    // Вычисляем смещение в мировых координатах
    const deltaX = (clientX - offset.x - dragStart.x) / zoom;
    const deltaY = (clientY - offset.y - dragStart.y) / zoom;

    // Получаем текущую позицию вершины
    const vertex = graph.vertices.find((v) => v.id === draggingVertexId);
    if (!vertex) return;

    // Обновляем позицию
    const newX = vertex.x + deltaX;
    const newY = vertex.y + deltaY;

    updateVertex(draggingVertexId, { x: newX, y: newY });

    // Обновляем начальную позицию для следующего движения
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleVertexDragEnd = () => {
    setDraggingVertexId(null);
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (
      e.target === containerRef.current ||
      (e.target as HTMLElement).closest("svg") ||
      (e.target as HTMLElement).tagName === "svg"
    ) {
      setEdgeStartVertexId(null);
      setSelectedEdgeId(null);

      // Отменяем выбор вершин при клике на пустую область
      if (isSelectingStartVertex || isSelectingEndVertex) {
        cancelVertexSelection();
      }
    }
  };

  // ==== GLOBAL MOUSE HANDLERS FOR DRAGGING ====
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && draggingVertexId) {
        handleVertexDrag(e.clientX, e.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleVertexDragEnd();
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, draggingVertexId, zoom, offset, graph.vertices]);

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
    if (!shouldPan || draggingVertexId) return;

    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || draggingVertexId) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    if (!draggingVertexId) {
      setIsDragging(false);
    }
  };

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

  // ==== UPDATE VERTEX POSITION ====
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

  const getSelectionIndicator = () => {
    if (isSelectingStartVertex) {
      return "🟢 Выберите стартовую вершину";
    }
    if (isSelectingEndVertex) {
      return "🔴 Выберите конечную вершину";
    }
    return null;
  };

  // Создаем объект с вершинами для быстрого доступа
  const verticesMap = Object.fromEntries(
    graph.vertices.map((v: TVertex) => [v.id, v])
  );

  return (
    <div
      ref={containerRef}
      className={styles.container + " " + styles.canvas}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
      onDoubleClick={handleCanvasDoubleClick}
      style={{
        cursor: isDragging
          ? draggingVertexId
            ? "grabbing"
            : "grabbing"
          : isShiftPressed
          ? "grab"
          : "default",
      }}
    >
      {/* Индикатор выбора вершин */}
      {(isSelectingStartVertex || isSelectingEndVertex) && (
        <div className={styles.selectionIndicator}>
          {getSelectionIndicator()}
          <button
            onClick={cancelVertexSelection}
            className={styles.cancelSelectionButton}
          >
            Отмена
          </button>
        </div>
      )}

      {/* === ЕДИНЫЙ SVG LAYER (вершины + рёбра) === */}
      <svg
        className={styles.svgLayer}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: isDragging && draggingVertexId ? "none" : "none",
          overflow: "visible",
        }}
        viewBox={viewBox}
      >
        {/* Рёбра */}
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
              vertices={verticesMap}
              zoom={zoom}
              onUpdate={handleEdgeUpdate}
              onSelect={setSelectedEdgeId}
              onDelete={deleteEdge}
              isSelected={e.id === selectedEdgeId}
              animationColor={animationColor}
            />
          );
        })}

        {/* Вершины как foreignObject */}
        {graph.vertices.map((v: TVertex) => {
          const animationColor = getVertexColor(
            v.id,
            currentStep,
            edgeStartVertexId
          );

          return (
            <g key={v.id} transform={`translate(${v.x}, ${v.y})`}>
              <foreignObject
                x={-20}
                y={-20}
                width={40}
                height={40}
                style={{
                  pointerEvents: isRunning ? "none" : "all",
                  overflow: "visible",
                }}
              >
                <Vertex
                  vertex={v}
                  onUpdate={handleVertexUpdate}
                  onDelete={handleVertexDelete}
                  onClick={handleVertexClick}
                  onDragStart={handleVertexDragStart}
                  onDrag={handleVertexDrag}
                  onDragEnd={handleVertexDragEnd}
                  isSelected={edgeStartVertexId === v.id}
                  isStartVertex={startVertexId === v.id}
                  isEndVertex={endVertexId === v.id}
                  animationColor={animationColor}
                  currentStep={currentStep}
                  zoom={zoom}
                  isDragging={draggingVertexId === v.id}
                />
              </foreignObject>
            </g>
          );
        })}
      </svg>

      <Logs steps={steps} currentStepIndex={steps.indexOf(currentStep!)} />
    </div>
  );
}
