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

    // Проверяем, прошло ли достаточно времени
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

    // Планируем следующий шаг, если все еще воспроизводим
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
    console.log("🎬 Main effect:", {
      isRunning: store.isRunning,
      steps: store.steps.length,
      speed: store.speed,
    });

    if (store.isRunning && store.steps.length > 0) {
      console.log("🚀 Starting playback");
      startPlayback();
    } else {
      console.log("⏹️ Stopping playback");
      stopPlayback();
    }

    return () => {
      console.log("🧹 Cleanup main effect");
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
      console.log("🔄 Algorithm changed, cleaning up");
      stopPlayback();
    };
  }, [store.currentAlgorithm, stopPlayback]);

  const prepareAlgorithm = useCallback(
    (
      algorithm: AlgorithmType,
      startVertexId: string,
      vertices: any[],
      edges: any[]
    ) => {
      store.prepareAlgorithm(algorithm, startVertexId, vertices, edges);
    },
    [store]
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

  const canGoNext = store.step < store.steps.length - 1;
  const canGoPrev = store.step > 0;
  const totalSteps = store.steps.length;

  return {
    isRunning: store.isRunning,
    step: store.step,
    steps: store.steps,
    currentStep: store.currentStep,
    startVertexId: store.startVertexId,
    currentAlgorithm: store.currentAlgorithm,
    speed: speeds[store.speed],
    speedIndex: store.speed,
    canGoNext,
    canGoPrev,
    totalSteps,
    prepareAlgorithm,
    startVisualization: store.startVisualization,
    stopVisualization: store.stopVisualization,
    pauseVisualization: store.pauseVisualization,
    nextStep: store.nextStep,
    prevStep: store.prevStep,
    resetVisualization: store.resetVisualization,
    handlePlayPause,
    handleSpeedChange,
    setStep: store.setStep,
    setAlgorithm: store.setAlgorithm,
  };
};
