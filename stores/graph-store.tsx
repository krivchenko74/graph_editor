// stores/graph-store.ts
import { create } from "zustand";
import { TGraph, TVertex, TEdge } from "@/types/graph";

interface GraphStore {
  graph: TGraph;
  setGraph: (graph: TGraph) => void;
  clearGraph: () => void;

  // Vertex methods
  addVertex: (vertex: TVertex) => void;
  updateVertex: (id: string, updates: Partial<TVertex>) => void;
  deleteVertex: (id: string) => void;

  // Edge methods
  addEdge: (edge: TEdge) => void;
  updateEdge: (id: string, updates: Partial<TEdge>) => void;
  deleteEdge: (id: string) => void;

  // Matrix methods
  updateAdjacencyMatrix: () => void;
  getAdjacencyMatrix: () => (number | null)[][];
  hasEdge: (sourceIndex: number, targetIndex: number) => boolean;
  getEdgeWeight: (sourceIndex: number, targetIndex: number) => number | null;

  // Internal matrix helpers (не экспортируются в интерфейс)
  updateAdjacencyMatrixForVertices: (
    vertices: TVertex[],
    edges: TEdge[]
  ) => (number | null)[][];
  updateAdjacencyMatrixForEdges: (
    vertices: TVertex[],
    edges: TEdge[]
  ) => (number | null)[][];
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  graph: {
    vertices: [],
    edges: [],
    adjacencyMatrix: [],
    directed: false,
  },

  setGraph: (graph) => set({ graph }),

  clearGraph: () =>
    set({
      graph: {
        vertices: [],
        edges: [],
        adjacencyMatrix: [],
        directed: false,
      },
    }),

  addVertex: (vertex) =>
    set((state) => {
      const newVertices = [...state.graph.vertices, vertex];
      const newMatrix = get().updateAdjacencyMatrixForVertices(
        newVertices,
        state.graph.edges
      );

      return {
        graph: {
          ...state.graph,
          vertices: newVertices,
          adjacencyMatrix: newMatrix,
        },
      };
    }),

  updateVertex: (id, updates) =>
    set((state) => ({
      graph: {
        ...state.graph,
        vertices: state.graph.vertices.map((v) =>
          v.id === id ? { ...v, ...updates } : v
        ),
      },
    })),

  deleteVertex: (id) =>
    set((state) => {
      const vertexToDelete = state.graph.vertices.find((v) => v.id === id);
      if (!vertexToDelete) return state;

      const newVertices = state.graph.vertices.filter((v) => v.id !== id);
      const newEdges = state.graph.edges.filter(
        (e) => e.source !== id && e.target !== id
      );

      const newMatrix = get().updateAdjacencyMatrixForVertices(
        newVertices,
        newEdges
      );

      return {
        graph: {
          ...state.graph,
          vertices: newVertices,
          edges: newEdges,
          adjacencyMatrix: newMatrix,
        },
      };
    }),

  addEdge: (edge) =>
    set((state) => {
      const newEdges = [...state.graph.edges, edge];
      const newMatrix = get().updateAdjacencyMatrixForEdges(
        state.graph.vertices,
        newEdges
      );

      return {
        graph: {
          ...state.graph,
          edges: newEdges,
          adjacencyMatrix: newMatrix,
        },
      };
    }),

  updateEdge: (id, updates) =>
    set((state) => {
      const newEdges = state.graph.edges.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      );
      const newMatrix = get().updateAdjacencyMatrixForEdges(
        state.graph.vertices,
        newEdges
      );

      return {
        graph: {
          ...state.graph,
          edges: newEdges,
          adjacencyMatrix: newMatrix,
        },
      };
    }),

  deleteEdge: (id) =>
    set((state) => {
      const newEdges = state.graph.edges.filter((e) => e.id !== id);
      const newMatrix = get().updateAdjacencyMatrixForEdges(
        state.graph.vertices,
        newEdges
      );

      return {
        graph: {
          ...state.graph,
          edges: newEdges,
          adjacencyMatrix: newMatrix,
        },
      };
    }),

  // Matrix methods
  updateAdjacencyMatrix: () => {
    const { graph } = get();
    const newMatrix = get().updateAdjacencyMatrixForVertices(
      graph.vertices,
      graph.edges
    );
    set({ graph: { ...graph, adjacencyMatrix: newMatrix } });
  },

  getAdjacencyMatrix: () => {
    return get().graph.adjacencyMatrix;
  },

  hasEdge: (sourceIndex: number, targetIndex: number) => {
    const matrix = get().graph.adjacencyMatrix;
    return matrix[sourceIndex]?.[targetIndex] !== null;
  },

  getEdgeWeight: (sourceIndex: number, targetIndex: number) => {
    const matrix = get().graph.adjacencyMatrix;
    return matrix[sourceIndex]?.[targetIndex] ?? null;
  },

  // Internal matrix helpers
  updateAdjacencyMatrixForVertices: (vertices: TVertex[], edges: TEdge[]) => {
    const size = vertices.length;
    const matrix: (number | null)[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(null));

    // Обновляем индексы вершин
    const verticesWithUpdatedIndex = vertices.map((v, index) => ({
      ...v,
      index: index,
    }));

    // Заполняем матрицу на основе существующих ребер
    edges.forEach((edge) => {
      const sourceVertex = verticesWithUpdatedIndex.find(
        (v) => v.id === edge.source
      );
      const targetVertex = verticesWithUpdatedIndex.find(
        (v) => v.id === edge.target
      );

      if (sourceVertex && targetVertex) {
        matrix[sourceVertex.index][targetVertex.index] = edge.weight;
        if (!edge.directed) {
          matrix[targetVertex.index][sourceVertex.index] = edge.weight;
        }
      }
    });

    return matrix;
  },

  updateAdjacencyMatrixForEdges: (vertices: TVertex[], edges: TEdge[]) => {
    const size = vertices.length;
    const matrix: (number | null)[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(null));

    // Обновляем индексы вершин
    const verticesWithUpdatedIndex = vertices.map((v, index) => ({
      ...v,
      index: index,
    }));

    edges.forEach((edge) => {
      const sourceVertex = verticesWithUpdatedIndex.find(
        (v) => v.id === edge.source
      );
      const targetVertex = verticesWithUpdatedIndex.find(
        (v) => v.id === edge.target
      );

      if (sourceVertex && targetVertex) {
        matrix[sourceVertex.index][targetVertex.index] = edge.weight;
        if (!edge.directed) {
          matrix[targetVertex.index][sourceVertex.index] = edge.weight;
        }
      }
    });

    return matrix;
  },
}));
