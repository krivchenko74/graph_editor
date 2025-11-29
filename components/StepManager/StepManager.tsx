// StepManager.tsx - с нормализованными скоростями
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

// Функция для форматирования скорости в понятный вид
const formatSpeed = (ms: number) => {
  if (ms >= 1000) {
    return `${ms / 1000}s`; // показываем в секундах
  } else {
    return `${ms}ms`; // показываем в миллисекундах
  }
};

export default function StepManager() {
  const speeds = [5000, 2000, 1000, 667, 500, 200, 100, 20, 10, 2, 0.2];

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

  const isShown = true;

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
            {formatSpeed(speeds[speedIndex])}
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
