"use client";

import { AlertTriangle, CheckCircle2, DollarSign, Radar, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DeliveryListItem } from "@/components/deliveries/DeliveryListItem";
import { AvailabilityToggle } from "@/components/rider/AvailabilityToggle";
import { EmptyState } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader, StatCard } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { deliveriesApi, ridersApi, statsApi } from "@/lib/api";
import { currency } from "@/lib/format";
import type { Delivery, RiderProfile, RiderStats } from "@/lib/types";

export function RiderOverview() {
  const [stats, setStats] = useState<RiderStats | null>(null);
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [active, setActive] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [statsResult, meResult, listResult] = await Promise.all([
          statsApi.rider(),
          ridersApi.me(),
          deliveriesApi.list({ limit: 5 }),
        ]);
        setStats(statsResult);
        setProfile(meResult.rider);
        setActive(listResult.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !stats || !profile) return <PageLoader />;

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Rider dashboard"
        description="Your workload, availability and earnings."
        actions={
          <Link href="/dashboard/jobs">
            <Button icon={<Radar className="size-4" />}>Find jobs</Button>
          </Link>
        }
      />

      {!profile.isVerified ? (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Verification pending</p>
            <p className="text-amber-200/80">
              An administrator needs to verify your rider profile before you can go online and take jobs.
            </p>
          </div>
        </div>
      ) : null}

      <Card className="mb-4">
        <div className="px-5 py-4">
          <AvailabilityToggle profile={profile} onChange={setProfile} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Completed runs" value={stats.completedRuns} icon={<CheckCircle2 className="size-5" />} tone="emerald" />
        <StatCard label="Active jobs" value={stats.activeDeliveries} icon={<Truck className="size-5" />} tone="sky" />
        <StatCard label="Delivered" value={stats.deliveredDeliveries} icon={<CheckCircle2 className="size-5" />} tone="brand" />
        <StatCard
          label="Earnings"
          value={currency(stats.earnings.total)}
          icon={<DollarSign className="size-5" />}
          tone="violet"
          hint={`${stats.earnings.paidDeliveries} paid`}
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Recent deliveries"
          action={
            <Link href="/dashboard/deliveries" className="text-xs font-medium text-brand-400 hover:text-brand-300">
              View all
            </Link>
          }
        />
        {active.length === 0 ? (
          <EmptyState
            icon={<Truck className="size-5" />}
            title="No deliveries yet"
            description="Head to the jobs board to claim your next delivery."
            action={
              <Link href="/dashboard/jobs">
                <Button size="sm">Browse jobs</Button>
              </Link>
            }
          />
        ) : (
          <div>
            {active.map((delivery) => (
              <DeliveryListItem key={delivery.id} delivery={delivery} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
