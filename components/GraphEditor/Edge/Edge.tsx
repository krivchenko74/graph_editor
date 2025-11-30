"use client";

import { useState, useRef, useEffect } from "react";
import { TEdge, TVertex } from "@/types/graph";
import { EdgeColor } from "@/types/colors";

type EdgeProps = {
  edge: TEdge;
  vertices: Record<string, TVertex>;
  zoom: number;
  onUpdate: (id: string, updates: Partial<TEdge>) => void;
  onDelete: (id: string) => void;
  onWeightClick?: (e: React.MouseEvent) => void;
  isSelected?: boolean;
  onSelect?: (id: string | null) => void;
  isHighlighted?: boolean;
  animationColor?: EdgeColor; // Цвет для анимации
};

export const Edge = ({
  edge,
  vertices,
  zoom,
  onUpdate,
  onDelete,
  onWeightClick,
  isSelected = false,
  onSelect,
  isHighlighted,
  animationColor,
}: EdgeProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const startPos = useRef<{ x: number; y: number; curvature: number } | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const source = vertices[edge.source];
  const target = vertices[edge.target];
  if (!source || !target) return null;

  const x1 = source.x,
    y1 = source.y;
  const x2 = target.x,
    y2 = target.y;

  const vertexRadius = 20;
  const startOffset = vertexRadius;
  const endOffset = edge.directed ? vertexRadius + 10 : vertexRadius;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length,
    uy = dy / length;

  const startX = x1 + ux * startOffset;
  const startY = y1 + uy * startOffset;
  const endX = x2 - ux * endOffset;
  const endY = y2 - uy * endOffset;

  const curvature = edge.curvature ?? 0;

  // Вычисляем середину между смещенными точками
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  // Перпендикулярный вектор
  const perpX = -uy,
    perpY = ux;

  // Контрольная точка для кривой Безье - всегда на фиксированном расстоянии от середины
  const curveDistance = 80;
  const controlX = midX + perpX * curveDistance * curvature;
  const controlY = midY + perpY * curveDistance * curvature;

  // Позиция для веса - на самой кривой, а не на прямой между вершинами
  const weightPosT = 0.5; // Параметр t для позиции на кривой (0-1)

  // Вычисляем точку на кривой Безье для веса
  const t = weightPosT;
  const weightX =
    (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;
  const weightY =
    (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY;

  const pathD = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
  const arrowId = `arrow-${edge.id}`;

  // Определяем цвет ребра
  const edgeColor =
    animationColor ||
    (isHighlighted
      ? EdgeColor.HIGHLIGHTED
      : isSelected
      ? EdgeColor.SELECTED
      : EdgeColor.DEFAULT);

  // === Обработка удаления по Backspace/Delete ===
  useEffect(() => {
    if (!isSelected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        onDelete(edge.id);
        onSelect?.(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSelected, edge.id, onDelete, onSelect]);

  // === Глобальное отслеживание мыши для перетаскивания ===
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!startPos.current) return;

      // Вычисляем вектор от середины ребра к текущей позиции мыши
      const deltaY = (startPos.current.y - e.clientY) / zoom;
      const newCurvature = startPos.current.curvature + deltaY * 0.0035;

      // Ограничиваем изгиб
      const clampedCurvature = Math.max(-1, Math.min(1, newCurvature));
      onUpdate(edge.id, { curvature: clampedCurvature });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      startPos.current = null;
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, zoom, edge.id, onUpdate]);

  // === Перетаскивание изгиба по ребру ===
  const handleEdgeMouseDown = (e: React.MouseEvent) => {
    // Клик на вес - не начинаем перетаскивание
    if ((e.target as HTMLElement).closest("foreignObject")) return;

    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      curvature: edge.curvature ?? 0,
    };
    onSelect?.(edge.id);
  };

  // === Клик на ребро (выделение) ===
  const handleEdgeClick = (e: React.MouseEvent) => {
    // Клик на вес - не выделяем ребро
    if ((e.target as HTMLElement).closest("foreignObject")) return;

    e.stopPropagation();
    onSelect?.(edge.id);
  };

  // === Редактирование веса ===
  const handleWeightDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingWeight(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    onUpdate(edge.id, { weight: Math.max(1, value) });
  };

  const handleWeightBlur = () => setIsEditingWeight(false);

  const handleWeightKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setIsEditingWeight(false);
    }
  };

  const handleInputBlur = () => {
    setIsEditingWeight(false);
  };

  return (
    <>
      {/* Стрелка */}
      {edge.directed && (
        <defs>
          <marker
            id={arrowId}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path
              d="M0,0 L0,6 L6,3 z"
              fill={
                edgeColor === EdgeColor.SELECTED
                  ? "#ef4444"
                  : edgeColor === EdgeColor.HIGHLIGHTED
                  ? "#f97316"
                  : edgeColor === EdgeColor.VISITED
                  ? "#22c55e"
                  : edgeColor === EdgeColor.PATH
                  ? "#0ea5e9"
                  : "#64748b"
              }
            />
          </marker>
        </defs>
      )}

      {/* Основное ребро - теперь с pointerEvents для обработки анимации */}
      <path
        d={pathD}
        fill="none"
        stroke={edgeColor}
        strokeWidth={isSelected ? "3.5" : "2.5"}
        markerEnd={edge.directed ? `url(#${arrowId})` : undefined}
        pointerEvents="stroke" // ← ИЗМЕНЕНИЕ: теперь обрабатывает события
        cursor={isDragging ? "ns-resize" : "pointer"}
        onClick={handleEdgeClick}
        onMouseDown={handleEdgeMouseDown}
        style={{
          transition: isDragging ? "none" : "cursor 0.2s ease",
        }}
      />

      {/* Вес ребра - позиционируется на кривой */}
      <foreignObject
        x={weightX - 30}
        y={weightY - 25}
        width="60"
        height="40"
        pointerEvents="all"
        onClick={onWeightClick}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          {isEditingWeight ? (
            <input
              ref={inputRef}
              type="number"
              min="1"
              defaultValue={edge.weight ?? 1}
              onChange={handleWeightChange}
              onBlur={handleInputBlur}
              onKeyDown={handleWeightKeyDown}
              style={{
                width: "50px",
                textAlign: "center",
                fontWeight: "600",
                border: "2px solid #3b82f6",
                borderRadius: "4px",
                fontSize: "14px",
                background: "white",
                zIndex: 10,
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              onDoubleClick={handleWeightDoubleClick}
              style={{
                padding: "6px 8px",
                background: "white",
                border: `2px solid ${isSelected ? "#ef4444" : "#e2e8f0"}`,
                borderRadius: "6px",
                cursor: "text",
                fontWeight: "600",
                userSelect: "none",
                fontSize: "14px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                minWidth: "30px",
                textAlign: "center",
                color: isSelected ? "#ef4444" : "#374151",
                zIndex: 10,
                position: "relative",
              }}
            >
              {edge.weight ?? 1}
            </div>
          )}
        </div>
      </foreignObject>
    </>
  );
};
