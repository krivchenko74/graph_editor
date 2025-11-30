// algorithms/dfs.ts
import { Algorithm, AlgorithmStep } from "@/types/algorithm";
import { TVertex, TEdge } from "@/types/graph";
import { createInitialStep, createStep } from "@/utils/algorithm-utils";

export const dfsAlgorithm: Algorithm = {
  name: "Обход в глубину",
  type: "dfs",
  description: "Поиск в глубину с использованием стека",

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
    const visited = new Set<string>();
    const stack: { vertexId: string; fromEdge?: string }[] = [
      { vertexId: startVertexId },
    ];

    // Для хранения всех посещённых рёбер
    const visitedEdges = new Set<string>();

    // Начальный шаг
    let currentStep = createInitialStep(vertices, edges);
    currentStep = {
      ...currentStep,
      stack: stack.map((item) => item.vertexId),
      description: `🚀 Начинаем обход в глубину (DFS) с вершины ${getVertexText(
        startVertexId
      )}`,
    };
    steps.push(currentStep);

    while (stack.length > 0) {
      const { vertexId: currentVertexId, fromEdge } = stack.pop()!;

      // Если вершина уже посещена, пропускаем
      if (visited.has(currentVertexId)) {
        currentStep = createStep(currentStep, {
          description: `↩️ Вершина ${getVertexText(
            currentVertexId
          )} уже посещена, пропускаем`,
        });
        steps.push(currentStep);
        continue;
      }

      // Помечаем вершину как посещённую
      visited.add(currentVertexId);

      // Добавляем ребро, по которому пришли (если оно есть)
      if (fromEdge) {
        visitedEdges.add(fromEdge);
        console.log(
          `✅ Добавили ребро ${fromEdge} в visitedEdges (пришли к ${currentVertexId})`
        );
      }

      // Шаг: посещаем вершину
      currentStep = createStep(currentStep, {
        currentVertexId,
        visitedVertices: [...visited],
        visitedEdges: [...visitedEdges],
        stack: stack.map((item) => item.vertexId),
        description: fromEdge
          ? `📥 Посещаем вершину ${getVertexText(
              currentVertexId
            )} (пришли по ребру ${fromEdge})`
          : `📥 Начинаем с вершины ${getVertexText(currentVertexId)}`,
      });
      steps.push(currentStep);

      // Находим всех соседей текущей вершины
      const neighbors = edges
        .filter((edge) => {
          if (edge.source === currentVertexId) return true;
          if (!edge.directed && edge.target === currentVertexId) return true;
          return false;
        })
        .map((edge) => {
          const neighborId =
            edge.source === currentVertexId ? edge.target : edge.source;
          return { id: neighborId, edgeId: edge.id };
        })
        .filter(({ id }) => !visited.has(id)); // Только непосещённые соседи

      console.log(
        `🔍 У вершины ${currentVertexId} найдено ${neighbors.length} непосещенных соседей:`,
        neighbors
      );

      if (neighbors.length > 0) {
        currentStep = createStep(currentStep, {
          description: `🔍 Нашли ${
            neighbors.length
          } непосещенных соседей у вершины ${getVertexText(currentVertexId)}`,
        });
        steps.push(currentStep);
      }

      // Обрабатываем соседей в обратном порядке (для правильного порядка в стеке)
      const neighborsToAdd = [];
      for (const { id: neighborId, edgeId } of neighbors) {
        // Проверяем, не добавлена ли уже эта вершина в стек
        const alreadyInStack = stack.some(
          (item) => item.vertexId === neighborId
        );
        if (!alreadyInStack) {
          neighborsToAdd.push({ neighborId, edgeId });
          console.log(
            `➡️ Будем добавлять соседа ${neighborId} по ребру ${edgeId}`
          );
        } else {
          console.log(`⏭️ Сосед ${neighborId} уже в стеке, пропускаем`);
        }
      }

      // Добавляем соседей в стек в обратном порядке
      for (let i = neighborsToAdd.length - 1; i >= 0; i--) {
        const { neighborId, edgeId } = neighborsToAdd[i];

        // Шаг: обнаружили ребро к соседу
        currentStep = createStep(currentStep, {
          highlightedEdges: [edgeId],
          description: `➡️ Обнаружено ребро к вершине ${getVertexText(
            neighborId
          )}`,
        });
        steps.push(currentStep);

        // Добавляем соседа в стек с информацией о ребре
        stack.push({ vertexId: neighborId, fromEdge: edgeId });

        // Шаг: добавили соседа в стек
        currentStep = createStep(currentStep, {
          stack: stack.map((item) => item.vertexId),
          highlightedEdges: [],
          description: `📚 Добавляем вершину ${getVertexText(
            neighborId
          )} в стек`,
        });
        steps.push(currentStep);

        console.log(
          `📚 Добавили вершину ${neighborId} в стек с ребром ${edgeId}`
        );
      }

      if (neighbors.length === 0) {
        currentStep = createStep(currentStep, {
          description: `🏁 У вершины ${getVertexText(
            currentVertexId
          )} нет непосещенных соседей`,
        });
        steps.push(currentStep);
      }

      console.log(
        `📊 Текущее состояние: visitedEdges =`,
        Array.from(visitedEdges)
      );
      console.log(`📊 Текущее состояние: visited =`, Array.from(visited));
      console.log(
        `📊 Текущее состояние: stack =`,
        stack.map((item) => item.vertexId)
      );
    }

    // Финальный шаг - добавим отладочную информацию
    console.log(`🎯 ФИНАЛ: Всего посещено ${visited.size} вершин`);
    console.log(
      `🎯 ФИНАЛ: Всего использовано ${visitedEdges.size} рёбер:`,
      Array.from(visitedEdges)
    );

    // Проверим, все ли рёбра между посещёнными вершинами учтены
    const allPossibleEdges = edges.filter(
      (edge) => visited.has(edge.source) && visited.has(edge.target)
    );
    console.log(
      `🎯 ФИНАЛ: Всего возможных рёбер между посещёнными вершинами:`,
      allPossibleEdges.length
    );
    console.log(
      `🎯 ФИНАЛ: Пропущенные рёбра:`,
      allPossibleEdges
        .filter((edge) => !visitedEdges.has(edge.id))
        .map((edge) => edge.id)
    );

    currentStep = createStep(currentStep, {
      currentVertexId: undefined,
      stack: [],
      description: `✅ Обход завершен! Посещено ${visited.size} вершин и использовано ${visitedEdges.size} рёбер`,
    });
    steps.push(currentStep);

    return steps;
  },
};
