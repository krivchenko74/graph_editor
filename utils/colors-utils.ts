import { EdgeColor } from "@/types/colors";
import { AlgorithmStep } from "@/types/algorithm";
import { VertexColor } from "@/types/colors";

export const getEdgeColor = (
  edgeId: string,
  currentStep: AlgorithmStep | null,
  isSelected: boolean
): EdgeColor => {
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
