import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  size = "md",
}: {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
}) {
  const height = size === "lg" ? "h-20 sm:h-24" : size === "sm" ? "h-9" : "h-12";
  const mark = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/buma-logo.png"
      alt="Buma Wedding Planner"
      className={cn("w-auto object-contain", height, className)}
    />
  );
  if (!href) return mark;
  return (
    <a href={href} className="inline-flex shrink-0 items-center" aria-label="Buma Wedding Planner">
      {mark}
    </a>
  );
}
