"use client";

import { useState } from "react";
import type { PotStatement } from "@/lib/budget";
import { formatRupiah, formatRupiahCompact, formatShortDate } from "@/lib/utils";

export function PotDisclosure({
  title,
  balance,
  trailing,
  children,
}: {
  title: string;
  balance: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li className="surface p-4">
      <div className="flex items-center gap-3">
        <button type="button" className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left" onClick={() => setOpen((value) => !value)}>
          <span>
            <span className="block text-xs text-muted-foreground">{title}</span>
            <span className="display mt-1 block text-2xl">{balance}</span>
          </span>
          <span className="text-sm text-primary">{open ? "Tutup" : "Rincian"}</span>
        </button>
        {trailing}
      </div>
      {open ? <div className="mt-3 border-t border-border pt-3">{children}</div> : null}
    </li>
  );
}

export function PotBalances({ pots, initialPot = null }: { pots: PotStatement[]; initialPot?: string | null }) {
  const [open, setOpen] = useState<string | null>(initialPot);
  const current = pots.find((pot) => pot.pot === open) ?? null;
  const outgoing = current?.moves.filter((move) => move.direction === "out") ?? [];
  const incoming = current?.moves.filter((move) => move.direction === "in") ?? [];

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {pots.map((pot) => (
          <button
            key={pot.pot}
            type="button"
            onClick={() => setOpen(pot.pot)}
            className="surface px-3 py-3 text-left"
          >
            <p className="text-xs text-muted-foreground">{pot.title}</p>
            <p className="mt-1 text-sm font-medium">{formatRupiahCompact(pot.balance)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Awal {formatRupiahCompact(pot.deposited)}</p>
            <p className="text-[11px] text-muted-foreground">Terpakai {formatRupiahCompact(pot.spent)}</p>
            <p className="mt-1 text-[11px] text-primary">Rincian</p>
          </button>
        ))}
      </div>
      {current ? (
        <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center">
          <button className="absolute inset-0 bg-foreground/30" aria-label="Tutup" onClick={() => setOpen(null)} />
          <div className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-card p-5 shadow-xl sm:max-w-lg sm:rounded-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="display text-2xl">Rekening {current.title}</h2>
                <p className="text-sm text-muted-foreground">{current.hint}</p>
              </div>
              <button className="text-sm text-muted-foreground" onClick={() => setOpen(null)}>
                Tutup
              </button>
            </div>
            <p className="display text-3xl">{formatRupiah(current.balance)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Saldo awal {formatRupiah(current.deposited)} · terpakai {formatRupiah(current.spent)}
            </p>
            <section className="mt-5">
              <h3 className="text-sm font-medium">Berkurang ke</h3>
              {outgoing.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Belum ada uang keluar dari rekening ini.</p>
              ) : (
                <ul className="mt-2 grid gap-2">
                  {outgoing.map((move) => (
                    <li key={move.id} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p>{move.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {move.when ? `${formatShortDate(move.when)} · ` : ""}
                          {move.detail}
                        </p>
                      </div>
                      <p className="shrink-0">−{formatRupiah(move.amount)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="mt-5">
              <h3 className="text-sm font-medium">Setoran</h3>
              {incoming.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Belum ada setoran. Catat saldo awal di tab Tabungan.</p>
              ) : (
                <ul className="mt-2 grid gap-2">
                  {incoming.map((move) => (
                    <li key={move.id} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p>{move.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {move.when ? `${formatShortDate(move.when)} · ` : ""}
                          {move.detail}
                        </p>
                      </div>
                      <p className="shrink-0">+{formatRupiah(move.amount)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <p className="mt-5 text-xs text-muted-foreground">
              Saldo berkurang dari pembayaran yang sudah dicatat lunas. Rencana di tab Anggaran belum mengurangi saldo.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
