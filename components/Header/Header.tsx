// Header.tsx - исправленная версия
"use client";
import Select from "../Select/Select";
import GraphActionsMenu from "../GraphActionsMenu/GraphActionsMenu";
import { useGraphStore } from "@/stores/graph-store";
import { useVisualization } from "@/hooks/useVisualization";
import { getAvailableAlgorithms } from "@/algorithms";
import styles from "./Header.module.css";

import { Download, Upload, Trash2 } from "lucide-react";

export default function Header() {
  const { clearGraph, graph } = useGraphStore();
  const { prepareAlgorithm, currentAlgorithm } = useVisualization(); // Используем prepareAlgorithm

  const algorithms = getAvailableAlgorithms();
  console.log(algorithms);

  const handleAlgorithmSelect = (algorithmType: string) => {
    if (graph.vertices.length === 0) {
      alert("Добавьте вершины для запуска алгоритма");
      return;
    }

    // Для алгоритмов, требующих выбор начальной вершины
    if (algorithmType === "dfs") {
      const startVertex = graph.vertices[0];
      if (startVertex) {
        prepareAlgorithm(
          // Используем prepareAlgorithm вместо setAlgorithm
          algorithmType as any,
          startVertex.id,
          graph.vertices,
          graph.edges
        );
      }
    } else if (algorithmType === "bfs") {
      const startVertex = graph.vertices[0];
      if (startVertex) {
        prepareAlgorithm(
          // Используем prepareAlgorithm вместо setAlgorithm
          algorithmType as any,
          startVertex.id,
          graph.vertices,
          graph.edges
        );
      }
    }
  };

  const handleDownloadGraph = () => {
    const graph = useGraphStore.getState().graph;

    // Добавляем метаданные к файлу
    const graphData = {
      version: "1.0",
      created: new Date().toISOString(),
      type: "graph",
      data: graph,
    };

    const dataStr = JSON.stringify(graphData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `graph-${new Date().toISOString().split("T")[0]}.graph`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleUploadGraph = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".graph,.json";

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const fileContent = JSON.parse(event.target?.result as string);

          // Проверяем формат файла .graph или обычный JSON
          let graphData;
          if (fileContent.type === "graph" && fileContent.data) {
            // Это файл .graph с метаданными
            graphData = fileContent.data;
          } else if (
            fileContent.vertices !== undefined &&
            fileContent.edges !== undefined
          ) {
            // Это обычный JSON графа
            graphData = fileContent;
          } else {
            throw new Error("Неверный формат файла");
          }

          useGraphStore.getState().setGraph(graphData);
        } catch (error) {
          alert("Ошибка при чтении файла: " + (error as Error).message);
        }
      };
      reader.readAsText(file);
    };

    input.click();
  };

  const handleClearGraph = () => {
    if (confirm("Вы действительно хотите удалить граф?")) {
      clearGraph();
    }
  };

  const actions = [
    {
      label: "Скачать как .graph",
      value: "download-graph",
      icon: <Download size={20} />,
      onClick: handleDownloadGraph,
    },
    {
      label: "Загрузить из файла",
      value: "upload",
      icon: <Upload size={20} />,
      onClick: handleUploadGraph,
    },
    {
      label: "Удалить граф",
      value: "delete",
      icon: <Trash2 size={20} />,
      danger: true,
      onClick: handleClearGraph,
    },
  ];

  return (
    <header className={styles.header}>
      <GraphActionsMenu actions={actions} label="Действия с графом" />
      <Select
        placeholder="Алгоритмы"
        value={currentAlgorithm || ""}
        onChange={handleAlgorithmSelect}
        options={algorithms}
      />
    </header>
  );
}
