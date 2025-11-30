// hooks/useVisualization.ts
"use client";

import { useCallback, useEffect, useRef } from "react";
import useVisualizationStore from "@/stores/visualization-store";
import { AlgorithmType } from "@/types/algorithm";

const speeds = [5000, 2000, 1000, 667, 500, 200, 100, 20, 10, 2, 0.2];

export const useVisualization = () => {
  const store = useVisualizationStore();

  // Refs для хранения состояния таймера
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastStepTimeRef = useRef<number>(0);

  // Очистка таймера
  const clearAnimation = useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
    isProcessingRef.current = false;
  }, []);

  // Функция воспроизведения одного шага
  const playStep = useCallback(() => {
    if (
      !store.isRunning ||
      isProcessingRef.current ||
      store.steps.length === 0
    ) {
      return;
    }

    const now = Date.now();
    const interval = Math.max(50, speeds[store.speed]);

    if (now - lastStepTimeRef.current >= interval) {
      isProcessingRef.current = true;

      try {
        const hasNext = store.nextStep();
        lastStepTimeRef.current = now;

        if (!hasNext) {
          store.stopVisualization();
          return;
        }
      } finally {
        isProcessingRef.current = false;
      }
    }

    if (store.isRunning) {
      const timeSinceLast = Date.now() - lastStepTimeRef.current;
      const nextDelay = Math.max(10, interval - timeSinceLast);
      animationRef.current = setTimeout(playStep, nextDelay);
    }
  }, [store]);

  // Запуск воспроизведения
  const startPlayback = useCallback(() => {
    if (store.steps.length === 0) return;

    clearAnimation();
    lastStepTimeRef.current = Date.now();
    animationRef.current = setTimeout(playStep, speeds[store.speed]);
  }, [store, clearAnimation, playStep]);

  // Остановка воспроизведения
  const stopPlayback = useCallback(() => {
    clearAnimation();
  }, [clearAnimation]);

  // Основной эффект для управления воспроизведением
  useEffect(() => {
    if (store.isRunning && store.steps.length > 0) {
      startPlayback();
    } else {
      stopPlayback();
    }

    return () => {
      stopPlayback();
    };
  }, [
    store.isRunning,
    store.steps.length,
    store.speed,
    startPlayback,
    stopPlayback,
  ]);

  // Эффект для сброса при изменении алгоритма
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [store.currentAlgorithm, stopPlayback]);

  // Подготовка алгоритма
  const prepareAlgorithm = useCallback(
    (
      algorithm: AlgorithmType,
      startVertexId: string,
      endVertexId: string | null,
      vertices: any[],
      edges: any[]
    ) => {
      store.prepareAlgorithm(
        algorithm,
        startVertexId,
        endVertexId,
        vertices,
        edges
      );
    },
    [store]
  );

  // Запуск алгоритма с автоматической подготовкой
  const startAlgorithm = useCallback(
    (algorithm: AlgorithmType, vertices: any[], edges: any[]) => {
      if (!store.startVertexId) {
        console.error("No start vertex selected");
        return;
      }

      const endVertexId = store.endVertexId;
      prepareAlgorithm(
        algorithm,
        store.startVertexId,
        endVertexId,
        vertices,
        edges
      );
      store.startVisualization();
    },
    [store, prepareAlgorithm]
  );

  const handlePlayPause = useCallback(() => {
    if (store.isRunning) {
      store.pauseVisualization();
    } else {
      if (store.step >= store.steps.length - 1) {
        store.setStep(0);
      }
      store.startVisualization();
    }
  }, [store]);

  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      store.setSpeed(newSpeed);
    },
    [store]
  );

  // Функции для управления выбором вершин
  const setStartVertex = useCallback(
    (vertexId: string | null) => {
      store.setStartVertex(vertexId);
    },
    [store]
  );

  const setEndVertex = useCallback(
    (vertexId: string | null) => {
      store.setEndVertex(vertexId);
    },
    [store]
  );

  const startSelectingStartVertex = useCallback(() => {
    store.startSelectingStartVertex();
  }, [store]);

  const startSelectingEndVertex = useCallback(() => {
    store.startSelectingEndVertex();
  }, [store]);

  const cancelVertexSelection = useCallback(() => {
    store.cancelVertexSelection();
  }, [store]);

  // Проверка готовности алгоритма
  const isAlgorithmReady = useCallback(
    (algorithm: AlgorithmType): boolean => {
      if (!store.startVertexId) return false;

      if (algorithm === "shortest-path" && !store.endVertexId) {
        return false;
      }

      return true;
    },
    [store.startVertexId, store.endVertexId]
  );

  const canGoNext = store.step < store.steps.length - 1;
  const canGoPrev = store.step > 0;
  const totalSteps = store.steps.length;

  return {
    // Состояние
    isRunning: store.isRunning,
    step: store.step,
    steps: store.steps,
    currentStep: store.currentStep,
    startVertexId: store.startVertexId,
    endVertexId: store.endVertexId,
    currentAlgorithm: store.currentAlgorithm,
    speed: speeds[store.speed],
    speedIndex: store.speed,
    isSelectingStartVertex: store.isSelectingStartVertex,
    isSelectingEndVertex: store.isSelectingEndVertex,

    // Флаги доступности
    canGoNext,
    canGoPrev,
    totalSteps,

    // Функции подготовки и управления
    prepareAlgorithm,
    startAlgorithm,
    startVisualization: store.startVisualization,
    stopVisualization: store.stopVisualization,
    pauseVisualization: store.pauseVisualization,
    nextStep: store.nextStep,
    prevStep: store.prevStep,
    resetVisualization: store.resetVisualization,
    setStep: store.setStep,
    setAlgorithm: store.setAlgorithm,

    // Управление выбором вершин
    setStartVertex,
    setEndVertex,
    startSelectingStartVertex,
    startSelectingEndVertex,
    cancelVertexSelection,
    isAlgorithmReady,

    // UI контролы
    handlePlayPause,
    handleSpeedChange,
  };
};
