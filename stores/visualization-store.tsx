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
  endVertexId: string | null;
  currentAlgorithm: AlgorithmType | null;
  speed: number;
  isSelectingStartVertex: boolean;
  isSelectingEndVertex: boolean;

  // Действия
  prepareAlgorithm: (
    algorithm: AlgorithmType,
    startVertexId: string,
    endVertexId: string | null,
    vertices: TVertex[],
    edges: TEdge[]
  ) => void;
  setStartVertex: (vertexId: string | null) => void;
  setEndVertex: (vertexId: string | null) => void;
  startSelectingStartVertex: () => void;
  startSelectingEndVertex: () => void;
  cancelVertexSelection: () => void;
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
  endVertexId: null,
  currentAlgorithm: null,
  speed: 2,
  isSelectingStartVertex: false,
  isSelectingEndVertex: false,

  prepareAlgorithm: (
    algorithm: AlgorithmType,
    startVertexId: string,
    endVertexId: string | null,
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
      if (algo.requirements.endVertex && !endVertexId) {
        alert(`Алгоритм ${algo.name} требует выбор конечной вершины`);
        return;
      }
    }

    // Генерируем шаги алгоритма
    const steps = algo.start(startVertexId, endVertexId, vertices, edges);

    set({
      steps,
      currentStep: steps[0],
      startVertexId,
      endVertexId,
      currentAlgorithm: algorithm,
      step: 0,
      isSelectingStartVertex: false,
      isSelectingEndVertex: false,
    });
  },

  setStartVertex: (vertexId: string | null) => {
    set({
      startVertexId: vertexId,
      isSelectingStartVertex: false,
    });
  },

  setEndVertex: (vertexId: string | null) => {
    set({
      endVertexId: vertexId,
      isSelectingEndVertex: false,
    });
  },

  startSelectingStartVertex: () => {
    set({
      isSelectingStartVertex: true,
      isSelectingEndVertex: false,
    });
  },

  startSelectingEndVertex: () => {
    set({
      isSelectingEndVertex: true,
      isSelectingStartVertex: false,
    });
  },

  cancelVertexSelection: () => {
    set({
      isSelectingStartVertex: false,
      isSelectingEndVertex: false,
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
      set({
        step: newStep,
        currentStep: steps[newStep],
      });
      return true;
    } else {
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
        isRunning: false,
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
      endVertexId: null,
      currentAlgorithm: null,
      isSelectingStartVertex: false,
      isSelectingEndVertex: false,
    });
  },

  setSpeed: (speed: number) => {
    const clampedSpeed = Math.max(0, Math.min(10, speed));
    set({ speed: clampedSpeed });
  },

  setStep: (step: number) => {
    const { steps } = get();
    if (step >= 0 && step < steps.length) {
      set({
        step,
        currentStep: steps[step],
        isRunning: false,
      });
    }
  },

  setAlgorithm: (algorithm: AlgorithmType | null) => {
    set({
      currentAlgorithm: algorithm,
      isSelectingStartVertex: false,
      isSelectingEndVertex: false,
    });
  },
}));

export default useVisualizationStore;
