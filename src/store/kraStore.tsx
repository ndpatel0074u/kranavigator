import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { kras as seedKras, type KRA } from "@/data/kra";

export type ActualEntry = {
  id: string;
  date: string; // ISO
  period: string; // e.g. "Q1 FY26", "Apr 2026"
  actual: number;
  progress: number;
  note?: string;
  by: string;
};

export type AuditEntry = {
  id: string;
  date: string;
  by: string;
  action: string;
  detail?: string;
};

export type KRAExtended = KRA & {
  actuals: ActualEntry[];
  audit: AuditEntry[];
};

type Ctx = {
  kras: KRAExtended[];
  getKra: (id: string) => KRAExtended | undefined;
  createKra: (k: Omit<KRA, "id" | "progress"> & { progress?: number }) => string;
  updateKra: (id: string, patch: Partial<KRA>, by?: string) => void;
  addActual: (id: string, entry: Omit<ActualEntry, "id" | "date">) => void;
  setStatus: (id: string, status: KRA["status"], by?: string) => void;
};

const KraCtx = createContext<Ctx | null>(null);

function seedActuals(k: KRA): ActualEntry[] {
  // synthesize a few prior data points for trend visualization
  const base = typeof k.target === "number" ? k.target : 100;
  const periods = ["Q1", "Q2", "Q3", "Q4 (current)"];
  const factors = [0.18, 0.42, 0.7, k.progress / 100];
  return periods.map((p, i) => ({
    id: `${k.id}-seed-${i}`,
    date: new Date(2025, 3 + i * 3, 15).toISOString(),
    period: p,
    actual: Math.round(base * factors[i] * 10) / 10,
    progress: Math.round(factors[i] * 100),
    note: i === periods.length - 1 ? "Latest reported value" : "",
    by: k.owner,
  }));
}

export function KraProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<KRAExtended[]>(() =>
    seedKras.map((k) => ({
      ...k,
      actuals: seedActuals(k),
      audit: [
        {
          id: `${k.id}-a0`,
          date: new Date(2025, 3, 1).toISOString(),
          by: "CEO",
          action: "Created",
          detail: `KRA created with weight ${k.weight}%`,
        },
      ],
    }))
  );

  const value = useMemo<Ctx>(
    () => ({
      kras: items,
      getKra: (id) => items.find((k) => k.id === id),
      createKra: (k) => {
        const id = `kra-${Date.now()}`;
        setItems((prev) => [
          {
            ...(k as KRA),
            id,
            progress: k.progress ?? 0,
            actuals: [],
            audit: [
              {
                id: `${id}-a0`,
                date: new Date().toISOString(),
                by: "CEO",
                action: "Created",
                detail: `KRA created with weight ${k.weight}%`,
              },
            ],
          },
          ...prev,
        ]);
        return id;
      },
      updateKra: (id, patch, by = "CEO") => {
        setItems((prev) =>
          prev.map((k) => {
            if (k.id !== id) return k;
            const changes = Object.entries(patch)
              .filter(([key, val]) => (k as any)[key] !== val)
              .map(([key, val]) => `${key}: ${(k as any)[key]} → ${val}`)
              .join("; ");
            return {
              ...k,
              ...patch,
              audit: changes
                ? [
                    {
                      id: `${id}-a${Date.now()}`,
                      date: new Date().toISOString(),
                      by,
                      action: "Edited",
                      detail: changes,
                    },
                    ...k.audit,
                  ]
                : k.audit,
            };
          })
        );
      },
      addActual: (id, entry) => {
        setItems((prev) =>
          prev.map((k) => {
            if (k.id !== id) return k;
            const a: ActualEntry = {
              ...entry,
              id: `${id}-act-${Date.now()}`,
              date: new Date().toISOString(),
            };
            return {
              ...k,
              progress: entry.progress,
              actuals: [...k.actuals, a],
              audit: [
                {
                  id: `${id}-au-${Date.now()}`,
                  date: new Date().toISOString(),
                  by: entry.by,
                  action: "Actual updated",
                  detail: `${entry.period}: ${entry.actual} (${entry.progress}%)`,
                },
                ...k.audit,
              ],
            };
          })
        );
      },
      setStatus: (id, status, by = "CEO") => {
        setItems((prev) =>
          prev.map((k) =>
            k.id !== id
              ? k
              : {
                  ...k,
                  status,
                  audit: [
                    {
                      id: `${id}-st-${Date.now()}`,
                      date: new Date().toISOString(),
                      by,
                      action: "Status changed",
                      detail: `${k.status} → ${status}`,
                    },
                    ...k.audit,
                  ],
                }
          )
        );
      },
    }),
    [items]
  );

  return <KraCtx.Provider value={value}>{children}</KraCtx.Provider>;
}

export function useKraStore() {
  const ctx = useContext(KraCtx);
  if (!ctx) throw new Error("useKraStore must be used within KraProvider");
  return ctx;
}