/** Theme preference (dark / light) persisted in localStorage */

export type ThemeMode = "dark" | "light";

const KEY = "prompt2plan.theme";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const v = localStorage.getItem(KEY);
  return v === "light" ? "light" : "dark";
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = mode;
  document.documentElement.classList.toggle("light", mode === "light");
  localStorage.setItem(KEY, mode);
}

export function toggleTheme(current: ThemeMode): ThemeMode {
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}
