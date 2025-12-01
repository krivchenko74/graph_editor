import { TVertex, TEdge } from "./graph";
// Универсальный шаг для ВСЕХ алгоритмов
export interface AlgorithmStep {
  // Базовые данные графа
  vertices: Record<string, TVertex>;
  edges: Record<string, TEdge>;

  // Текущее состояние алгоритма
  currentVertexId?: string;
  currentEdgeId?: string; // Для алгоритмов на ребрах (Крускал)

  // Коллекции состояний
  visitedVertices: string[];
  visitedEdges: string[]; // ДОБАВЛЯЕМ - для отслеживания пройденных ребер

  // Структуры данных алгоритмов
  stack?: string[]; // Для DFS
  queue?: string[]; // Для BFS
  priorityQueue?: string[]; // Для Дейкстры, Прима

  // Данные для алгоритмов поиска путей
  distances?: Record<string, number>;
  parents?: Record<string, string | null>;

  // Данные для потоковых алгоритмов
  flow?: Record<string, number>;
  residualGraph?: any;

  // Визуализация
  description: string;
  highlightedVertices?: string[]; // Вершины для подсветки
  highlightedEdges?: string[]; // Ребра для подсветки

  // Универсальное поле для любых данных
  metadata?: Record<string, any>;
}

// types/algorithm.ts
export type AlgorithmType =
  | "dfs"
  | "bfs"
  | "mst"
  | "shortest-path"
  | "max-flow"; // добавить новый тип

export interface AlgorithmRequirements {
  directed?: boolean;
  weighted?: boolean;
  startVertex?: boolean;
  endVertex?: boolean; // добавить требование конечной вершины
}

export interface AlgorithmRequirements {
  directed?: boolean;
  weighted?: boolean;
  endVertex?: boolean;
}

export interface Algorithm {
  name: string;
  type: AlgorithmType;
  description: string;
  requirements?: AlgorithmRequirements;
  start: (
    startVertexId: string,
    endVertexId: string | null,
    vertices: TVertex[],
    edges: TEdge[]
  ) => AlgorithmStep[];
}
