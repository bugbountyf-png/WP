import { Button, Field, Input, Select, Textarea, rowActionClass } from "@/components/ui";
import { cn } from "@/lib/utils";

export function RowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex h-8 shrink-0 items-center gap-4">{children}</div>;
}

export function DeleteForm({ action, label = "Hapus" }: { action: () => Promise<void>; label?: string }) {
  return (
    <form action={action} className="contents">
      <button type="submit" className={cn(rowActionClass, "text-muted-foreground hover:text-destructive")}>
        {label}
      </button>
    </form>
  );
}

export function Submit({ children = "Simpan" }: { children?: string }) {
  return (
    <Button type="submit" className="w-full">
      {children}
    </Button>
  );
}

export { Field, Input, Select, Textarea };
