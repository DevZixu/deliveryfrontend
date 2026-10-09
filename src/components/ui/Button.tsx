import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "success" | "danger" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-950/40 ring-1 ring-inset ring-white/10",
  secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 ring-1 ring-inset ring-white/10",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-inset ring-white/10",
  danger: "bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-950/40 ring-1 ring-inset ring-white/10",
  ghost: "bg-transparent text-slate-300 hover:bg-slate-800/70 hover:text-white",
  outline: "bg-transparent text-slate-200 ring-1 ring-inset ring-slate-700 hover:bg-slate-800/60",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
    </button>
  );
}
