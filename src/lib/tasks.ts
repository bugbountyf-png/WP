import { daysUntil } from "./utils";

export type TaskPhase = "12" | "6" | "3" | "1";

export const TASK_PHASES: Array<{ key: TaskPhase | "ALL"; label: string }> = [
  { key: "ALL", label: "Semua fase" },
  { key: "12", label: "12 bulan" },
  { key: "6", label: "6 bulan" },
  { key: "3", label: "3 bulan" },
  { key: "1", label: "1 bulan" },
];

export function taskPhase(due: Date | string | null, wedding: Date | string): TaskPhase | null {
  if (!due) return null;
  const daysBefore = daysUntil(wedding, new Date(due));
  if (daysBefore >= 270) return "12";
  if (daysBefore >= 150) return "6";
  if (daysBefore >= 45) return "3";
  return "1";
}

export function phaseLabel(phase: TaskPhase | null) {
  if (phase === "12") return "12 bulan sebelum";
  if (phase === "6") return "6 bulan sebelum";
  if (phase === "3") return "3 bulan sebelum";
  if (phase === "1") return "1 bulan sebelum";
  return "Tanpa tenggat";
}

export function picLabel(assignee?: string | null) {
  if (assignee === "CPP") return "Mempelai pria";
  if (assignee === "CPW") return "Mempelai wanita";
  return "Bersama";
}
