// components/GraphEditor/Vertex/Vertex.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import styles from "./Vertex.module.css";
import { VertexColor } from "@/types/colors";

export type VertexData = {
  id: string;
  x: number;
  y: number;
  text: string;
};

type VertexProps = {
  vertex: VertexData;
  onUpdate: (id: string, updates: Partial<VertexData>) => void;
  onDelete?: (id: string) => void;
  onClick: (id: string, event?: React.MouseEvent) => void;
  onDragStart: (id: string, clientX: number, clientY: number) => void;
  onDrag: (clientX: number, clientY: number) => void;
  onDragEnd: () => void;
  isSelected: boolean;
  animationColor?: VertexColor;
  isStartVertex?: boolean;
  isEndVertex?: boolean;
  zoom?: number;
  currentStep?: any;
  isDragging?: boolean;
};

export default function Vertex({
  vertex,
  onUpdate,
  onDelete,
  onClick,
  onDragStart,
  onDrag,
  onDragEnd,
  isSelected,
  animationColor,
  isStartVertex = false,
  isEndVertex = false,
  zoom = 1,
  currentStep,
  isDragging = false,
}: VertexProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const vertexRef = useRef<HTMLDivElement>(null);

  // Autofocus on edit
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Начинаем перетаскивание
    onDragStart(vertex.id, e.clientX, e.clientY);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(vertex.id, e);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleTextChange = (text: string) => {
    onUpdate(vertex.id, { text });
  };

  const handleBlur = () => setIsEditing(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Escape") setIsEditing(false);
  };

  // Delete handler
  useEffect(() => {
    if (!isSelected || isEditing) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        onDelete?.(vertex.id);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isEditing, vertex.id, onDelete, isSelected]);

  // Определяем border color с приоритетами
  const getBorderColor = () => {
    if (animationColor) return animationColor;
    if (isStartVertex) return VertexColor.START;
    if (isEndVertex) return VertexColor.END;
    if (isSelected) return VertexColor.SELECTED;
    return VertexColor.DEFAULT;
  };

  // Получаем расстояние для алгоритмов (Прима, Дейкстра)
  const getDistance = () => {
    return currentStep?.metadata?.distances?.[vertex.id];
  };

  const getTitle = () => {
    if (isStartVertex) return `Стартовая вершина: ${vertex.text}`;
    if (isEndVertex) return `Конечная вершина: ${vertex.text}`;
    return `Вершина: ${vertex.text}`;
  };

  const distance = getDistance();
  const borderColor = getBorderColor();

  return (
    <div
      ref={vertexRef}
      className={styles.vertexContainer}
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        width: "40px",
        height: "40px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      title={getTitle()}
    >
      {/* Основной круг вершины */}
      <div
        className={styles.vertex}
        style={{
          borderColor: borderColor,
          transition: isDragging ? "none" : "all 0.15s ease",
          transform: isDragging ? "scale(1.1)" : "scale(1)",
          boxShadow: isDragging
            ? "0 4px 12px rgba(0, 0, 0, 0.3)"
            : "0 2px 6px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* Индикатор специального статуса */}
        {(isStartVertex || isEndVertex) && (
          <div className={styles.statusIndicator}>
            {isStartVertex && "🚀"}
            {isEndVertex && "🎯"}
          </div>
        )}

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={vertex.text}
            onChange={(e) => handleTextChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className={styles.input}
          />
        ) : (
          <span className={styles.text}>{vertex.text}</span>
        )}
      </div>

      {/* Бейдж с расстоянием для алгоритмов */}
      {distance !== undefined && distance !== Infinity && (
        <div className={styles.distanceBadge}>{distance}</div>
      )}
    </div>
  );
}
