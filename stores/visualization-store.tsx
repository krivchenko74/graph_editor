// stores/visualization-store.ts
import { create } from "zustand";
import { AlgorithmType, AlgorithmStep } from "@/types/algorithm";
import { getAlgorithm } from "@/algorithms/index";
import { TVertex, TEdge } from "@/types/graph";

interface IVisualizationStore {
  // Состояние
  isRunning: boolean;
  step: number;
  steps: AlgorithmStep[];
  currentStep: AlgorithmStep | null;
  startVertexId: string | null;
  currentAlgorithm: AlgorithmType | null;
  speed: number;

  // Действия
  prepareAlgorithm: (
    algorithm: AlgorithmType,
    startVertexId: string,
    vertices: TVertex[],
    edges: TEdge[]
  ) => void;
  startVisualization: () => void;
  stopVisualization: () => void;
  pauseVisualization: () => void;
  nextStep: () => boolean;
  prevStep: () => void;
  resetVisualization: () => void;
  setSpeed: (speed: number) => void;
  setStep: (step: number) => void;
  setAlgorithm: (algorithm: AlgorithmType | null) => void;
}

const useVisualizationStore = create<IVisualizationStore>((set, get) => ({
  isRunning: false,
  step: 0,
  steps: [],
  currentStep: null,
  startVertexId: null,
  currentAlgorithm: null,
  speed: 5, // Индекс по умолчанию для скорости 200ms

  prepareAlgorithm: (
    algorithm: AlgorithmType,
    startVertexId: string,
    vertices: TVertex[],
    edges: TEdge[]
  ) => {
    const algo = getAlgorithm(algorithm);
    if (!algo) {
      console.error(`Algorithm ${algorithm} not found`);
      return;
    }

    // Сбрасываем состояние перед подготовкой нового алгоритма
    set({
      isRunning: false,
      step: 0,
      steps: [],
      currentStep: null,
    });

    // Проверяем требования алгоритма
    if (algo.requirements) {
      if (algo.requirements.directed && !edges.some((e) => e.directed)) {
        alert(`Алгоритм ${algo.name} требует направленные ребра`);
        return;
      }
      if (algo.requirements.weighted && edges.some((e) => !e.weight)) {
        alert(`Алгоритм ${algo.name} требует взвешенные ребра`);
        return;
      }
    }

    // Генерируем шаги алгоритма
    const steps = algo.start(startVertexId, vertices, edges);

    if (steps.length === 0) {
      console.error("Algorithm generated no steps");
      return;
    }

    console.log(`Generated ${steps.length} steps for algorithm`, algorithm);

    set({
      steps,
      currentStep: steps[0],
      startVertexId,
      currentAlgorithm: algorithm,
      step: 0,
    });
  },

  startVisualization: () => {
    const { steps, step } = get();
    if (steps.length > 0 && step < steps.length) {
      set({ isRunning: true });
    }
  },

  stopVisualization: () => {
    set({
      isRunning: false,
      step: 0,
      currentStep: get().steps[0] || null,
    });
  },

  pauseVisualization: () => {
    set({ isRunning: false });
  },

  nextStep: () => {
    const state = get();
    const { step, steps } = state;

    if (step < steps.length - 1) {
      const newStep = step + 1;

      // Синхронное обновление состояния
      set({
        step: newStep,
        currentStep: steps[newStep],
      });

      return true;
    } else {
      // Достигнут конец - останавливаем воспроизведение
      set({
        isRunning: false,
        currentStep: steps[steps.length - 1],
      });
      return false;
    }
  },

  prevStep: () => {
    const state = get();
    const { step, steps } = state;

    if (step > 0) {
      const newStep = step - 1;
      set({
        step: newStep,
        currentStep: steps[newStep],
        isRunning: false, // Пауза при переходе назад
      });
    }
  },

  resetVisualization: () => {
    set({
      isRunning: false,
      step: 0,
      steps: [],
      currentStep: null,
      startVertexId: null,
      currentAlgorithm: null,
    });
  },

  setSpeed: (speed: number) => {
    // Ограничиваем скорость в допустимых пределах
    const clampedSpeed = Math.max(0, Math.min(10, speed));
    set({ speed: clampedSpeed });
  },

  setStep: (step: number) => {
    const { steps } = get();
    if (step >= 0 && step < steps.length) {
      set({
        step,
        currentStep: steps[step],
        isRunning: false, // Пауза при ручном переходе
      });
    }
  },

  setAlgorithm: (algorithm: AlgorithmType | null) => {
    set({ currentAlgorithm: algorithm });
  },
}));

export default useVisualizationStore;
