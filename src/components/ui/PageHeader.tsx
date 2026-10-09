import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  tone?: "brand" | "emerald" | "amber" | "sky" | "violet" | "rose";
}) {
  const tones: Record<string, string> = {
    brand: "from-brand-500/20 text-brand-300",
    emerald: "from-emerald-500/20 text-emerald-300",
    amber: "from-amber-500/20 text-amber-300",
    sky: "from-sky-500/20 text-sky-300",
    violet: "from-violet-500/20 text-violet-300",
    rose: "from-rose-500/20 text-rose-300",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/30">
      <div className={cn("absolute -right-6 -top-8 size-24 rounded-full bg-gradient-to-br to-transparent blur-2xl", tones[tone])} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
        </div>
        {icon ? <div className={cn("rounded-xl bg-slate-950/50 p-2", tones[tone].split(" ")[1])}>{icon}</div> : null}
      </div>
    </div>
  );
}
