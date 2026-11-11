"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CalendarHeart,
  ClipboardList,
  Gift,
  Heart,
  LayoutGrid,
  Mail,
  Settings,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { logoutAction } from "@/app/actions/auth";

type NavItem = { href: string; label: string; short?: string; icon: typeof Heart; tone: string };

const BASE_NAV: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: Heart, tone: "text-tone-plum" },
  { href: "/app/checklist", label: "Checklist", short: "Tugas", icon: ClipboardList, tone: "text-tone-indigo" },
  { href: "/app/calendar", label: "Kalender", icon: CalendarDays, tone: "text-tone-fern" },
  { href: "/app/budget", label: "Budget", icon: Wallet, tone: "text-tone-marigold" },
  { href: "/app/vendors", label: "Vendor", icon: Store, tone: "text-tone-teal" },
  { href: "/app/guests", label: "Tamu", icon: Users, tone: "text-tone-sage" },
  { href: "/app/undangan", label: "Undangan", icon: Mail, tone: "text-tone-lagoon" },
  { href: "/app/timeline", label: "Hari-H", icon: CalendarHeart, tone: "text-tone-clay" },
];

const MOBILE_TABS = [
  { href: "/app", label: "Beranda" },
  { href: "/app/checklist", label: "Tugas" },
  { href: "/app/budget", label: "Anggaran" },
];

function active(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

export function AppNav({
  userName,
  couple,
}: {
  userName: string;
  couple: {
    partnerAName: string;
    partnerBName: string;
    dateLabel: string;
    location: string;
    showSeserahan: boolean;
  };
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = couple.showSeserahan
    ? [
        ...BASE_NAV.slice(0, 4),
        { href: "/app/seserahan", label: "Seserahan", icon: Gift, tone: "text-tone-orchid" } satisfies NavItem,
        ...BASE_NAV.slice(4),
      ]
    : BASE_NAV;

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 overflow-y-auto border-r border-border bg-card/80 px-4 py-6 backdrop-blur md:flex md:flex-col">
        <Logo href="/app" size="md" />
        <div className="mt-5 rounded-xl bg-muted/70 px-3 py-3">
          <p className="text-sm font-medium capitalize">
            {couple.partnerAName} & {couple.partnerBName}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {couple.dateLabel} · {couple.location}
          </p>
        </div>
        <nav className="mt-6 grid gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                active(pathname, item.href) ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <item.icon className={cn("size-4", item.tone)} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto grid gap-2 pt-6">
          <Link href="/app/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
            <Settings className="size-4 text-tone-plum" />
            Pengaturan
          </Link>
          <p className="px-3 text-xs text-muted-foreground">Masuk sebagai {userName}</p>
          <form action={logoutAction}>
            <button className="px-3 text-sm text-muted-foreground hover:text-foreground">Keluar</button>
          </form>
        </div>
      </aside>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        <p className="display text-lg">
          {pathname === "/app" ? "Beranda" : pathname.startsWith("/app/checklist") ? "Tugas" : pathname.startsWith("/app/budget") ? "Anggaran" : "Buma"}
        </p>
        <Link href="/app/settings" aria-label="Pengaturan" className="text-muted-foreground">
          <Settings className="size-5" />
        </Link>
      </header>
      {menuOpen ? (
        <div className="fixed inset-0 z-30 md:hidden">
          <button className="absolute inset-0 bg-foreground/40" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-x-0 bottom-16 rounded-t-2xl bg-card px-4 pt-4 pb-4">
            <p className="text-sm font-medium">
              {couple.partnerAName} & {couple.partnerBName}
            </p>
            <p className="text-xs text-muted-foreground">{couple.dateLabel} · {couple.location}</p>
            <div className="mt-4 grid gap-1">
              {nav
                .filter((item) => !MOBILE_TABS.some((tab) => tab.href === item.href))
                .map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-3 text-sm">
                    <item.icon className={cn("size-4", item.tone)} />
                    {item.label}
                  </Link>
                ))}
              <Link href="/app/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-3 text-sm">
                <Settings className="size-4" />
                Pengaturan
              </Link>
              <form action={logoutAction}>
                <button className="px-2 py-3 text-sm text-muted-foreground">Keluar</button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {MOBILE_TABS.map((tab) => {
          const item = nav.find((entry) => entry.href === tab.href);
          if (!item) return null;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[0.65rem]",
                active(pathname, tab.href) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              {tab.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className={cn("flex flex-col items-center gap-1 py-2 text-[0.65rem]", menuOpen ? "text-primary" : "text-muted-foreground")}
        >
          <LayoutGrid className="size-5" />
          Menu
        </button>
      </nav>
    </>
  );
}
