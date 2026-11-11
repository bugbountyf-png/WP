"use client";

import { useMemo, useState } from "react";
import { deleteTask, toggleTask, updateTask } from "@/app/actions/data";
import { DeleteForm, RowActions } from "@/components/forms";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { TASK_CATEGORIES, TASK_CATEGORY_LABELS } from "@/lib/labels";
import { phaseLabel, picLabel, taskPhase } from "@/lib/tasks";
import { daysUntil, formatShortDate, toDateInput } from "@/lib/utils";

export type TaskRowData = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  dueDate: string | null;
  priority: string;
  notes: string | null;
  completed: boolean;
  assignee: string;
};

function dueHint(iso: string | null) {
  if (!iso) return "Kosongkan kalau nggak ada tenggatnya.";
  const days = daysUntil(iso);
  if (days === 0) return "Hari ini";
  if (days > 0) return `${days} hari lagi`;
  return `${Math.abs(days)} hari lalu`;
}

export function TaskRow({ task, weddingDate }: { task: TaskRowData; weddingDate: string }) {
  const [open, setOpen] = useState(false);
  const [due, setDue] = useState(task.dueDate ? toDateInput(task.dueDate) : "");
  const hint = useMemo(() => dueHint(due || null), [due]);
  const overdue = task.dueDate ? daysUntil(task.dueDate) < 0 && !task.completed : false;

  return (
    <>
      <li className="surface flex items-start gap-3 p-3">
        <form action={toggleTask.bind(null, task.id, !task.completed)}>
          <button
            type="submit"
            aria-label={task.completed ? "Tandai belum" : "Tandai selesai"}
            className={`mt-1 size-5 rounded-full border ${task.completed ? "border-tone-fern bg-tone-fern" : "border-input"}`}
          />
        </form>
        <button type="button" onClick={() => setOpen(true)} className="min-w-0 flex-1 text-left">
          <p className={task.completed ? "text-sm text-muted-foreground line-through" : "text-sm font-medium"}>{task.title}</p>
          {task.description ? <p className="mt-1 text-xs text-muted-foreground">{task.description}</p> : null}
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5">{phaseLabel(taskPhase(task.dueDate, weddingDate))}</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">PIC: {picLabel(task.assignee)}</span>
            {task.dueDate ? formatShortDate(task.dueDate) : "Tanpa tenggat"}
            <span className="text-primary">Ubah</span>
            {task.priority === "HIGH" ? (
              <span className="rounded-full bg-tone-marigold-soft px-1.5 py-0.5 text-[0.65rem] font-medium text-tone-marigold">
                {overdue ? "Terlambat" : "Mendesak"}
              </span>
            ) : null}
          </p>
        </button>
        <RowActions>
          <DeleteForm action={deleteTask.bind(null, task.id)} />
        </RowActions>
      </li>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center">
          <button className="absolute inset-0 bg-foreground/40" aria-label="Tutup" onClick={() => setOpen(false)} />
          <div className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-card p-5 shadow-xl sm:max-w-lg sm:rounded-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 className="display text-2xl">Ubah tugas</h2>
              <button className="text-muted-foreground" onClick={() => setOpen(false)} aria-label="Tutup">
                ×
              </button>
            </div>
            <form
              action={async (formData) => {
                await updateTask(formData);
                setOpen(false);
              }}
              className="grid gap-4"
            >
              <input type="hidden" name="id" value={task.id} />
              <Field label="Judul">
                <Input name="title" defaultValue={task.title} required autoFocus />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Kategori">
                  <Select name="category" defaultValue={task.category}>
                    {TASK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {TASK_CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Urgensi">
                  <Select name="priority" defaultValue={task.priority}>
                    <option value="HIGH">Tinggi</option>
                    <option value="MEDIUM">Sedang</option>
                    <option value="LOW">Rendah</option>
                  </Select>
                </Field>
              </div>
              <Field label="PIC">
                <Select name="assignee" defaultValue={task.assignee || "SHARED"}>
                  <option value="SHARED">Bersama</option>
                  <option value="CPP">Mempelai pria</option>
                  <option value="CPW">Mempelai wanita</option>
                </Select>
              </Field>
              <Field label="Tenggat" hint={hint}>
                <Input type="date" name="dueDate" value={due} onChange={(e) => setDue(e.target.value)} />
              </Field>
              <Field label="Catatan">
                <Textarea
                  name="notes"
                  defaultValue={task.notes ?? ""}
                  placeholder="Apa pun yang perlu diingat."
                  rows={4}
                />
              </Field>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="submit"
                  formAction={async () => {
                    await deleteTask(task.id);
                    setOpen(false);
                  }}
                  className="inline-flex items-center gap-1 text-sm text-destructive"
                >
                  Hapus
                </button>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">Simpan perubahan</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
