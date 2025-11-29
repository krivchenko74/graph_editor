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
  // Гарантируем, что массивы всегда определены
  visitedVertices: updates.visitedVertices || prevStep.visitedVertices,
  visitedEdges: updates.visitedEdges || prevStep.visitedEdges,
  highlightedVertices:
    updates.highlightedVertices || prevStep.highlightedVertices || [],
  highlightedEdges: updates.highlightedEdges || prevStep.highlightedEdges || [],
});
