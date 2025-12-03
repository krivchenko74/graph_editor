import { EdgeColor } from "@/types/colors";
import { AlgorithmStep } from "@/types/algorithm";
import { VertexColor } from "@/types/colors";

export const getEdgeColor = (
  edgeId: string,
  currentStep: AlgorithmStep | null,
  isSelected: boolean
): EdgeColor => {
  if (!currentStep) {
    return isSelected ? EdgeColor.SELECTED : EdgeColor.DEFAULT;
  }

  // Проверяем, является ли ребро остаточным/обратным
  const isResidual =
    currentStep.metadata?.residualEdges?.[edgeId] !== undefined;

  if (isResidual) {
    return EdgeColor.HIGHLIGHTED; // Оранжевый для обратных рёбер
  }

  // Порядок приоритетов
  if (currentStep.highlightedEdges?.includes(edgeId)) {
    return EdgeColor.HIGHLIGHTED;
  }

  if (currentStep.metadata?.augmentingPath) {
    const parentMap = currentStep.metadata.parentMap || {};
    // Проверяем, есть ли ребро в пути
    for (const vertexId in parentMap) {
      if (parentMap[vertexId].edgeId === edgeId) {
        return parentMap[vertexId].isForward
          ? EdgeColor.PATH
          : EdgeColor.HIGHLIGHTED;
      }
    }
  }

  if (currentStep.metadata?.pathEdges?.includes(edgeId)) {
    return EdgeColor.PATH;
  }

  if (currentStep.visitedEdges?.includes(edgeId)) {
    return EdgeColor.VISITED;
  }

  if (isSelected) {
    return EdgeColor.SELECTED;
  }

  return EdgeColor.DEFAULT;
};

export const getVertexColor = (
  vertexId: string,
  currentStep: AlgorithmStep | null,
  edgeStartVertexId: string | null
): VertexColor => {
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
};
