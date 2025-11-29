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
  startVisualization: (
    algorithm: AlgorithmType,
    startVertexId: string,
    vertices: TVertex[],
    edges: TEdge[]
  ) => void;
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

  startVisualization: (
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

    const steps = algo.start(startVertexId, vertices, edges);

    set({
      isRunning: true,
      step: 0,
      steps,
      currentStep: steps[0],
      startVertexId,
      currentAlgorithm: algorithm,
    });
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
    const { step, steps } = get();
    if (step < steps.length - 1) {
      const newStep = step + 1;
      set({
        step: newStep,
        currentStep: steps[newStep],
      });
      console.log(steps[newStep]);
      return true;
    } else {
      set({ isRunning: false });
      return false;
    }
  },

  prevStep: () => {
    const { step, steps } = get();
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
