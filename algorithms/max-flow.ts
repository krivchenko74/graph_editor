// algorithms/ford-fulkerson-labeled.ts
// ИСПРАВЛЕННЫЙ алгоритм Форда-Фалкерсона

import { Algorithm, AlgorithmStep } from "@/types/algorithm";
import { TVertex, TEdge } from "@/types/graph";
import { createInitialStep, createStep } from "@/utils/algorithm-utils";

const getVertexName = (id: string, vertices: TVertex[]) =>
  vertices.find((v) => v.id === id)?.text || id;

export const fordFulkersonAlgorithm: Algorithm = {
  name: "Форд-Фалкерсон (с метками)",
  type: "max-flow",
  description: "Алгоритм Форда-Фалкерсона с помечиванием вершин и дуг",
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
        description: "Ошибка: выберите разные вершины для истока и стока",
        metadata: { stepDescription: "Ошибка" },
      });
      return steps;
    }

    // Шаг 1: Перенумеровать все вершины произвольным образом, кроме истока и стока
    const vertexNumbers: Record<string, number> = {};
    let index = 1;

    const otherVertices = vertices.filter(
      (v) => v.id !== sourceId && v.id !== sinkId
    );
    otherVertices
      .sort((a, b) => a.id.localeCompare(b.id))
      .forEach((vertex) => {
        vertexNumbers[vertex.id] = index++;
      });

    vertexNumbers[sourceId] = 0;
    vertexNumbers[sinkId] = -1;

    // Шаг 2: Задать начальный нулевой поток
    const flowValues: Record<string, number> = {};
    const capacities: Record<string, number> = {};

    edges.forEach((e) => {
      flowValues[e.id] = 0;
      capacities[e.id] = e.weight || 1;
    });

    // Функция для получения данных для визуализации
    const getVizData = (
      vertexLabels?: Record<
        string,
        { from: string; sign: "+" | "-"; edgeId?: string }
      >,
      currentPath?: string[],
      showLabels?: boolean,
      backwardEdgesInPath?: string[]
    ) => {
      const flows: Record<string, { flow: number; capacity: number }> = {};
      const distances: Record<string, string> = {};
      const vertexInfo: Record<string, string> = {};

      edges.forEach((edge) => {
        const cap = capacities[edge.id];
        const f = flowValues[edge.id] || 0;
        flows[edge.id] = {
          flow: f,
          capacity: cap,
        };
      });

      // Формируем метки для вершин
      if (vertexLabels && showLabels) {
        for (const [vertexId, label] of Object.entries(vertexLabels)) {
          const fromNumber = vertexNumbers[label.from];

          // Метка в формате: "+3" или "-5"
          distances[vertexId] = `${label.sign}${fromNumber}`;

          vertexInfo[vertexId] = `Вершина ${vName(vertexId)}\nМетка: ${
            label.sign
          }${vName(label.from)}\n(номер ${label.sign}${fromNumber})`;
        }
      }

      // Для истока
      if (showLabels) {
        distances[sourceId] = "0";
        vertexInfo[sourceId] = `Исток ${vName(sourceId)}\nМетка: 0`;
      }

      // Добавляем номера вершин
      vertices.forEach((v) => {
        if (!distances[v.id] && vertexNumbers[v.id] >= 0) {
          distances[v.id] = vertexNumbers[v.id].toString();
          vertexInfo[v.id] = `Вершина ${vName(v.id)}\nНомер: ${
            vertexNumbers[v.id]
          }`;
        }
      });

      // Для стока
      if (!distances[sinkId]) {
        distances[sinkId] = "сток";
        vertexInfo[sinkId] = `Сток ${vName(sinkId)}`;
      }

      // Для вершин в пути
      const pathVertices: Record<string, boolean> = {};
      if (currentPath) {
        currentPath.forEach((v) => {
          pathVertices[v] = true;
        });
      }

      // ИСПРАВЛЕНО: показываем обратные рёбра только из текущего пути
      const backwardEdgesToShow = backwardEdgesInPath || [];

      return {
        flows,
        backwardEdgesToShow, // Только рёбра из текущего пути
        distances,
        vertexInfo,
        pathVertices,
        vertexNumbers,
      };
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
        source: sourceId,
        sink: sinkId,
      },
      description: `Начало алгоритма Форда-Фалкерсона\n\nИсток: ${vName(
        sourceId
      )} (метка: 0)\nСток: ${vName(sinkId)}\nНачальный поток: 0`,
    };
    steps.push(step);

    let maxFlow = 0;
    let iteration = 0;
    const MAX_ITERATIONS = 100;

    // Основной цикл алгоритма
    while (iteration++ < MAX_ITERATIONS) {
      // Шаг 3: Помечивание вершин
      const labels: Record<
        string,
        { from: string; sign: "+" | "-"; edgeId?: string }
      > = {};
      labels[sourceId] = { from: sourceId, sign: "+" };

      let changed = true;
      let labelingStep = 0;

      // ИСПРАВЛЕННЫЙ процесс помечивания
      while (changed) {
        changed = false;
        labelingStep++;

        // Создаем копию текущих меток для сравнения
        const labelsBefore = { ...labels };

        // Проверяем ВСЕ рёбра для поиска новых меток
        for (const edge of edges) {
          const u = edge.source;
          const v = edge.target;
          const capacity = capacities[edge.id];
          const flow = flowValues[edge.id] || 0;

          // 1. Прямое помечивание: u → v
          if (labels[u] && !labels[v] && flow < capacity) {
            labels[v] = { from: u, sign: "+", edgeId: edge.id };
            changed = true;
          }

          // 2. Обратное помечивание: v → u (через то же ребро!)
          if (!labels[u] && labels[v] && flow > 0) {
            labels[u] = { from: v, sign: "-", edgeId: edge.id };
            changed = true;
          }
        }

        // Если добавили новые метки - показываем шаг
        if (JSON.stringify(labels) !== JSON.stringify(labelsBefore)) {
          step = createStep(step, {
            metadata: {
              ...step.metadata,
              ...getVizData(labels, undefined, true),
              stepDescription: `Итерация ${iteration}: Помечивание`,
            },
            description: `Итерация ${iteration}, шаг ${labelingStep}:\n${Object.keys(
              labels
            )
              .filter((id) => !(id in labelsBefore))
              .map(
                (id) =>
                  `${vName(id)} ← ${labels[id].sign}${vName(labels[id].from)}`
              )
              .join("\n")}`,
            highlightedVertices: Object.keys(labels),
          });
          steps.push(step);
        }

        // Если достигли стока - выходим
        if (labels[sinkId]) {
          break;
        }

        if (labelingStep > vertices.length * 3) {
          break; // Защита от зацикливания
        }
      }

      // Итог помечивания
      step = createStep(step, {
        metadata: {
          ...step.metadata,
          ...getVizData(labels, undefined, true),
          stepDescription: `Итерация ${iteration}: Итог помечивания`,
        },
        description: `Итерация ${iteration}: Процесс помечивания завершён\n\nМетки:\n${Object.entries(
          labels
        )
          .map(
            ([id, label]) => `${vName(id)} ← ${label.sign}${vName(label.from)}`
          )
          .join("\n")}`,
        highlightedVertices: Object.keys(labels),
      });
      steps.push(step);

      // Шаг 4: Проверка стока
      if (!labels[sinkId]) {
        step = createStep(step, {
          metadata: {
            ...step.metadata,
            ...getVizData(labels, undefined, true),
            stepDescription: "Завершение",
            maxFlow: maxFlow,
          },
          description: `Алгоритм завершён!\nСток не получил метку.\nМаксимальный поток: ${maxFlow}`,
          highlightedEdges: [],
        });
        steps.push(step);
        break;
      }

      // Шаг 5: Восстановление пути
      const path: string[] = [sinkId];
      const pathEdges: Array<{ edgeId: string; sign: "+" | "-" }> = [];
      const backwardEdgesInPath: string[] = [];
      let current = sinkId;

      while (current !== sourceId) {
        const label = labels[current];
        if (!label) break;

        path.unshift(label.from);
        if (label.edgeId) {
          pathEdges.unshift({ edgeId: label.edgeId, sign: label.sign });
          if (label.sign === "-") {
            backwardEdgesInPath.push(label.edgeId);
          }
        }
        current = label.from;
      }

      // Визуализация пути
      step = createStep(step, {
        visitedVertices: path,
        highlightedEdges: pathEdges.map((pe) => pe.edgeId),
        metadata: {
          ...step.metadata,
          ...getVizData(labels, path, true, backwardEdgesInPath),
          augmentingPath: path,
          pathEdges: pathEdges,
          backwardEdgesInPath: backwardEdgesInPath,
          stepDescription: `Итерация ${iteration}: Найден путь`,
        },
        description: `Итерация ${iteration}: Найден увеличивающий путь\n${path
          .map(vName)
          .join(" → ")}\n\nРёбра пути:\n${pathEdges
          .map((pe) => {
            const edge = edges.find((e) => e.id === pe.edgeId)!;
            return `${vName(edge.source)}→${vName(edge.target)} (${pe.sign})`;
          })
          .join("\n")}`,
      });
      steps.push(step);

      // Шаг 6: Вычисление K
      let K1 = Infinity;
      let K2 = Infinity;

      for (const pathEdge of pathEdges) {
        const capacity = capacities[pathEdge.edgeId];
        const flow = flowValues[pathEdge.edgeId] || 0;

        if (pathEdge.sign === "+") {
          const residual = capacity - flow;
          if (residual < K1) K1 = residual;
        } else if (pathEdge.sign === "-") {
          if (flow < K2) K2 = flow;
        }
      }

      const K = Math.min(K1, K2);

      // Шаг 7: Обновление потока
      for (const pathEdge of pathEdges) {
        const edgeId = pathEdge.edgeId;
        const oldFlow = flowValues[edgeId] || 0;

        if (pathEdge.sign === "+") {
          flowValues[edgeId] = oldFlow + K;
        } else {
          flowValues[edgeId] = oldFlow - K;
        }

        const edge = edges.find((e) => e.id === edgeId)!;
        step = createStep(step, {
          highlightedEdges: [edgeId],
          metadata: {
            ...step.metadata,
            ...getVizData(labels, path, true, backwardEdgesInPath),
            updatedEdge: edgeId,
            oldFlow: oldFlow,
            newFlow: flowValues[edgeId],
            stepDescription: `Итерация ${iteration}: Обновление`,
          },
          description: `Ребро ${vName(edge.source)}→${vName(
            edge.target
          )}\n${oldFlow} → ${flowValues[edgeId]} (${
            pathEdge.sign === "+" ? "+" : "-"
          }${K})`,
        });
        steps.push(step);
      }

      maxFlow += K;

      // Переход к следующей итерации
      step = createStep(step, {
        metadata: {
          ...step.metadata,
          ...getVizData(undefined, undefined, false),
          maxFlow: maxFlow,
          stepDescription: `Итерация ${iteration}: Завершено`,
        },
        description: `Итерация ${iteration} завершена\nПоток увеличен на ${K}\nТекущий макс. поток: ${maxFlow}`,
        highlightedEdges: [],
        visitedVertices: [],
      });
      steps.push(step);
    }

    // Финальные результаты
    const saturatedEdges = edges.filter((e) => {
      const cap = capacities[e.id];
      const f = flowValues[e.id] || 0;
      return f === cap;
    });

    step = createStep(step, {
      metadata: {
        ...step.metadata,
        ...getVizData(),
        maxFlow: maxFlow,
        saturatedEdges: saturatedEdges.map((e) => e.id),
        stepDescription: "Результат",
      },
      description: `Максимальный поток: ${maxFlow}\nНасыщенных рёбер: ${saturatedEdges.length}`,
      highlightedVertices: [sourceId, sinkId],
      highlightedEdges: saturatedEdges.map((e) => e.id),
    });
    steps.push(step);

    return steps;
  },
};
