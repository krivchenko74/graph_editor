// components/GraphEditor/Vertex/Vertex.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import styles from "./Vertex.module.css";
import { VertexColor } from "@/types/colors";

export type VertexData = {
  id: string;
  x: number; // screen X
  y: number; // screen Y
  text: string;
};

type VertexProps = {
  vertex: VertexData;
  zoom: number;
  offset: { x: number; y: number };
  onUpdate: (id: string, updates: Partial<VertexData>) => void;
  onDelete?: (id: string) => void;
  onClick: (id: string, event?: React.MouseEvent) => void;
  isSelected: boolean;
  animationColor?: VertexColor;
  isStartVertex?: boolean;
  isEndVertex?: boolean;
};

export default function Vertex({
  vertex,
  zoom,
  offset,
  onUpdate,
  onDelete,
  onClick,
  isSelected,
  animationColor,
  isStartVertex = false,
  isEndVertex = false,
}: VertexProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Состояние для временного хранения позиции при перетаскивании
  const [tempPosition, setTempPosition] = useState({
    x: vertex.x,
    y: vertex.y,
  });
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);

  // Синхронизируем временную позицию с актуальной вершиной
  useEffect(() => {
    if (!isDraggingRef.current) {
      setTempPosition({ x: vertex.x, y: vertex.y });
    }
  }, [vertex.x, vertex.y]);

  // Autofocus on edit
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Drag
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    const startClientX = e.clientX;
    const startClientY = e.clientY;

    const startScreenX = tempPosition.x;
    const startScreenY = tempPosition.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const dx = moveEvent.clientX - startClientX;
      const dy = moveEvent.clientY - startClientY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedRef.current = true;
      }

      const newScreenX = startScreenX + dx;
      const newScreenY = startScreenY + dy;
      setTempPosition({ x: newScreenX, y: newScreenY });

      const worldX = (newScreenX - offset.x) / zoom;
      const worldY = (newScreenY - offset.y) / zoom;
      onUpdate(vertex.id, { x: worldX, y: worldY });
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Если вершина была перемещена, не вызываем onClick
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }

    onClick(vertex.id, e);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Если вершина была перемещена, не вызываем редактирование
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }

    setIsEditing(true);
  };

  const handleTextChange = (text: string) => {
    onUpdate(vertex.id, { text });
  };

  const handleBlur = () => setIsEditing(false);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Escape") setIsEditing(false);
  };

  // Delete
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

  // Используем временную позицию при перетаскивании, иначе актуальную
  const displayX = isDraggingRef.current ? tempPosition.x : vertex.x;
  const displayY = isDraggingRef.current ? tempPosition.y : vertex.y;

  // Определяем дополнительные классы для стилей
  const getVertexClasses = () => {
    const classes = [styles.vertex];

    if (isStartVertex) classes.push(styles.startVertex);
    if (isEndVertex) classes.push(styles.endVertex);
    if (isSelected) classes.push(styles.selected);

    return classes.join(" ");
  };

  // Определяем border color с приоритетами
  const getBorderColor = () => {
    // Самый высокий приоритет - анимация
    if (animationColor) {
      return animationColor;
    }

    // Затем специальные статусы вершин
    if (isStartVertex) return VertexColor.START;
    if (isEndVertex) return VertexColor.END;

    // Затем выделение для создания ребер
    if (isSelected) return VertexColor.SELECTED;

    // По умолчанию
    return VertexColor.DEFAULT;
  };

  // Получаем подсказку для вершины
  const getTitle = () => {
    if (isStartVertex) return `Стартовая вершина: ${vertex.text}`;
    if (isEndVertex) return `Конечная вершина: ${vertex.text}`;
    return `Вершина: ${vertex.text}`;
  };

  return (
    <div
      onClick={handleClick}
      className={getVertexClasses()}
      style={{
        left: displayX - 20,
        top: displayY - 20,
        borderColor: getBorderColor(),
        cursor: isDraggingRef.current ? "grabbing" : "pointer",
        transition: isDraggingRef.current ? "none" : "all 0.15s ease",
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      title={getTitle()}
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
  );
}
