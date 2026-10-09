"use client";

import { Bike, ShoppingBag, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/auth";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { Role } from "@/lib/types";

type RegisterRole = Extract<Role, "CUSTOMER" | "RIDER">;

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [role, setRole] = useState<RegisterRole>("CUSTOMER");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    vehicleType: "",
    vehiclePlate: "",
    licenseNumber: "",
    city: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        role,
      };
      if (form.phone) payload.phone = form.phone;
      if (role === "RIDER") {
        payload.vehicleType = form.vehicleType;
        payload.vehiclePlate = form.vehiclePlate;
        payload.licenseNumber = form.licenseNumber;
        if (form.city) payload.city = form.city;
      }
      const user = await register(payload);
      toast.success(`Welcome, ${user.firstName}!`);
      if (role === "RIDER") {
        toast.info("Verification pending", "An admin must verify you before you can take jobs.");
      }
      router.replace("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong";
      const detail = err instanceof ApiError && err.details?.length ? err.details.join(" · ") : null;
      setError(detail ?? message);
      toast.error("Registration failed", detail ?? message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start sending parcels or earning as a rider."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-400 hover:text-brand-300">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "CUSTOMER", label: "I'm a customer", icon: ShoppingBag },
              { value: "RIDER", label: "I'm a rider", icon: Bike },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRole(option.value)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                role === option.value
                  ? "border-brand-500 bg-brand-500/10 text-white"
                  : "border-slate-700 text-slate-300 hover:border-slate-600",
              )}
            >
              <option.icon className="size-4" />
              {option.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <Input required value={form.firstName} onChange={update("firstName")} placeholder="Cara" />
          </Field>
          <Field label="Last name">
            <Input required value={form.lastName} onChange={update("lastName")} placeholder="Customer" />
          </Field>
        </div>

        <Field label="Email">
          <Input type="email" required value={form.email} onChange={update("email")} placeholder="you@example.com" />
        </Field>
        <Field label="Phone" hint="Optional">
          <Input value={form.phone} onChange={update("phone")} placeholder="+15550001000" />
        </Field>
        <Field label="Password" hint="At least 8 characters">
          <Input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={update("password")}
            placeholder="••••••••"
          />
        </Field>

        {role === "RIDER" ? (
          <div className="space-y-3 rounded-xl border border-white/5 bg-slate-950/40 p-3">
            <p className="text-xs font-medium text-slate-400">Vehicle details</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vehicle type">
                <Input required value={form.vehicleType} onChange={update("vehicleType")} placeholder="Motorbike" />
              </Field>
              <Field label="Plate number">
                <Input required value={form.vehiclePlate} onChange={update("vehiclePlate")} placeholder="RD-001" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Licence number">
                <Input
                  required
                  value={form.licenseNumber}
                  onChange={update("licenseNumber")}
                  placeholder="LIC-1234"
                />
              </Field>
              <Field label="City" hint="Optional">
                <Input value={form.city} onChange={update("city")} placeholder="Lagos" />
              </Field>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-inset ring-rose-500/30">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" loading={loading} icon={<UserPlus className="size-4" />}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
