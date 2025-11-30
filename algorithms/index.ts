// algorithms/index.ts
import { Algorithm } from "@/types/algorithm";
import { dfsAlgorithm } from "./dfs";
import { bfsAlgorithm } from "./bfs";
import { mstAlgorithm } from "./mst";
// Импортируем другие алгоритмы по мере создания

export const algorithms: Record<string, Algorithm> = {
  dfs: dfsAlgorithm,
  bfs: bfsAlgorithm,
  mst: mstAlgorithm,
};

export const getAlgorithm = (type: string): Algorithm | null => {
  return algorithms[type] || null;
};

export const getAvailableAlgorithms = () => {
  return Object.values(algorithms).map((algo) => ({
    value: algo.type,
    label: algo.name,
  }));
};
