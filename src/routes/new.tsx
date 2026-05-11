import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KraForm } from "@/components/KraForm";
import { useKraStore } from "@/store/kraStore";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/new")({
  component: NewKraPage,
  head: () => ({ meta: [{ title: "Create KRA — Adani KRA Management" }] }),
});

function NewKraPage() {
  const navigate = useNavigate();
  const { createKra } = useKraStore();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button onClick={() => navigate({ to: "/kras" })} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to KRAs
      </button>
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Create New KRA</h1>
        <p className="text-muted-foreground">Define a new Key Result Area and cascade it across the senior team.</p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <KraForm
          submitLabel="Create KRA"
          onSubmit={(v) => {
            createKra(v);
            navigate({ to: "/kras" });
          }}
          onCancel={() => navigate({ to: "/kras" })}
        />
      </div>
    </div>
  );
}