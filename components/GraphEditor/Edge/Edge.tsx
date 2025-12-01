// Edge.tsx (обновлённая версия)
"use client";

import { useState, useRef, useEffect } from "react";
import { TEdge, TVertex } from "@/types/graph";
import { EdgeColor } from "@/types/colors";
import { AlgorithmStep } from "@/types/algorithm";

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
  animationColor?: EdgeColor;
  // Для алгоритма потока
  currentStep?: AlgorithmStep;
  stepIndex?: number;
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
  currentStep,
  stepIndex = 0,
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

  // Получаем данные о потоке из metadata
  const getFlowData = (): any | null => {
    if (!currentStep?.metadata) return null;

    const { flows, residualFlows } = currentStep.metadata;

    // Проверяем основные рёбра
    if (flows && flows[edge.id]) {
      return flows[edge.id];
    }

    // Проверяем остаточные рёбра
    if (residualFlows && residualFlows[edge.id]) {
      return residualFlows[edge.id];
    }

    return null;
  };

  const flowData = getFlowData();
  const currentFlow = flowData?.flow || 0;
  const residualCapacity = flowData?.residual || 0;
  const isResidualEdge = flowData?.isResidual || false;
  const showFlowInfo = currentFlow > 0 || isResidualEdge;

  // Проверяем, является ли ребро частью текущего увеличивающего пути
  const isInPath = currentStep?.metadata?.augmentingPath
    ? isEdgeInPath(edge, currentStep.metadata.augmentingPath)
    : false;

  // Для остаточного ребра меняем направление отображения
  const effectiveSource = isResidualEdge ? target : source;
  const effectiveTarget = isResidualEdge ? source : target;

  const x1 = effectiveSource.x,
    y1 = effectiveSource.y;
  const x2 = effectiveTarget.x,
    y2 = effectiveTarget.y;

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

  // Для остаточных рёбер немного смещаем кривизну, чтобы не накладывались
  const effectiveCurvature = isResidualEdge
    ? curvature === 0
      ? 0.3
      : Math.sign(curvature) * Math.min(Math.abs(curvature) + 0.3, 1)
    : curvature;

  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  const perpX = -uy,
    perpY = ux;
  const curveDistance = 80;
  const controlX = midX + perpX * curveDistance * effectiveCurvature;
  const controlY = midY + perpY * curveDistance * effectiveCurvature;

  const weightPosT = 0.5;
  const t = weightPosT;
  const weightX =
    (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;
  const weightY =
    (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY;

  const pathD = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
  const arrowId = `arrow-${edge.id}-${stepIndex}`;

  // Определяем цвет ребра
  const getEdgeColor = (): EdgeColor => {
    if (animationColor) return animationColor;

    if (isResidualEdge) {
      // Остаточные рёбра - используем QUEUED (фиолетовый) или HIGHLIGHTED
      return EdgeColor.HIGHLIGHTED;
    }

    if (isInPath) {
      // Рёбра в текущем увеличивающем пути
      return EdgeColor.PATH;
    }

    if (isHighlighted) {
      return EdgeColor.HIGHLIGHTED;
    }

    if (isSelected) {
      return EdgeColor.SELECTED;
    }

    // Для рёбер с потоком - чем больше поток, тем "горячее" цвет
    if (currentFlow > 0 && !isResidualEdge) {
      const capacity = edge.weight ?? 1;
      const utilization = currentFlow / capacity;

      if (utilization >= 0.9) return EdgeColor.SELECTED; // Почти красный
      if (utilization >= 0.7) return EdgeColor.HIGHLIGHTED; // Оранжевый
      if (utilization >= 0.3) return EdgeColor.VISITED; // Зелёный
      return EdgeColor.PATH; // Голубой для малого потока
    }

    return EdgeColor.DEFAULT;
  };

  const edgeColor = getEdgeColor();

  // Толщина ребра
  const getStrokeWidth = (): number => {
    if (isSelected) return 3.5;
    if (isInPath) return 3;

    if (currentFlow > 0 && !isResidualEdge) {
      const capacity = edge.weight ?? 1;
      const utilization = currentFlow / capacity;
      return 2 + utilization * 1.2;
    }

    return isResidualEdge ? 2 : 2.5;
  };

  // Стиль линии
  const getStrokeDasharray = (): string => {
    return isResidualEdge ? "5,3" : "none";
  };

  // Функция для проверки, находится ли ребро в пути
  function isEdgeInPath(edge: TEdge, path: string[]): boolean {
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      if (
        (edge.source === u && edge.target === v) ||
        (edge.source === v && edge.target === u)
      ) {
        return true;
      }
    }
    return false;
  }

  // === Обработка удаления ===
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

      const deltaY = (startPos.current.y - e.clientY) / zoom;
      const newCurvature = startPos.current.curvature + deltaY * 0.0035;
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

  // === Перетаскивание изгиба ===
  const handleEdgeMouseDown = (e: React.MouseEvent) => {
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

  // === Клик на ребро ===
  const handleEdgeClick = (e: React.MouseEvent) => {
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

  const handleWeightKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setIsEditingWeight(false);
    }
  };

  // Текст для отображения на ребре
  const getEdgeText = (): string => {
    if (showFlowInfo && !isResidualEdge) {
      const capacity = edge.weight ?? 1;
      return `${currentFlow}/${capacity}`;
    }

    if (isResidualEdge && residualCapacity > 0) {
      return `r:${residualCapacity}`;
    }

    return `${edge.weight ?? 1}`;
  };

  // Фон для метки
  const getLabelBackground = (): string => {
    if (isSelected) return "#fee2e2";
    if (isResidualEdge) return "#faf5ff";
    if (isInPath) return "#f0f9ff";
    if (isHighlighted) return "#fffbeb";
    return "white";
  };

  // Цвет текста
  const getLabelTextColor = (): string => {
    if (isSelected) return "#dc2626";
    if (isResidualEdge) return "#7c3aed";
    if (isInPath) return "#0284c7";
    if (isHighlighted) return "#f59e0b";
    if (currentFlow > 0 && !isResidualEdge) {
      const capacity = edge.weight ?? 1;
      const utilization = currentFlow / capacity;
      if (utilization >= 0.9) return "#dc2626";
      if (utilization >= 0.7) return "#f59e0b";
      if (utilization >= 0.3) return "#10b981";
      return "#06b6d4";
    }
    return "#374151";
  };

  // Граница метки
  const getLabelBorderColor = (): string => {
    if (isSelected) return "#dc2626";
    if (isResidualEdge) return "#7c3aed";
    if (isInPath) return "#0284c7";
    if (isHighlighted) return "#f59e0b";
    return "#e2e8f0";
  };

  return (
    <>
      {/* Стрелка */}
      {(edge.directed || isResidualEdge) && (
        <defs>
          <marker
            id={arrowId}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L6,3 z" fill={edgeColor} />
          </marker>
        </defs>
      )}

      {/* Основное ребро */}
      <path
        d={pathD}
        fill="none"
        stroke={edgeColor}
        strokeWidth={getStrokeWidth()}
        strokeDasharray={getStrokeDasharray()}
        markerEnd={
          edge.directed || isResidualEdge ? `url(#${arrowId})` : undefined
        }
        pointerEvents="stroke"
        cursor={isDragging ? "ns-resize" : "pointer"}
        onClick={handleEdgeClick}
        onMouseDown={handleEdgeMouseDown}
        style={{
          transition: isDragging ? "none" : "all 0.3s ease",
          opacity: isResidualEdge ? 0.7 : 1,
        }}
      />

      {/* Метка с весом/потоком */}
      <foreignObject
        x={weightX - 35}
        y={weightY - 25}
        width="70"
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
              onBlur={() => setIsEditingWeight(false)}
              onKeyDown={handleWeightKeyDown}
              style={{
                width: "60px",
                textAlign: "center",
                fontWeight: "600",
                border: "2px solid #3b82f6",
                borderRadius: "4px",
                fontSize: "14px",
                background: "white",
                zIndex: 20,
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              onDoubleClick={handleWeightDoubleClick}
              style={{
                padding: "4px 8px",
                background: getLabelBackground(),
                border: `2px solid ${getLabelBorderColor()}`,
                borderRadius: "6px",
                cursor: "text",
                fontWeight: "600",
                userSelect: "none",
                fontSize: "14px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                minWidth: "40px",
                textAlign: "center",
                color: getLabelTextColor(),
                zIndex: 20,
              }}
            >
              {getEdgeText()}
            </div>
          )}
        </div>
      </foreignObject>
    </>
  );
};
