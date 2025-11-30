// algorithms/bfs.ts
import { Algorithm, AlgorithmStep } from "@/types/algorithm";
import { TVertex, TEdge } from "@/types/graph";
import { createInitialStep, createStep } from "@/utils/algorithm-utils";

export const bfsAlgorithm: Algorithm = {
  name: "Обход в ширину",
  type: "bfs",
  description: "Поиск в ширину с использованием очереди",

  start: (
    startVertexId: string,
    vertices: TVertex[],
    edges: TEdge[]
  ): AlgorithmStep[] => {
    const getVertexText = (vertexId: string): string => {
      return vertices.find((v) => v.id === vertexId)?.text || vertexId;
    };
    const steps: AlgorithmStep[] = [];
    const visited = new Set<string>();
    const queue: string[] = [startVertexId];

    // Храним информацию о родительских вершинах и рёбрах
    const parentEdgeMap = new Map<string, string>(); // vertexId -> edgeId

    // Начальный шаг
    let currentStep = createInitialStep(vertices, edges);
    currentStep = {
      ...currentStep,
      queue: [...queue],
      description: `🚀 Начинаем обход в ширину (BFS) с вершины ${getVertexText(
        startVertexId
      )}`,
    };
    steps.push(currentStep);

    while (queue.length > 0) {
      const currentVertexId = queue.shift()!;

      if (!visited.has(currentVertexId)) {
        // Находим ребро, по которому пришли к текущей вершине
        const incomingEdge = parentEdgeMap.get(currentVertexId);

        visited.add(currentVertexId);

        // Шаг: посещение вершины
        currentStep = createStep(currentStep, {
          currentVertexId,
          visitedVertices: [...visited],
          visitedEdges: incomingEdge
            ? [...currentStep.visitedEdges, incomingEdge]
            : currentStep.visitedEdges,
          queue: [...queue],
          description: incomingEdge
            ? `📥 Извлекаем вершину ${getVertexText(
                currentVertexId
              )} из очереди и посещаем её`
            : `📥 Начинаем с вершины ${getVertexText(currentVertexId)}`,
        });
        steps.push(currentStep);

        // Находим непосещенных соседей
        const neighbors = edges
          .filter(
            (edge) =>
              edge.source === currentVertexId ||
              (!edge.directed && edge.target === currentVertexId)
          )
          .map((edge) => {
            const neighborId =
              edge.source === currentVertexId ? edge.target : edge.source;
            return { id: neighborId, edgeId: edge.id };
          })
          .filter(({ id }) => !visited.has(id) && !queue.includes(id));

        if (neighbors.length > 0) {
          currentStep = createStep(currentStep, {
            description: `🔍 Нашли ${
              neighbors.length
            } непосещенных соседей у вершины ${getVertexText(currentVertexId)}`,
          });
          steps.push(currentStep);
        }

        // Обрабатываем каждого соседа по отдельности
        for (const { id: neighborId, edgeId } of neighbors) {
          // Запоминаем, по какому ребру мы идём к соседу
          parentEdgeMap.set(neighborId, edgeId);

          // Шаг: подсветка ребра к конкретному соседу
          currentStep = createStep(currentStep, {
            highlightedEdges: [edgeId],
            description: `➡️ Обнаружено ребро к вершине ${getVertexText(
              neighborId
            )}`,
          });
          steps.push(currentStep);

          // Добавляем одного соседа в очередь
          queue.push(neighborId);

          // Шаг: добавление одного соседа в очередь
          currentStep = createStep(currentStep, {
            queue: [...queue],
            highlightedEdges: [],
            description: `📚 Добавляем вершину ${getVertexText(
              neighborId
            )} в очередь`,
          });
          steps.push(currentStep);
        }

        if (neighbors.length === 0) {
          currentStep = createStep(currentStep, {
            description: `❌ У вершины ${getVertexText(
              currentVertexId
            )} нет непосещенных соседей. Переходим к следующей в очереди.`,
          });
          steps.push(currentStep);
        }
      }
    }

    // Финальный шаг
    currentStep = createStep(currentStep, {
      currentVertexId: undefined,
      queue: [],
      description: `✅ Обход завершен! Посещено ${visited.size} вершин`,
    });
    steps.push(currentStep);

    return steps;
  },
};
