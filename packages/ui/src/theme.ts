export const palette = {
  bg: "#f2ecdf",
  fg: "#5a5e41",
  fgMuted: "rgba(90, 94, 65, 0.7)",
  accent: "#8b9d4f",
  accentWarm: "#c4a86e",
  line: "rgba(90, 94, 65, 0.15)",
  lineStrong: "rgba(90, 94, 65, 0.3)",
  surface: "#ebe3d1",
  surfaceRaised: "#f7f2e7",
  positive: "#6b8e3d",
  warning: "#c4863d",
  danger: "#a04a3a",
} as const;

export type PaletteKey = keyof typeof palette;
