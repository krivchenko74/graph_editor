// algorithms/mst.ts
import { Algorithm, AlgorithmStep } from "@/types/algorithm";
import { TVertex, TEdge } from "@/types/graph";
import { createInitialStep, createStep } from "@/utils/algorithm-utils";

export const mstAlgorithm: Algorithm = {
  name: "Алгоритм Прима",
  type: "mst",
  description: "Построение минимального остовного дерева",

  start: (
    startVertexId: string,
    vertices: TVertex[],
    edges: TEdge[]
  ): AlgorithmStep[] => {
    const getVertexText = (vertexId: string): string => {
      return vertices.find((v) => v.id === vertexId)?.text || vertexId;
    };

    const steps: AlgorithmStep[] = [];
    const visited = new Set<string>([startVertexId]);
    let totalWeight = 0;

    // Начальный шаг
    let currentStep = createInitialStep(vertices, edges);
    currentStep = {
      ...currentStep,
      visitedVertices: [startVertexId],
      visitedEdges: [],
      metadata: {
        mstTotalWeight: 0,
      },
      description: `🚀 Начинаем построение минимального остовного дерева (алгоритм Прима) с вершины ${getVertexText(
        startVertexId
      )}`,
    };
    steps.push(currentStep);

    while (visited.size < vertices.length) {
      // Находим все рёбра, соединяющие посещённые и непосещённые вершины
      const candidateEdges = edges.filter((edge) => {
        const sourceVisited = visited.has(edge.source);
        const targetVisited = visited.has(edge.target);
        return (
          (sourceVisited && !targetVisited) || (!sourceVisited && targetVisited)
        );
      });

      if (candidateEdges.length === 0) {
        currentStep = createStep(currentStep, {
          description: `❌ Нет доступных рёбер для добавления. Граф может быть несвязным.`,
        });
        steps.push(currentStep);
        break;
      }

      // Находим ребро с минимальным весом
      const minEdge = candidateEdges.reduce((min, edge) =>
        edge.weight < min.weight ? edge : min
      );

      const newVertex = visited.has(minEdge.source)
        ? minEdge.target
        : minEdge.source;

      // Шаг: подсветка найденного минимального ребра
      currentStep = createStep(currentStep, {
        highlightedEdges: [minEdge.id],
        description: `🔍 Найдено минимальное ребро весом ${
          minEdge.weight
        } между ${getVertexText(minEdge.source)} и ${getVertexText(
          minEdge.target
        )}`,
      });
      steps.push(currentStep);

      // Добавляем ребро в MST (используем visitedEdges)
      visited.add(newVertex);
      totalWeight += minEdge.weight;

      // Шаг: добавление ребра в MST
      currentStep = createStep(currentStep, {
        visitedVertices: [...visited],
        visitedEdges: [...currentStep.visitedEdges, minEdge.id],
        metadata: {
          mstTotalWeight: totalWeight,
        },
        highlightedEdges: [],
        description: `✅ Добавлено ребро между ${getVertexText(
          minEdge.source
        )} и ${getVertexText(minEdge.target)} в MST. Новый вес: ${totalWeight}`,
      });
      steps.push(currentStep);

      // Показываем текущее состояние кандидатов
      if (visited.size < vertices.length) {
        currentStep = createStep(currentStep, {
          description: `📊 Текущее состояние: посещено ${visited.size} из ${vertices.length} вершин. Ищем следующее минимальное ребро...`,
        });
        steps.push(currentStep);
      }
    }

    // Финальный шаг
    currentStep = createStep(currentStep, {
      metadata: {
        mstTotalWeight: totalWeight,
      },
      description: `🎉 Построение завершено! Минимальный вес остовного дерева: ${totalWeight}. Использовано ${currentStep.visitedEdges.length} рёбер.`,
    });
    steps.push(currentStep);

    return steps;
  },
};
