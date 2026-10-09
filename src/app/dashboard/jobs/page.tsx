"use client";

import { AlertTriangle, CheckCircle2, MapPin, Package, Radar, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { ApiError, deliveriesApi, ridersApi } from "@/lib/api";
import { currency, relativeTime } from "@/lib/format";
import type { Delivery, RiderProfile } from "@/lib/types";

export default function JobsPage() {
  const toast = useToast();
  const router = useRouter();
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [jobs, setJobs] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [me, list] = await Promise.all([
      ridersApi.me(),
      deliveriesApi.list({ view: "available", limit: 30 }),
    ]);
    setProfile(me.rider);
    setJobs(list.data);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const accept = async (delivery: Delivery) => {
    setAccepting(delivery.id);
    try {
      await deliveriesApi.accept(delivery.id);
      toast.success("Job claimed", `${delivery.trackingCode} is now yours`);
      router.push(`/dashboard/deliveries/${delivery.id}`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : undefined;
      toast.error("Could not claim job", message);
      await load();
    } finally {
      setAccepting(null);
    }
  };

  if (loading || !profile) return <PageLoader />;

  const canAccept = profile.isVerified && profile.availability === "AVAILABLE";

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Available jobs"
        description="Unclaimed, paid orders waiting for a rider."
        actions={
          <Link href="/dashboard/profile">
            <Button variant="outline" size="sm">
              Manage availability
            </Button>
          </Link>
        }
      />

      {!profile.isVerified ? (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>Your rider account is not verified yet — an admin must approve you before you can accept jobs.</p>
        </div>
      ) : profile.availability !== "AVAILABLE" ? (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>You’re currently {profile.availability.toLowerCase()}. Go online from your profile to accept jobs.</p>
        </div>
      ) : null}

      {jobs.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-800/70 text-slate-400">
              <Radar className="size-5" />
            </div>
            <p className="text-sm font-medium text-white">No jobs right now</p>
            <p className="text-xs text-slate-400">Check back soon — new confirmed orders appear here.</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map((job) => (
            <Card key={job.id} className="flex flex-col">
              <CardHeader
                title={<span className="font-mono text-xs text-slate-300">{job.trackingCode}</span>}
                action={<span className="text-lg font-semibold text-white">{currency(job.fee, job.currency)}</span>}
              />
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="size-3.5 text-emerald-400" />
                    <span className="truncate">
                      {job.pickup.city}
                      <span className="text-slate-600"> · </span>
                      <span className="text-slate-400">{job.pickup.address}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="size-3.5 text-brand-400" />
                    <span className="truncate">
                      {job.dropoff.city}
                      <span className="text-slate-600"> · </span>
                      <span className="text-slate-400">{job.dropoff.address}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Package className="size-3.5" /> {job.package.weightKg} kg
                  </span>
                  <span>{job.package.distanceKm} km</span>
                  <span className="text-slate-600">{relativeTime(job.createdAt)}</span>
                </div>
                <div className="mt-auto">
                  <Button
                    className="w-full"
                    loading={accepting === job.id}
                    disabled={!canAccept}
                    icon={<Truck className="size-4" />}
                    onClick={() => accept(job)}
                  >
                    Accept job
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {canAccept && jobs.length > 0 ? (
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <CheckCircle2 className="size-3.5 text-emerald-400" /> You’re online and verified — claim a job to begin.
        </p>
      ) : null}
    </div>
  );
}
