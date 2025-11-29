// algorithms/index.ts
import { Algorithm } from "@/types/algorithm";
import { dfsAlgorithm } from "./dfs";
// import { bfsAlgorithm } from "./bfs";
// Импортируем другие алгоритмы по мере создания

export const algorithms: Record<string, Algorithm> = {
  dfs: dfsAlgorithm,
  // Добавляем другие алгоритмы
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
