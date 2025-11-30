import { TVertex, TEdge } from "./graph";

export type AlgorithmType =
  | "bfs"
  | "dfs"
  | "dijkstra"
  | "bellman-ford"
  | "ford-fulkerson"
  | "mst"
  | "kruskal";

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

export interface Algorithm {
  name: string;
  type: AlgorithmType;
  description: string;
  start: (
    startVertexId: string, // Для некоторых алгоритмов может быть не нужен
    vertices: TVertex[],
    edges: TEdge[],
    options?: any // Дополнительные параметры (вес, пропускная способность и т.д.)
  ) => AlgorithmStep[];
  requirements?: {
    directed?: boolean;
    weighted?: boolean;
    connected?: boolean;
    startVertexRequired?: boolean; // Нужна ли стартовая вершина
  };
}
