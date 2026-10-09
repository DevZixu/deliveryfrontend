import type { ReactNode } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="grid-glow flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="mb-6 flex justify-center">
          <Link href="/">
            <Brand />
          </Link>
        </div>
        <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-5 text-center text-sm text-slate-400">{footer}</p>
      </div>
    </main>
  );
}
