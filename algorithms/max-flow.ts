// algorithms/max-flow.ts
// Полностью рабочий Форд-Фалкерсон с визуализацией обратных рёбер

import { Algorithm, AlgorithmStep } from "@/types/algorithm";
import { TVertex, TEdge } from "@/types/graph";
import { createInitialStep, createStep } from "@/utils/algorithm-utils";

const getVertexName = (id: string, vertices: TVertex[]) =>
  vertices.find((v) => v.id === id)?.text || id;

export const fordFulkersonAlgorithm: Algorithm = {
  name: "Форд-Фалкерсон (максимальный поток)",
  type: "max-flow",
  description: "Полная визуализация: 5/10, насыщенность, обратные рёбра",
  requirements: {
    directed: true,
    weighted: true,
    startVertex: true,
    endVertex: true,
  },

  start: (
    sourceId: string,
    sinkId: string | null,
    vertices: TVertex[],
    edges: TEdge[]
  ): AlgorithmStep[] => {
    const steps: AlgorithmStep[] = [];
    const vName = (id: string) => getVertexName(id, vertices);

    if (!sinkId || sourceId === sinkId) {
      steps.push({
        ...createInitialStep(vertices, edges),
        description: "Выберите разные исток и сток",
        metadata: { stepDescription: "Ошибка" },
      });
      return steps;
    }

    // Поток как число
    const flowValues: Record<string, number> = {};
    edges.forEach((e) => (flowValues[e.id] = 0));

    // Данные, которые Edge.tsx точно поймёт
    const getVizData = () => {
      const flows: Record<
        string,
        { flow: number; residual: number; isResidual: boolean }
      > = {};
      const residualFlows: Record<
        string,
        { flow: number; residual: number; isResidual: boolean }
      > = {};

      edges.forEach((edge) => {
        const cap = edge.weight || 1;
        const f = flowValues[edge.id] || 0;
        const forward = cap - f;
        const backward = f;

        // Для отображения текущего потока (10/10, 4/4 и т.д.)
        flows[edge.id] = { flow: f, residual: forward, isResidual: false };

        // Остаточная сеть
        if (forward > 0) {
          residualFlows[edge.id] = {
            flow: f,
            residual: forward,
            isResidual: false,
          };
        }
        if (backward > 0) {
          // Перезаписываем — Edge.tsx увидит isResidual: true и нарисует стрелку назад
          residualFlows[edge.id] = {
            flow: f,
            residual: backward,
            isResidual: true,
          };
        }
      });

      return { flows, residualFlows };
    };

    // Инициализация
    let step = createInitialStep(vertices, edges);
    step = {
      ...step,
      highlightedVertices: [sourceId, sinkId],
      metadata: {
        stepDescription: "Инициализация",
        ...getVizData(),
        maxFlow: 0,
      },
      description: `Исток: ${vName(sourceId)}, Сток: ${vName(sinkId)}`,
    };
    steps.push(step);

    let maxFlow = 0;
    let iteration = 0;

    while (iteration++ < 50) {
      const result = bfsFindPath(sourceId, sinkId, edges, flowValues);

      if (!result.path.length) {
        step = createStep(step, {
          metadata: { ...step.metadata, ...getVizData() },
          description: `Алгоритм завершён\nМаксимальный поток: ${maxFlow}`,
        });
        steps.push(step);
        break;
      }

      const { path, bottleneck, parent } = result;

      // Показываем найденный путь
      step = createStep(step, {
        visitedVertices: path,
        highlightedEdges: path
          .slice(0, -1)
          .map((_, i) => parent[path[i + 1]]!.edgeId),
        metadata: {
          ...step.metadata,
          ...getVizData(),
          augmentingPath: path,
          bottleneck,
        },
        description: `Путь: ${path.map(vName).join(" → ")}\nΔ = ${bottleneck}`,
      });
      steps.push(step);

      // Обновляем поток по пути
      for (let i = 0; i < path.length - 1; i++) {
        const v = path[i + 1];
        const entry = parent[v];
        if (!entry) continue; // защита

        const { edgeId, isForward } = entry;
        const oldFlow = flowValues[edgeId];

        if (isForward) {
          flowValues[edgeId] += bottleneck;
        } else {
          flowValues[edgeId] = Math.max(0, flowValues[edgeId] - bottleneck);
        }

        step = createStep(step, {
          highlightedEdges: [edgeId],
          metadata: { ...step.metadata, ...getVizData() },
          description: `Ребро: ${oldFlow} → ${flowValues[edgeId]}`,
        });
        steps.push(step);
      }

      maxFlow += bottleneck;
    }

    // Финальный шаг
    step = createStep(step, {
      metadata: { ...step.metadata, ...getVizData(), maxFlow },
      description: `ГОТОВО! Максимальный поток: ${maxFlow}`,
    });
    steps.push(step);

    return steps;
  },
};

// === BFS с корректным восстановлением bottleneck ===
function bfsFindPath(
  source: string,
  sink: string,
  edges: TEdge[],
  flows: Record<string, number>
) {
  interface ParentInfo {
    edgeId: string;
    isForward: boolean;
  }

  const parent: Record<string, ParentInfo> = {};
  const queue = [source];
  const visited = new Set<string>([source]);

  while (queue.length) {
    const u = queue.shift()!;

    if (u === sink) {
      // Восстановление пути и bottleneck
      const path: string[] = [];
      let v: string = sink;
      let bottleneck = Infinity;

      while (v !== source) {
        path.unshift(v);
        const p = parent[v];
        const edge = edges.find((e) => e.id === p.edgeId)!;
        const cap = edge.weight || 1;
        const f = flows[edge.id] || 0;

        bottleneck = Math.min(bottleneck, p.isForward ? cap - f : f);
        v = p.isForward ? edge.source : edge.target;
      }
      path.unshift(source);

      return { path, bottleneck, parent };
    }

    for (const edge of edges) {
      const cap = edge.weight || 1;
      const f = flows[edge.id] || 0;

      // Прямое ребро
      if (edge.source === u && cap - f > 0 && !visited.has(edge.target)) {
        visited.add(edge.target);
        parent[edge.target] = { edgeId: edge.id, isForward: true };
        queue.push(edge.target);
      }

      // Обратное ребро
      if (edge.target === u && f > 0 && !visited.has(edge.source)) {
        visited.add(edge.source);
        parent[edge.source] = { edgeId: edge.id, isForward: false };
        queue.push(edge.source);
      }
    }
  }

  return { path: [], bottleneck: 0, parent: {} };
}
