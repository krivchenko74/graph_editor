import React, { useState } from "react";
import { AlgorithmStep } from "@/types/algorithm";
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
  const isRunning = useVisualization().totalSteps != 0;
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const getVertexText = (vertexId: string): string => {
    return vertices.find((v) => v.id === vertexId)?.text || vertexId;
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
              <h3 className={styles.title}>Ход выполнения алгоритма</h3>
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
              {steps.slice(0, currentStepIndex + 1).map((step, index) => (
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
                  {(step.stack!.length > 0 ||
                    step.visitedVertices?.length > 0) && (
                    <div className={styles.stepDetails}>
                      {step.stack && step.stack.length > 0 && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Стек:</span>
                          <span className={styles.stackValue}>
                            [
                            {step.stack
                              .map((id) => getVertexText(id))
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Статистика */}
          {currentStep && (
            <div className={styles.statistics}>
              <div className={styles.statisticsLabel}>Статистика:</div>
              <div className={styles.statsGrid}>
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
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Размер стека:</span>
                  <span className={styles.statValue}>
                    {currentStep.stack?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default Logs;
