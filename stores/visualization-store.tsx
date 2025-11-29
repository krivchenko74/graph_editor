// visualization-store.tsx - версия с асинхронными обновлениями
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
  speed: 2,

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

    const steps = algo.start(startVertexId, vertices, edges);
    console.log("steps: ", steps);
    set({
      isRunning: false,
      step: 0,
      steps,
      currentStep: steps[0],
      startVertexId,
      currentAlgorithm: algorithm,
    });
  },

  startVisualization: () => {
    const { steps } = get();
    if (steps.length > 0) {
      set({ isRunning: true });
    }
  },

  stopVisualization: () => {
    set({
      isRunning: false,
      step: 0,
      currentStep: null,
      currentAlgorithm: null,
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

      // КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: объединяем обновления в один set
      set({
        step: newStep,
        currentStep: steps[newStep],
      });

      return true;
    } else {
      set({ isRunning: false });
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
    set({ speed });
  },

  setStep: (step: number) => {
    const { steps } = get();
    if (step >= 0 && step < steps.length) {
      set({
        step,
        currentStep: steps[step],
      });
    }
  },

  setAlgorithm: (algorithm: AlgorithmType | null) => {
    set({ currentAlgorithm: algorithm });
  },
}));

export default useVisualizationStore;
