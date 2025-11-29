// hooks/useVisualization.ts
import { useCallback, useEffect, useRef } from "react";
import useVisualizationStore from "@/stores/visualization-store";
import { AlgorithmType } from "@/types/algorithm";

const speeds = [0.2, 0.5, 1, 1.5, 2, 5, 10, 50, 100, 500, 5000];

export const useVisualization = () => {
  const {
    isRunning,
    step,
    steps,
    currentStep,
    startVertexId,
    currentAlgorithm,
    speed,
    startVisualization,
    stopVisualization,
    pauseVisualization,
    nextStep,
    prevStep,
    resetVisualization,
    setSpeed,
    setStep,
    setAlgorithm,
  } = useVisualizationStore();

  const animationRef = useRef<NodeJS.Timeout>(null);

  // Автоматическое воспроизведение
  useEffect(() => {
    if (!isRunning || steps.length === 0) {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      return;
    }

    const interval = speeds[speed]; // Теперь это интервал в миллисекундах

    const playNextStep = () => {
      const hasNext = nextStep();
      if (!hasNext) {
        stopVisualization();
      }
    };

    animationRef.current = setInterval(playNextStep, interval);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isRunning, speed, steps.length, nextStep, stopVisualization]);

  const startAlgorithm = useCallback(
    (
      algorithm: AlgorithmType,
      startVertexId: string,
      vertices: any[],
      edges: any[]
    ) => {
      startVisualization(algorithm, startVertexId, vertices, edges);
    },
    [startVisualization]
  );

  const handlePlayPause = useCallback(() => {
    if (isRunning) {
      pauseVisualization();
    } else {
      if (step >= steps.length - 1) {
        setStep(0);
      }
      useVisualizationStore.setState({ isRunning: true });
    }
  }, [isRunning, step, steps.length, pauseVisualization, setStep]);

  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      setSpeed(newSpeed);
    },
    [setSpeed]
  );

  const canGoNext = step < steps.length - 1;
  const canGoPrev = step > 0;
  const totalSteps = steps.length;

  return {
    // State
    isRunning,
    step,
    steps,
    currentStep,
    startVertexId,
    currentAlgorithm,
    speed: speeds[speed],
    speedIndex: speed,

    // Navigation
    canGoNext,
    canGoPrev,
    totalSteps,

    // Actions
    startAlgorithm,
    stopVisualization,
    pauseVisualization,
    nextStep,
    prevStep,
    resetVisualization,
    handlePlayPause,
    handleSpeedChange,
    setStep,
    setAlgorithm,
  };
};
