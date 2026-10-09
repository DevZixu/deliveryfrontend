import { Truck } from "lucide-react";
import { cn } from "@/lib/cn";

export function Brand({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-950/50">
        <Truck className="size-5 text-white" />
      </span>
      {showText ? (
        <span className="text-lg font-semibold tracking-tight text-white">
          Swift<span className="text-brand-400">ly</span>
        </span>
      ) : null}
    </div>
  );
}
