"use client";

import { CheckCircle2, DollarSign, Package, PackagePlus, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DeliveryListItem } from "@/components/deliveries/DeliveryListItem";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader, StatCard } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/Avatar";
import { PageLoader } from "@/components/ui/Spinner";
import { deliveriesApi, statsApi } from "@/lib/api";
import { currency } from "@/lib/format";
import type { CustomerStats, Delivery } from "@/lib/types";

export function CustomerOverview() {
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [recent, setRecent] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [statsResult, listResult] = await Promise.all([
          statsApi.customer(),
          deliveriesApi.list({ limit: 6 }),
        ]);
        setStats(statsResult);
        setRecent(listResult.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !stats) return <PageLoader />;

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Overview"
        description="Your deliveries at a glance."
        actions={
          <Link href="/dashboard/deliveries/new">
            <Button icon={<PackagePlus className="size-4" />}>New delivery</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active"
          value={stats.activeDeliveries}
          icon={<Truck className="size-5" />}
          tone="sky"
          hint="in progress"
        />
        <StatCard
          label="Delivered"
          value={stats.deliveriesByStatus.DELIVERED ?? 0}
          icon={<CheckCircle2 className="size-5" />}
          tone="emerald"
        />
        <StatCard label="Total orders" value={stats.totalDeliveries} icon={<Package className="size-5" />} tone="brand" />
        <StatCard
          label="Spent"
          value={currency(stats.spend.total)}
          icon={<DollarSign className="size-5" />}
          tone="violet"
          hint={`${stats.spend.paidDeliveries} paid`}
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
        {recent.length === 0 ? (
          <EmptyState
            icon={<Package className="size-5" />}
            title="No deliveries yet"
            description="Create your first delivery request to get started."
            action={
              <Link href="/dashboard/deliveries/new">
                <Button size="sm">New delivery</Button>
              </Link>
            }
          />
        ) : (
          <div>
            {recent.map((delivery) => (
              <DeliveryListItem key={delivery.id} delivery={delivery} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
