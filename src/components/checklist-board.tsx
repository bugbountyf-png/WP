"use client";

import { useMemo, useState } from "react";
import { TaskRow, type TaskRowData } from "@/components/task-row";
import { Input, Select } from "@/components/ui";
import { TASK_CATEGORIES, TASK_CATEGORY_LABELS } from "@/lib/labels";
import { TASK_PHASES, taskPhase, type TaskPhase } from "@/lib/tasks";

function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total ? done / total : 0;
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 40 40" className="size-12 -rotate-90">
      <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" className="text-muted" strokeWidth="4" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="currentColor"
        className="text-primary"
        strokeWidth="4"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChecklistBoard({ tasks, weddingDate }: { tasks: TaskRowData[]; weddingDate: string }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("OPEN");
  const [phase, setPhase] = useState<TaskPhase | "ALL">("ALL");
  const done = tasks.filter((task) => task.completed).length;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (category !== "ALL" && task.category !== category) return false;
      if (status === "OPEN" && task.completed) return false;
      if (status === "DONE" && !task.completed) return false;
      if (phase !== "ALL" && taskPhase(task.dueDate, weddingDate) !== phase) return false;
      if (!q) return true;
      return [task.title, task.description ?? "", task.notes ?? ""].join(" ").toLowerCase().includes(q);
    });
  }, [tasks, query, category, status, phase, weddingDate]);
  const grouped = TASK_CATEGORIES.map((item) => ({
    category: item,
    items: filtered.filter((task) => task.category === item),
  })).filter((group) => group.items.length > 0);
  const extra = filtered.filter((task) => !TASK_CATEGORIES.includes(task.category as (typeof TASK_CATEGORIES)[number]));

  return (
    <div className="gutter grid gap-6 pb-10">
      <div className="flex flex-wrap items-center gap-4">
        <ProgressRing done={done} total={tasks.length} />
        <div>
          <p className="text-sm font-medium">
            {done} dari {tasks.length} selesai
          </p>
          <p className="text-xs text-muted-foreground">{tasks.length ? `${Math.round((done / tasks.length) * 100)}% selesai` : "Belum ada tugas"}</p>
        </div>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
        {TASK_PHASES.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setPhase(item.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${phase === item.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari tugas…" />
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="ALL">Semua kategori</option>
          {TASK_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {TASK_CATEGORY_LABELS[item]}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="OPEN">Belum selesai</option>
          <option value="DONE">Selesai</option>
          <option value="ALL">Semua status</option>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tidak ada tugas yang cocok dengan pencarian itu.</p>
      ) : (
        <div className="grid gap-8">
          {grouped.map((group) => (
            <section key={group.category}>
              <h2 className="text-sm font-medium text-muted-foreground">
                {TASK_CATEGORY_LABELS[group.category]}
                <span className="ml-2 font-normal">
                  {group.items.filter((t) => t.completed).length}/{group.items.length}
                </span>
              </h2>
              <ul className="mt-3 grid gap-2">
                {group.items.map((task) => (
                  <TaskRow key={task.id} task={task} weddingDate={weddingDate} />
                ))}
              </ul>
            </section>
          ))}
          {extra.length ? (
            <section>
              <h2 className="text-sm font-medium">Lainnya</h2>
              <ul className="mt-3 grid gap-2">
                {extra.map((task) => (
                  <TaskRow key={task.id} task={task} weddingDate={weddingDate} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
