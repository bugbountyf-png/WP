import { Button, Field, Input } from "@/components/ui";
import { Logo } from "@/components/logo";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden px-6 pb-16 pt-10 sm:justify-center sm:py-16">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-32 h-96 bg-[radial-gradient(60%_100%_at_50%_0%,var(--color-tone-teal-soft),transparent_70%)]" />
      <div className="relative mx-auto w-full max-w-96">
        <Logo className="mb-12" />
        <h1 className="display text-3xl leading-tight text-foreground">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-9 grid gap-5">{children}</div>
        <p className="mt-8 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  );
}

export { Button, Field, Input };
