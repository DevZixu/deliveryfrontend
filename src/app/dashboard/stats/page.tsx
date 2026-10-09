"use client";

import { Bike, DollarSign, Package, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { DeliveryListItem } from "@/components/deliveries/DeliveryListItem";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader, StatCard } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { statsApi } from "@/lib/api";
import { currency } from "@/lib/format";
import type { PlatformStats } from "@/lib/types";

function Distribution({ data, empty }: { data: Record<string, number>; empty: string }) {
  const entries = Object.entries(data).filter(([, value]) => value > 0);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  if (total === 0) return <p className="py-6 text-center text-xs text-slate-500">{empty}</p>;
  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => {
        const pct = Math.round((value / total) * 100);
        return (
          <div key={key}>
            <div className="flex items-center justify-between text-xs">
              <span className="capitalize text-slate-400">{key.replace(/_/g, " ").toLowerCase()}</span>
              <span className="font-medium text-slate-200">
                {value} <span className="text-slate-500">({pct}%)</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setStats(await statsApi.platform());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !stats) return <PageLoader />;

  const roles = Object.values(stats.usersByRole).reduce((sum, n) => sum + (n ?? 0), 0);
  const deliveries = Object.values(stats.deliveriesByStatus).reduce((sum, n) => sum + (n ?? 0), 0);

  return (
    <div className="animate-fade-in-up">
      <PageHeader title="Analytics" description="Platform performance at a glance." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total users" value={roles} icon={<Users className="size-5" />} tone="brand" />
        <StatCard label="Total deliveries" value={deliveries} icon={<Package className="size-5" />} tone="sky" />
        <StatCard
          label="Active riders"
          value={stats.usersByRole.RIDER ?? 0}
          icon={<Bike className="size-5" />}
          tone="violet"
        />
        <StatCard
          label="Revenue"
          value={currency(stats.revenue.total)}
          icon={<DollarSign className="size-5" />}
          tone="emerald"
          hint={`${stats.revenue.successfulPayments} successful payments`}
        />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader title="Users by role" />
          <div className="p-5">
            <Distribution data={stats.usersByRole as Record<string, number>} empty="No users yet" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Deliveries by status" />
          <div className="p-5">
            <Distribution data={stats.deliveriesByStatus as Record<string, number>} empty="No deliveries yet" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Payments by status" />
          <div className="p-5">
            <Distribution data={stats.paymentsByStatus as Record<string, number>} empty="No payments yet" />
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent deliveries" />
        <div>
          {stats.recentDeliveries.map((delivery) => (
            <DeliveryListItem key={delivery.id} delivery={delivery} />
          ))}
        </div>
      </Card>
    </div>
  );
}
