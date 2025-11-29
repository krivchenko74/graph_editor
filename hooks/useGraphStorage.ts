import { useEffect } from "react";
import { useGraphStore } from "@/stores/graph-store";

export const useGraphStorage = () => {
  const { graph, setGraph } = useGraphStore();

  useEffect(() => {
    // Загрузка из localStorage
    const saved = localStorage.getItem("graph");
    if (saved) setGraph(JSON.parse(saved));
  }, [setGraph]);

  useEffect(() => {
    // Сохранение в localStorage
    localStorage.setItem("graph", JSON.stringify(graph));
  }, [graph]);
};
