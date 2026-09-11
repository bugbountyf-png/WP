import { cn } from "@/lib/utils";

export function PageHeader({
  kicker,
  title,
  description,
  action,
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="gutter flex flex-col gap-4 pt-10 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker ? <p className="text-xs font-medium tracking-wide text-primary uppercase">{kicker}</p> : null}
        <h1 className="display mt-1 text-3xl text-foreground">{title}</h1>
        {description ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="surface mx-4 px-6 py-12 text-center sm:mx-6">
      <h2 className="display text-2xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <div className="surface p-4">
      <p className={cn("text-xs font-medium", tone ?? "text-muted-foreground")}>{label}</p>
      <p className="display mt-2 text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: string }) {
  const map: Record<string, string> = {
    muted: "bg-muted text-muted-foreground",
    plum: "bg-tone-plum-soft text-tone-plum",
    success: "bg-tone-fern-soft text-tone-fern",
    warning: "bg-tone-marigold-soft text-tone-marigold",
    danger: "bg-destructive-soft text-destructive",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium", map[tone] ?? map.muted)}>
      {children}
    </span>
  );
}
