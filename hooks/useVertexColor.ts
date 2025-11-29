// hooks/useVertexColor.ts
import { useMemo } from "react";
import { VertexColor } from "@/types/colors";
import { AlgorithmStep } from "@/types/algorithm";

export const useVertexColor = (
  vertexId: string,
  currentStep: AlgorithmStep | null,
  edgeStartVertexId: string | null
): VertexColor | undefined => {
  return useMemo(() => {
    // Если нет текущего шага визуализации
    if (!currentStep) {
      return edgeStartVertexId === vertexId
        ? VertexColor.SELECTED
        : VertexColor.DEFAULT;
    }

    // Порядок приоритетов (от высшего к низшему)

    // 1. Текущая обрабатываемая вершина
    if (vertexId === currentStep.currentVertexId) {
      return VertexColor.CURRENT; // Оранжевый
    }

    // 2. Посещенная вершина
    if (currentStep.visitedVertices.includes(vertexId)) {
      return VertexColor.VISITED; // Зеленый
    }

    // 3. Вершина в очереди/стеке
    if (
      currentStep.stack?.includes(vertexId) ||
      currentStep.queue?.includes(vertexId)
    ) {
      return VertexColor.QUEUED; // Фиолетовый
    }

    // 4. Подсвеченная вершина (для специальных случаев)
    if (currentStep.highlightedVertices?.includes(vertexId)) {
      return VertexColor.PATH; // Голубой
    }

    // 5. Выделенная вершина (для создания ребер)
    if (edgeStartVertexId === vertexId) {
      return VertexColor.SELECTED; // Красный
    }

    // 6. Вершина в пути (если есть метаданные пути)
    if (currentStep.metadata?.path?.includes(vertexId)) {
      return VertexColor.PATH; // Голубой
    }

    // Вершина по умолчанию
    return VertexColor.DEFAULT; // Синий
  }, [vertexId, currentStep, edgeStartVertexId]);
};
