// algorithms/mst.ts
import { Algorithm, AlgorithmStep } from "@/types/algorithm";
import { TVertex, TEdge } from "@/types/graph";
import { createInitialStep, createStep } from "@/utils/algorithm-utils";

export const mstAlgorithm: Algorithm = {
  name: "Минимальное остовное дерево (Прим)",
  type: "mst",
  description: "Построение минимального остовного дерева",

  start: (
    startVertexId: string,
    endVertexId: string | null,
    vertices: TVertex[],
    edges: TEdge[]
  ): AlgorithmStep[] => {
    const getVertexText = (vertexId: string): string => {
      return vertices.find((v) => v.id === vertexId)?.text || vertexId;
    };

    const steps: AlgorithmStep[] = [];

    // Создаём карту вершин для быстрого доступа
    const vertexMap = new Map(vertices.map((v) => [v.id, v]));

    // Фильтруем рёбра, чтобы оставить только те, у которых обе вершины существуют
    const validEdges = edges.filter(
      (edge) => vertexMap.has(edge.source) && vertexMap.has(edge.target)
    );

    const visited = new Set<string>([startVertexId]);
    let totalWeight = 0;

    // Начальный шаг
    let currentStep = createInitialStep(vertices, validEdges);
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
      const candidateEdges = validEdges.filter((edge) => {
        const sourceVisited = visited.has(edge.source);
        const targetVisited = visited.has(edge.target);
        return (
          (sourceVisited && !targetVisited) || (!sourceVisited && targetVisited)
        );
      });

      if (candidateEdges.length === 0) {
        currentStep = createStep(currentStep, {
          description: `❌ Нет доступных рёбер для добавления. Граф может быть несвязным. Посещено ${visited.size} из ${vertices.length} вершин.`,
        });
        steps.push(currentStep);
        break;
      }

      // Находим ребро с минимальным весом
      const minEdge = candidateEdges.reduce((min, edge) =>
        edge.weight < min.weight ? edge : min
      );

      // Определяем, какая вершина новая (не посещённая)
      const isSourceVisited = visited.has(minEdge.source);
      const isTargetVisited = visited.has(minEdge.target);

      let newVertex: string;
      if (!isSourceVisited) {
        newVertex = minEdge.source;
      } else {
        newVertex = minEdge.target;
      }

      // Шаг: подсветка найденного минимального ребра
      currentStep = createStep(currentStep, {
        highlightedEdges: [minEdge.id],
        description: `🔍 Найдено минимальное ребро весом ${
          minEdge.weight
        } между ${getVertexText(minEdge.source)} и ${getVertexText(
          minEdge.target
        )}. Добавляем вершину ${getVertexText(newVertex)}`,
      });
      steps.push(currentStep);

      // Добавляем ребро в MST и новую вершину в посещённые
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

      // Показываем текущее состояние
      if (visited.size < vertices.length) {
        currentStep = createStep(currentStep, {
          description: `📊 Текущее состояние: посещено ${visited.size} из ${vertices.length} вершин. Ищем следующее минимальное ребро...`,
        });
        steps.push(currentStep);
      }
    }

    // Финальный шаг - проверяем, построили ли мы полное MST
    const isCompleteMST = visited.size === vertices.length;

    currentStep = createStep(currentStep, {
      metadata: {
        mstTotalWeight: totalWeight,
      },
      description: isCompleteMST
        ? `🎉 Построение завершено! Минимальный вес остовного дерева: ${totalWeight}. Использовано ${currentStep.visitedEdges.length} рёбер.`
        : `⚠️ Построение завершено частично! Граф несвязный. Минимальный вес: ${totalWeight}. Посещено ${visited.size} из ${vertices.length} вершин.`,
    });
    steps.push(currentStep);

    return steps;
  },
};
