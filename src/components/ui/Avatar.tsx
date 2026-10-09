import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

export function Avatar({
  firstName,
  lastName,
  className,
}: {
  firstName: string;
  lastName: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-xs font-semibold text-white",
        className,
      )}
    >
      {initials(firstName, lastName)}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-800/70 text-slate-400">
          {icon}
        </div>
      ) : null}
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        {description ? <p className="mt-1 text-xs text-slate-400">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
