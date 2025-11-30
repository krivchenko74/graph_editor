// algorithms/shortest-path.ts
import { Algorithm, AlgorithmStep } from "@/types/algorithm";
import { TVertex, TEdge } from "@/types/graph";
import { createInitialStep, createStep } from "@/utils/algorithm-utils";

export const shortestPathAlgorithm: Algorithm = {
  name: "Алгоритм Дейкстры",
  type: "shortest-path",
  description: "Поиск кратчайшего пути между двумя вершинами",
  requirements: {
    weighted: true,
    endVertex: true,
  },

  start: (
    startVertexId: string,
    endVertexId: string | null,
    vertices: TVertex[],
    edges: TEdge[]
  ): AlgorithmStep[] => {
    if (!endVertexId) {
      throw new Error(
        "Конечная вершина не указана для алгоритма кратчайшего пути"
      );
    }

    const getVertexText = (vertexId: string): string => {
      return vertices.find((v) => v.id === vertexId)?.text || vertexId;
    };

    const steps: AlgorithmStep[] = [];

    // Инициализация
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const unvisited = new Set<string>();

    vertices.forEach((vertex) => {
      distances[vertex.id] = vertex.id === startVertexId ? 0 : Infinity;
      previous[vertex.id] = null;
      unvisited.add(vertex.id);
    });

    // Начальный шаг
    let currentStep = createInitialStep(vertices, edges);
    currentStep = {
      ...currentStep,
      metadata: {
        distances: { ...distances },
        currentVertexId: startVertexId,
      },
      description: `🚀 Начинаем поиск кратчайшего пути от ${getVertexText(
        startVertexId
      )} до ${getVertexText(endVertexId)}`,
    };
    steps.push(currentStep);

    while (unvisited.size > 0) {
      // Находим вершину с минимальным расстоянием
      let currentVertexId = Array.from(unvisited).reduce((minId, vertexId) =>
        distances[vertexId] < distances[minId] ? vertexId : minId
      );

      // Если минимальное расстояние Infinity, останавливаемся
      if (distances[currentVertexId] === Infinity) {
        currentStep = createStep(currentStep, {
          description: `❌ Нет пути до непосещенных вершин`,
        });
        steps.push(currentStep);
        break;
      }

      // Удаляем текущую вершину из непосещенных
      unvisited.delete(currentVertexId);

      // Шаг: обработка текущей вершины
      currentStep = createStep(currentStep, {
        currentVertexId,
        visitedVertices: [
          ...new Set([...currentStep.visitedVertices, currentVertexId]),
        ],
        metadata: {
          ...currentStep.metadata,
          distances: { ...distances },
          currentVertexId,
        },
        description: `📥 Обрабатываем вершину ${getVertexText(
          currentVertexId
        )} (расстояние: ${distances[currentVertexId]})`,
      });
      steps.push(currentStep);

      // Если достигли конечной вершины
      if (currentVertexId === endVertexId) {
        // Восстанавливаем путь
        const path: string[] = [];
        const pathEdges: string[] = [];
        let current: string | null = endVertexId;

        while (current !== null) {
          path.unshift(current);
          const prev: string | null = previous[current]; // Явно указываем тип
          if (prev) {
            // Находим ребро между prev и current
            const edge = edges.find(
              (e) =>
                (e.source === prev && e.target === current) ||
                (!e.directed && e.source === current && e.target === prev)
            );
            if (edge) pathEdges.unshift(edge.id);
          }
          current = prev;
        }

        currentStep = createStep(currentStep, {
          metadata: {
            ...currentStep.metadata,
            path,
            pathEdges,
            totalDistance: distances[endVertexId],
          },
          description: `🎉 Найден кратчайший путь! Длина: ${distances[endVertexId]}`,
        });
        steps.push(currentStep);
        break;
      }

      // Находим соседей текущей вершины
      const neighbors = edges
        .filter(
          (edge) =>
            edge.source === currentVertexId ||
            (!edge.directed && edge.target === currentVertexId)
        )
        .map((edge) => {
          const neighborId =
            edge.source === currentVertexId ? edge.target : edge.source;
          return { id: neighborId, edgeId: edge.id, weight: edge.weight };
        })
        .filter(({ id }) => unvisited.has(id));

      // Обрабатываем каждого соседа
      for (const { id: neighborId, edgeId, weight } of neighbors) {
        const alt = distances[currentVertexId] + weight;

        // Шаг: проверка ребра к соседу
        currentStep = createStep(currentStep, {
          highlightedEdges: [edgeId],
          description: `🔍 Проверяем путь к ${getVertexText(
            neighborId
          )} через ${getVertexText(
            currentVertexId
          )} (новое расстояние: ${alt}, текущее: ${distances[neighborId]})`,
        });
        steps.push(currentStep);

        if (alt < distances[neighborId]) {
          distances[neighborId] = alt;
          previous[neighborId] = currentVertexId;

          // Шаг: обновление расстояния
          currentStep = createStep(currentStep, {
            highlightedEdges: [],
            metadata: {
              ...currentStep.metadata,
              distances: { ...distances },
            },
            description: `📈 Обновляем расстояние до ${getVertexText(
              neighborId
            )}: ${alt}`,
          });
          steps.push(currentStep);
        } else {
          currentStep = createStep(currentStep, {
            highlightedEdges: [],
            description: `➡️ Путь через ${getVertexText(
              currentVertexId
            )} не улучшает расстояние до ${getVertexText(neighborId)}`,
          });
          steps.push(currentStep);
        }
      }
    }

    // Финальный шаг, если путь не найден
    if (distances[endVertexId] === Infinity) {
      currentStep = createStep(currentStep, {
        description: `❌ Путь от ${getVertexText(
          startVertexId
        )} до ${getVertexText(endVertexId)} не существует`,
      });
      steps.push(currentStep);
    }

    return steps;
  },
};
