// types/colors.ts
export enum VertexColor {
  DEFAULT = "#3b82f6", // Синий
  SELECTED = "#dc2626", // Красный
  VISITED = "#10b981", // Зеленый
  CURRENT = "#f59e0b", // Оранжевый
  QUEUED = "#8b5cf6", // Фиолетовый
  PATH = "#06b6d4", // Голубой
  START = "#10b981", // Зеленый для стартовой
  END = "#ef4444", // Красный для конечной
  SELECTING_START = "#10b981", // Зеленый при выборе стартовой
  SELECTING_END = "#ef4444", // Красный при выборе конечной
}

export enum EdgeColor {
  DEFAULT = "#6b7280", // Серый
  SELECTED = "#dc2626", // Красный
  VISITED = "#10b981", // Зеленый
  HIGHLIGHTED = "#f59e0b", // Оранжевый
  PATH = "#06b6d4", // Голубой
}
