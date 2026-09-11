import { createTask } from "@/app/actions/data";
import { ChecklistBoard } from "@/components/checklist-board";
import { EmptyState, PageHeader } from "@/components/chrome";
import { Field, Input, Select, Submit, Textarea } from "@/components/forms";
import { Modal } from "@/components/modal";
import { TASK_CATEGORIES, TASK_CATEGORY_LABELS } from "@/lib/labels";
import { requireWedding } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function ChecklistPage() {
  const { wedding } = await requireWedding();
  const tasks = await prisma.task.findMany({
    where: { weddingId: wedding.id },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
  });
  const done = tasks.filter((t) => t.completed).length;

  return (
    <div>
      <PageHeader
        kicker="Checklist"
        title="Semua yang perlu diurus sebelum hari-H"
        description={`${done} dari ${tasks.length} selesai. Cari, filter, lalu ketuk tugas untuk mengubahnya.`}
        action={
          <Modal triggerLabel="Tambah tugas" title="Tugas baru">
            <form action={createTask} className="grid gap-4">
              <Field label="Judul">
                <Input name="title" required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Kategori">
                  <Select name="category" defaultValue="OTHER">
                    {TASK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {TASK_CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Urgensi">
                  <Select name="priority" defaultValue="MEDIUM">
                    <option value="HIGH">Tinggi</option>
                    <option value="MEDIUM">Sedang</option>
                    <option value="LOW">Rendah</option>
                  </Select>
                </Field>
              </div>
              <Field label="Tenggat" hint="Kosongkan kalau nggak ada tenggatnya.">
                <Input type="date" name="dueDate" />
              </Field>
              <Field label="Catatan">
                <Textarea name="notes" placeholder="Apa pun yang perlu diingat." />
              </Field>
              <Submit>Tambah</Submit>
            </form>
          </Modal>
        }
      />
      {tasks.length === 0 ? (
        <EmptyState title="Checklist masih kosong" description="Tambah tugas sendiri, atau daftar ulang dengan opsi susunkan checklist di onboarding." />
      ) : (
        <ChecklistBoard
          tasks={tasks.map((task) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            category: task.category,
            dueDate: task.dueDate?.toISOString() ?? null,
            priority: task.priority,
            notes: task.notes,
            completed: task.completed,
          }))}
        />
      )}
    </div>
  );
}
