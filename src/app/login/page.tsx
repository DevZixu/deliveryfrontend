"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/auth";
import { ApiError } from "@/lib/api";

const DEMO_ACCOUNTS = [
  { label: "Customer", email: "customer@demo.test", password: "Customer1234!" },
  { label: "Rider", email: "rider@demo.test", password: "Rider1234!" },
  { label: "Admin", email: "admin@platform.test", password: "Admin1234!" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.firstName}`);
      router.replace("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong";
      setError(message);
      toast.error("Sign in failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your deliveries."
      footer={
        <>
          New to Swiftly?{" "}
          <Link href="/register" className="font-medium text-brand-400 hover:text-brand-300">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        {error ? (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-inset ring-rose-500/30">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" loading={loading} icon={<LogIn className="size-4" />}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 border-t border-white/5 pt-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Demo accounts
        </p>
        <div className="flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword(account.password);
              }}
              className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300 transition hover:border-brand-500/40 hover:text-white"
            >
              {account.label}
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
