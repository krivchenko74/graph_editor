import React, { useState } from "react";
import { AlgorithmStep, AlgorithmType } from "@/types/algorithm";
import styles from "./Logs.module.css";
import { useGraphStore } from "@/stores/graph-store";
import { ChevronDown } from "lucide-react";
import { useVisualization } from "@/hooks/useVisualization";

interface AlgorithmLogProps {
  steps: AlgorithmStep[];
  currentStepIndex: number;
  className?: string;
}

const Logs: React.FC<AlgorithmLogProps> = ({
  steps,
  currentStepIndex,
  className = "",
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentStep = steps[currentStepIndex];
  const { graph } = useGraphStore();
  const vertices = graph.vertices;
  const edges = graph.edges;
  const isRunning = useVisualization().totalSteps != 0;

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const getVertexText = (vertexId: string): string => {
    return vertices.find((v) => v.id === vertexId)?.text || vertexId;
  };

  const getEdgeText = (edgeId: string): string => {
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return edgeId;
    return `${getVertexText(edge.source)}-${getVertexText(edge.target)} (${
      edge.weight
    })`;
  };

  // Автоматическое определение типа алгоритма
  const detectAlgorithmType = (): AlgorithmType => {
    const stepWithData = steps.find(
      (step) => step.stack || step.queue || step.priorityQueue
    );

    if (stepWithData?.priorityQueue !== undefined) {
      return "mst"; // Для Прима используем priorityQueue
    }
    if (stepWithData?.queue !== undefined) {
      return "bfs";
    }
    return "dfs";
  };

  const algorithmType = detectAlgorithmType();

  // Функция для получения структуры данных
  const getDataStructure = (step: AlgorithmStep) => {
    switch (algorithmType) {
      case "bfs":
        return {
          data: step.queue || [],
          label: "Очередь",
          className: styles.queueValue,
          formatItem: getVertexText,
        };
      case "mst":
        return {
          data: step.visitedEdges || [],
          label: "Рёбра MST",
          className: styles.mstValue,
          formatItem: getEdgeText,
        };
      default:
        return {
          data: step.stack || [],
          label: "Стек",
          className: styles.stackValue,
          formatItem: getVertexText,
        };
    }
  };

  // Функция для получения размера структуры данных
  const getDataStructureSize = (step: AlgorithmStep) => {
    switch (algorithmType) {
      case "bfs":
        return step.queue?.length || 0;
      case "mst":
        return step.visitedEdges?.length || 0;
      default:
        return step.stack?.length || 0;
    }
  };

  // Функция для получения названия алгоритма
  const getAlgorithmName = () => {
    switch (algorithmType) {
      case "bfs":
        return "BFS (поиск в ширину)";
      case "mst":
        return "Алгоритм Прима (MST)";
      default:
        return "DFS (поиск в глубину)";
    }
  };

  // Получение веса MST из metadata
  const getMSTTotalWeight = (step: AlgorithmStep): number => {
    return step.metadata?.mstTotalWeight || 0;
  };

  // Функция для отображения статистики в зависимости от алгоритма
  const renderStatistics = () => {
    const commonStats = (
      <>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Посещено вершин:</span>
          <span className={styles.statValue}>
            {currentStep.visitedVertices?.length || 0}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Пройдено рёбер:</span>
          <span className={styles.statValue}>
            {currentStep.visitedEdges?.length || 0}
          </span>
        </div>
      </>
    );

    switch (algorithmType) {
      case "bfs":
        return (
          <>
            {commonStats}
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Размер очереди:</span>
              <span className={styles.statValue}>
                {getDataStructureSize(currentStep)}
              </span>
            </div>
          </>
        );
      case "mst":
        return (
          <>
            {commonStats}
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Рёбер в MST:</span>
              <span className={styles.statValue}>
                {getDataStructureSize(currentStep)}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Общий вес:</span>
              <span className={styles.statValue}>
                {getMSTTotalWeight(currentStep)}
              </span>
            </div>
          </>
        );
      default:
        return (
          <>
            {commonStats}
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Размер стека:</span>
              <span className={styles.statValue}>
                {getDataStructureSize(currentStep)}
              </span>
            </div>
          </>
        );
    }
  };

  return (
    isRunning && (
      <div
        onWheel={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className={`${styles.logContainer} ${className} ${
          isCollapsed ? styles.collapsed : ""
        }`}
      >
        <div className={styles.header} onClick={toggleCollapse}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h3 className={styles.title}>Ход выполнения алгоритма</h3>
                <div className={styles.algorithmType}>{getAlgorithmName()}</div>
              </div>
              <ChevronDown className={styles.collapseIcon} />
            </div>

            <div className={styles.stepCounter}>
              Шаг {currentStepIndex + 1} из {steps.length}
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {/* Текущее описание */}
          <div className={styles.currentStep}>
            <div className={styles.currentStepLabel}>Текущее действие:</div>
            <div className={styles.description}>
              {currentStep?.description || "Алгоритм не начат"}
            </div>
          </div>

          {/* История шагов */}
          <div className={styles.history}>
            <div className={styles.historyLabel}>История выполнения:</div>
            <div className={styles.stepsList}>
              {steps.slice(0, currentStepIndex + 1).map((step, index) => {
                const dataStructure = getDataStructure(step);

                return (
                  <div
                    key={index}
                    className={`${styles.stepItem} ${
                      index === currentStepIndex ? styles.currentStepItem : ""
                    }`}
                  >
                    <div className={styles.stepNumber}>Шаг {index + 1}</div>
                    <div className={styles.stepDescription}>
                      {step.description}
                    </div>

                    {/* Дополнительная информация о шаге */}
                    {(dataStructure.data.length > 0 ||
                      step.visitedVertices?.length > 0) && (
                      <div className={styles.stepDetails}>
                        {dataStructure.data.length > 0 && (
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>
                              {dataStructure.label}:
                            </span>
                            <span className={dataStructure.className}>
                              [
                              {dataStructure.data
                                .map((id) => dataStructure.formatItem(id))
                                .join(", ")}
                              ]
                            </span>
                          </div>
                        )}

                        {step.currentVertexId && (
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>
                              Текущая вершина:
                            </span>
                            <span className={styles.vertexValue}>
                              {getVertexText(step.currentVertexId)}
                            </span>
                          </div>
                        )}

                        {step.visitedVertices &&
                          step.visitedVertices.length > 0 && (
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>
                                Посещено:
                              </span>
                              <span className={styles.visitedValue}>
                                {step.visitedVertices
                                  .map((id) => getVertexText(id))
                                  .join(", ")}
                              </span>
                            </div>
                          )}

                        {algorithmType === "mst" &&
                          getMSTTotalWeight(step) > 0 && (
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>
                                Текущий вес MST:
                              </span>
                              <span className={styles.weightValue}>
                                {getMSTTotalWeight(step)}
                              </span>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Статистика */}
          {currentStep && (
            <div className={styles.statistics}>
              <div className={styles.statisticsLabel}>Статистика:</div>
              <div className={styles.statsGrid}>{renderStatistics()}</div>
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default Logs;
