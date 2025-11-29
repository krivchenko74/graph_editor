"use client";
import styles from "./StepManager.module.css";
import {
  BsChevronDoubleRight,
  BsChevronDoubleLeft,
  BsFastForward,
  BsCaretRight,
  BsPlay,
  BsPause,
  BsX,
} from "react-icons/bs";
import { useVisualization } from "@/hooks/useVisualization";

export default function StepManager() {
  const speeds = [0.2, 0.5, 1, 1.5, 2, 5, 10, 50, 100, 500, 5000];

  const {
    isRunning,
    step,
    totalSteps,
    canGoNext,
    canGoPrev,
    speedIndex,
    nextStep,
    prevStep,
    handlePlayPause,
    handleSpeedChange,
    setStep,
    resetVisualization,
    currentAlgorithm,
  } = useVisualization();

  const handleFirstStep = () => setStep(0);
  const handleLastStep = () => setStep(totalSteps - 1);

  const incrementSpeed = () => {
    if (speedIndex < speeds.length - 1) {
      handleSpeedChange(speedIndex + 1);
    }
  };

  const decrementSpeed = () => {
    if (speedIndex > 0) {
      handleSpeedChange(speedIndex - 1);
    }
  };
  const isShown = totalSteps != 0;
  return (
    isShown && (
      <div className={styles.container}>
        {/* Основные контролы навигации */}
        <div className={styles.step_container}>
          <button
            className={styles.button}
            onClick={handleFirstStep}
            disabled={step === 0 || totalSteps === 0}
            title="В начало"
          >
            <BsFastForward size={20} className={styles.turn} />
          </button>

          <button
            className={styles.button}
            onClick={prevStep}
            disabled={!canGoPrev || totalSteps === 0}
            title="Предыдущий шаг"
          >
            <BsCaretRight size={20} className={styles.turn} />
          </button>

          <button
            style={{ border: "1px solid rgb(173, 173, 173)" }}
            className={styles.button}
            onClick={handlePlayPause}
            disabled={totalSteps === 0}
            title={isRunning ? "Пауза" : "Воспроизведение"}
          >
            {isRunning ? (
              <BsPause size={20} />
            ) : (
              <BsPlay style={{ marginLeft: 2 }} size={20} />
            )}
          </button>

          <button
            className={styles.button}
            onClick={nextStep}
            disabled={!canGoNext || totalSteps === 0}
            title="Следующий шаг"
          >
            <BsCaretRight size={20} />
          </button>

          <button
            className={styles.button}
            onClick={handleLastStep}
            disabled={step === totalSteps - 1 || totalSteps === 0}
            title="В конец"
          >
            <BsFastForward size={20} />
          </button>
        </div>

        {/* Контролы скорости */}
        <div className={styles.autoplay_container}>
          <button
            className={styles.button}
            onClick={decrementSpeed}
            disabled={speedIndex === 0 || totalSteps === 0}
            title="Уменьшить скорость"
          >
            <BsChevronDoubleLeft size={20} />
          </button>

          <span className={styles.text} title="Скорость воспроизведения">
            {speeds[speedIndex]}x
          </span>

          <button
            className={styles.button}
            onClick={incrementSpeed}
            disabled={speedIndex === speeds.length - 1 || totalSteps === 0}
            title="Увеличить скорость"
          >
            <BsChevronDoubleRight size={20} />
          </button>
        </div>

        {/* Кнопка сброса */}
        {totalSteps > 0 && (
          <button
            className={styles.resetButton}
            onClick={resetVisualization}
            title="Сбросить визуализацию"
          >
            <BsX size={25} />
          </button>
        )}
      </div>
    )
  );
}
