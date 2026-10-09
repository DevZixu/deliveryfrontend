"use client";

import { ArrowRight, Bike, Building2, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/auth";

const FEATURES = [
  {
    icon: PackageCheck,
    title: "Order in seconds",
    body: "Get an instant, server-calculated price and place a delivery request with live tracking.",
  },
  {
    icon: Bike,
    title: "Riders get moving",
    body: "Verified riders claim nearby jobs and progress them from pickup to delivery.",
  },
  {
    icon: ShieldCheck,
    title: "Admins stay in control",
    body: "Verify riders, dispatch orders, suspend accounts, monitor revenue and issue refunds.",
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  return (
    <main className="grid-glow relative min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
        <header className="flex items-center justify-between py-6">
          <Brand />
          <nav className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" icon={<Sparkles className="size-3.5" />}>
                Get started
              </Button>
            </Link>
          </nav>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            <Sparkles className="size-3.5 text-brand-400" />
            Customers · Riders · Admins
          </span>
          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Deliveries, end to end —{" "}
            <span className="bg-gradient-to-r from-brand-400 to-emerald-400 bg-clip-text text-transparent">
              priced, dispatched, tracked.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-base text-slate-400">
            Swiftly is a complete delivery operations platform. Place and pay for orders, claim
            jobs as a rider, and run the whole thing from an admin console.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" icon={<ArrowRight className="size-4" />}>
                Create an account
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign in
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="animate-fade-in-up rounded-2xl border border-white/5 bg-slate-900/50 p-5 text-left backdrop-blur transition hover:border-brand-500/30 hover:bg-slate-900/80"
              >
                <feature.icon className="size-5 text-brand-400" />
                <h3 className="mt-3 text-sm font-semibold text-white">{feature.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-2 py-6 text-xs text-slate-500 sm:flex-row">
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="size-3.5" /> Swiftly Delivery Platform
          </span>
          <span>Backend at {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}</span>
        </footer>
      </div>
    </main>
  );
}
