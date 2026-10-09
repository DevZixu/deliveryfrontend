"use client";

import { BarChart3, DollarSign, Package, Truck, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DeliveryListItem } from "@/components/deliveries/DeliveryListItem";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader, StatCard } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { statsApi } from "@/lib/api";
import { currency } from "@/lib/format";
import type { DeliveryStatus, PlatformStats } from "@/lib/types";

const STATUS_ORDER: DeliveryStatus[] = [
  "PENDING",
  "CONFIRMED",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
];

export function AdminOverview() {
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

  const users = Object.values(stats.usersByRole).reduce((sum, n) => sum + (n ?? 0), 0);
  const deliveries = Object.values(stats.deliveriesByStatus).reduce((sum, n) => sum + (n ?? 0), 0);
  const active =
    (stats.deliveriesByStatus.PENDING ?? 0) +
    (stats.deliveriesByStatus.CONFIRMED ?? 0) +
    (stats.deliveriesByStatus.ASSIGNED ?? 0) +
    (stats.deliveriesByStatus.PICKED_UP ?? 0) +
    (stats.deliveriesByStatus.IN_TRANSIT ?? 0);

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Operations"
        description="A live snapshot of the platform."
        actions={
          <Link href="/dashboard/stats" className="text-sm font-medium text-brand-400 hover:text-brand-300">
            Full analytics →
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Users" value={users} icon={<Users className="size-5" />} tone="brand" />
        <StatCard label="Deliveries" value={deliveries} icon={<Package className="size-5" />} tone="sky" />
        <StatCard label="In flight" value={active} icon={<Truck className="size-5" />} tone="amber" />
        <StatCard
          label="Revenue"
          value={currency(stats.revenue.total)}
          icon={<DollarSign className="size-5" />}
          tone="emerald"
          hint={`${stats.revenue.successfulPayments} payments`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader
            title="Recent deliveries"
            action={
              <Link href="/dashboard/deliveries" className="text-xs font-medium text-brand-400 hover:text-brand-300">
                View all
              </Link>
            }
          />
          <div>
            {stats.recentDeliveries.map((delivery) => (
              <DeliveryListItem key={delivery.id} delivery={delivery} />
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Deliveries by status" subtitle="Across all time" />
          <div className="space-y-3 px-5 py-4">
            {STATUS_ORDER.map((status) => {
              const count = stats.deliveriesByStatus[status] ?? 0;
              const pct = deliveries > 0 ? Math.round((count / deliveries) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize text-slate-400">{status.replace(/_/g, " ").toLowerCase()}</span>
                    <span className="font-medium text-slate-200">{count}</span>
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
            {deliveries === 0 ? (
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <BarChart3 className="size-3.5" /> No deliveries yet
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
