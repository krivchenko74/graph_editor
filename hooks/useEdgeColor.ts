// hooks/useEdgeColor.ts
import { useMemo } from "react";
import { EdgeColor } from "@/types/colors";
import { AlgorithmStep } from "@/types/algorithm";

export const useEdgeColor = (
  edgeId: string,
  currentStep: AlgorithmStep | null,
  isSelected: boolean
): EdgeColor => {
  return useMemo(() => {
    // Если нет текущего шага визуализации
    if (!currentStep) {
      return isSelected ? EdgeColor.SELECTED : EdgeColor.DEFAULT;
    }

    // Порядок приоритетов (от высшего к низшему)

    // 1. Подсвеченное ребро (активное в текущем шаге)
    if (currentStep.highlightedEdges?.includes(edgeId)) {
      return EdgeColor.HIGHLIGHTED; // Оранжевый
    }

    // 2. Ребро в пути (специальное назначение)
    if (currentStep.metadata?.pathEdges?.includes(edgeId)) {
      return EdgeColor.PATH; // Голубой
    }

    // 3. Пройденное ребро
    if (currentStep.visitedEdges?.includes(edgeId)) {
      return EdgeColor.VISITED; // Зеленый
    }

    // 4. Выделенное ребро (пользователем)
    if (isSelected) {
      return EdgeColor.SELECTED; // Красный
    }

    // Ребро по умолчанию
    return EdgeColor.DEFAULT; // Серый
  }, [edgeId, currentStep, isSelected]);
};
