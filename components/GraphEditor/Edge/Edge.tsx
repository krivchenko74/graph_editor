// Edge.tsx - исправленная версия с правильной обработкой обратных рёбер
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
  isSelected?: boolean;
  onSelect?: (id: string | null) => void;
  isHighlighted?: boolean;
  animationColor?: EdgeColor;
  currentStep?: AlgorithmStep;
  stepIndex?: number;
};

export const Edge = ({
  edge,
  vertices,
  zoom,
  onUpdate,
  onDelete,
  isSelected = false,
  onSelect,
  isHighlighted,
  animationColor,
  currentStep,
  stepIndex = 0,
}: EdgeProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [tempWeight, setTempWeight] = useState(edge.weight.toString());

  // Refs
  const weightInputRef = useRef<HTMLInputElement>(null);
  const startPos = useRef<{ x: number; y: number; curvature: number } | null>(
    null
  );

  const source = vertices[edge.source];
  const target = vertices[edge.target];
  if (!source || !target) return null;

  // Автофокус при редактировании
  useEffect(() => {
    if (isEditingWeight && weightInputRef.current) {
      weightInputRef.current.focus();
      weightInputRef.current.select();
    }
  }, [isEditingWeight]);

  // Получаем данные о потоке из metadata
  const getFlowData = () => {
    if (!currentStep?.metadata?.flows) return null;
    return currentStep.metadata.flows[edge.id] || null;
  };

  const flowData = getFlowData();
  const currentFlow = flowData?.flow || 0;
  const capacity = flowData?.capacity || edge.weight || 1;

  // ДЕБАГ: Выводим данные для проверки
  console.log("Edge debug:", {
    edgeId: edge.id,
    currentStep: currentStep?.metadata?.stepDescription,
    flows: currentStep?.metadata?.flows,
    backwardEdgesToShow: currentStep?.metadata?.backwardEdgesToShow,
    hasFlowData: !!flowData,
    currentFlow,
    capacity,
  });

  // Получаем массив обратных рёбер для отображения
  const getBackwardEdgesToShow = (): string[] => {
    if (!currentStep?.metadata?.backwardEdgesToShow) return [];

    const backwardEdges = currentStep.metadata.backwardEdgesToShow;

    // Если это строка (один ID)
    if (typeof backwardEdges === "string") {
      return [backwardEdges];
    }

    // Если это массив
    if (Array.isArray(backwardEdges)) {
      return backwardEdges;
    }

    return [];
  };

  const backwardEdgesToShow = getBackwardEdgesToShow();

  // Показываем обратное ребро если:
  // 1. Оно есть в backwardEdgesToShow
  // 2. ИЛИ текущий поток > 0 (это означает, что есть обратное ребро в остаточной сети)
  const shouldShowBackward =
    backwardEdgesToShow.includes(edge.id) || currentFlow > 0;

  console.log("Should show backward:", {
    edgeId: edge.id,
    inBackwardList: backwardEdgesToShow.includes(edge.id),
    currentFlow,
    shouldShowBackward,
  });

  // Определяем curvature для обратного ребра
  const getBackwardCurvature = () => {
    // Используем специальную curvature из metadata если есть
    if (currentStep?.metadata?.edgeCurvatures) {
      const curvatures = currentStep.metadata.edgeCurvatures as Record<
        string,
        number
      >;
      return curvatures[edge.id] || 0.7;
    }
    return 0.7; // значение по умолчанию
  };

  const getEdgeColor = (isBackward: boolean): string => {
    if (animationColor) {
      return typeof animationColor === "string" ? animationColor : "#000000";
    }

    if (isBackward) {
      return "#f59e0b"; // Оранжевый для обратных рёбер
    }

    if (isSelected) return "#3b82f6";
    if (isHighlighted) return "#f59e0b";

    if (currentFlow > 0) {
      const utilization = currentFlow / capacity;
      if (utilization >= 0.9) return "#dc2626";
      if (utilization >= 0.7) return "#f59e0b";
      if (utilization >= 0.3) return "#10b981";
      return "#059669";
    }

    return "#374151";
  };

  // Обработчик двойного клика по весу ребра
  const handleWeightDoubleClick = (
    e: React.MouseEvent,
    isBackward: boolean
  ) => {
    if (isBackward) return; // Не редактируем вес для обратных рёбер
    e.stopPropagation();
    e.preventDefault();
    setIsEditingWeight(true);
    setTempWeight(edge.weight.toString());
  };

  // Сохранение нового веса
  const handleWeightSave = () => {
    const weight = parseFloat(tempWeight);
    if (!isNaN(weight) && weight > 0) {
      onUpdate(edge.id, { weight });
    }
    setIsEditingWeight(false);
  };

  // Отмена редактирования
  const handleWeightCancel = () => {
    setIsEditingWeight(false);
    setTempWeight(edge.weight.toString());
  };

  const renderEdgePart = (isBackwardPart: boolean) => {
    // ДЛЯ ОБРАТНОГО РЁБРА: отображаем только если shouldShowBackward = true
    if (isBackwardPart && !shouldShowBackward) {
      return null;
    }

    // ДЛЯ ПРЯМОГО РЁБРА: всегда отображаем
    if (!isBackwardPart) {
      // Можно добавить дополнительные условия если нужно
    }

    const effectiveSource = isBackwardPart ? target : source;
    const effectiveTarget = isBackwardPart ? source : target;
    const effectiveCurvature = isBackwardPart
      ? -getBackwardCurvature()
      : edge.curvature ?? 0;

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
    const arrowId = `arrow-${edge.id}-${
      isBackwardPart ? "backward" : "forward"
    }-${stepIndex}`;

    const edgeColor = getEdgeColor(isBackwardPart);
    const strokeWidth = isBackwardPart ? 2.2 : 2.5;
    const strokeDasharray = isBackwardPart ? "5,3" : "none";

    // Для обратного ребра не показываем стрелку (поток в обратном направлении)
    const showArrow = edge.directed && !isBackwardPart;

    return (
      <g key={`${edge.id}-${isBackwardPart ? "backward" : "forward"}`}>
        {showArrow && (
          <defs>
            <marker
              id={arrowId}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,8 L8,4 Z" fill={edgeColor} />
            </marker>
          </defs>
        )}

        <path
          d={pathD}
          fill="none"
          stroke={edgeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          markerEnd={showArrow ? `url(#${arrowId})` : undefined}
          pointerEvents="stroke"
          cursor={isDragging ? "ns-resize" : "pointer"}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("foreignObject")) return;
            e.stopPropagation();
            onSelect?.(edge.id);
          }}
          onDoubleClick={(e) => {
            if (!isBackwardPart) {
              e.stopPropagation();
              e.preventDefault();
              onSelect?.(edge.id);
              setIsEditingWeight(true);
              setTempWeight(edge.weight.toString());
            }
          }}
          onMouseDown={(e) => {
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
          }}
          style={{
            transition: isDragging ? "none" : "all 0.3s ease",
            opacity: isBackwardPart ? 0.8 : 1,
          }}
        />

        {/* МЕТКА ВЕСА/ПОТОКА */}
        <foreignObject
          x={weightX - 35}
          y={weightY - 25}
          width="70"
          height="50"
          pointerEvents="all"
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            {isEditingWeight && !isBackwardPart && isSelected ? (
              <input
                ref={weightInputRef}
                type="number"
                value={tempWeight}
                onChange={(e) => setTempWeight(e.target.value)}
                onBlur={handleWeightSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleWeightSave();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditingWeight(false);
                  }
                  // Останавливаем всплытие событий Backspace/Delete
                  if (e.key === "Backspace" || e.key === "Delete") {
                    e.stopPropagation();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                autoFocus
                min="0.1"
                step="0.1"
                style={{
                  width: "60px",
                  padding: "4px",
                  textAlign: "center",
                  border: "2px solid #3b82f6",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "600",
                  outline: "none",
                }}
              />
            ) : (
              <div
                style={{
                  padding: "4px 8px",
                  background: isBackwardPart ? "#fef3c7" : "white",
                  border: `2px solid ${
                    isSelected
                      ? "#3b82f6"
                      : isBackwardPart
                      ? "#f59e0b"
                      : "#e5e7eb"
                  }`,
                  borderRadius: "6px",
                  cursor: isBackwardPart ? "default" : "pointer",
                  fontWeight: "600",
                  userSelect: "none",
                  fontSize: "14px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  minWidth: "40px",
                  textAlign: "center",
                  color: isBackwardPart ? "#d97706" : "#374151",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isBackwardPart) {
                    onSelect?.(edge.id);
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (!isBackwardPart) {
                    handleWeightDoubleClick(e, isBackwardPart);
                  }
                }}
              >
                {isBackwardPart ? (
                  // Отображение для обратного ребра
                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#d97706",
                        marginBottom: "2px",
                      }}
                    ></div>
                    <div>
                      ←{currentFlow}/{capacity}
                    </div>
                  </div>
                ) : (
                  // Отображение для прямого ребра
                  <div>
                    {currentFlow > 0 ? (
                      <div>
                        {currentFlow}/{capacity}
                      </div>
                    ) : (
                      <div>{edge.weight}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </foreignObject>
      </g>
    );
  };

  // Обработчик клавиш - с защитой от удаления во время редактирования
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Если редактируем вес, блокируем Backspace/Delete
      if (isEditingWeight && (e.key === "Backspace" || e.key === "Delete")) {
        e.stopPropagation();
        return;
      }

      // Обработка только если ребро выбрано и НЕ редактируется
      if (isSelected && !isEditingWeight) {
        if (e.key === "Backspace" || e.key === "Delete") {
          e.preventDefault();
          onDelete(edge.id);
          onSelect?.(null);
        }
      }

      // Глобальные горячие клавиши
      if (e.key === "Escape") {
        if (isEditingWeight) {
          handleWeightCancel();
        } else if (isSelected) {
          onSelect?.(null);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isSelected, isEditingWeight, edge.id, onDelete, onSelect]);

  // Обработчики для перетаскивания кривизны
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

  // Закрытие редактора веса при клике вне его
  useEffect(() => {
    if (!isEditingWeight) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        weightInputRef.current &&
        !weightInputRef.current.contains(e.target as Node)
      ) {
        handleWeightSave();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditingWeight]);

  return (
    <>
      {renderEdgePart(false)}
      {renderEdgePart(true)}
    </>
  );
};
