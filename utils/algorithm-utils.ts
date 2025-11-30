// utils/algorithm-utils.ts
import { AlgorithmStep } from "@/types/algorithm";
import { TVertex, TEdge } from "@/types/graph";

export const createInitialStep = (
  vertices: TVertex[],
  edges: TEdge[]
): AlgorithmStep => ({
  vertices: Object.fromEntries(vertices.map((v) => [v.id, v])),
  edges: Object.fromEntries(edges.map((e) => [e.id, e])),
  visitedVertices: [],
  visitedEdges: [],
  description: "Начало алгоритма",
  highlightedVertices: [],
  highlightedEdges: [],
});

export const createStep = (
  prevStep: AlgorithmStep,
  updates: Partial<AlgorithmStep>
): AlgorithmStep => ({
  ...prevStep,
  ...updates,
  // Исправлено: проверяем именно на undefined, а не на falsy
  visitedVertices:
    updates.visitedVertices !== undefined
      ? updates.visitedVertices
      : prevStep.visitedVertices,
  visitedEdges:
    updates.visitedEdges !== undefined
      ? updates.visitedEdges
      : prevStep.visitedEdges,
  highlightedVertices:
    updates.highlightedVertices !== undefined
      ? updates.highlightedVertices
      : prevStep.highlightedVertices,
  highlightedEdges:
    updates.highlightedEdges !== undefined
      ? updates.highlightedEdges
      : prevStep.highlightedEdges,
});
