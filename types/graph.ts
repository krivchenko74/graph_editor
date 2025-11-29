// types/graph.ts
import { VertexColor, EdgeColor } from "./colors";

export type TVertex = {
  id: string;
  x: number;
  y: number;
  text: string;
  index: number;
  color?: VertexColor; // Добавляем цвет вершины
};

export type TEdge = {
  id: string;
  source: string;
  target: string;
  directed: boolean;
  weight: number;
  curvature: number;
  color?: EdgeColor; // Добавляем цвет ребра
};

export type TGraph = {
  vertices: TVertex[];
  edges: TEdge[];
  adjacencyMatrix: (number | null)[][]; // null - нет ребра, number - вес
  directed: boolean;
};
