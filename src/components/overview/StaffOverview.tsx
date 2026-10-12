"use client";

import { Package, PackagePlus, Truck, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DeliveryListItem } from "@/components/deliveries/DeliveryListItem";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader, StatCard } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/Avatar";
import { PageLoader } from "@/components/ui/Spinner";
import { deliveriesApi } from "@/lib/api";
import type { Delivery, Paged } from "@/lib/types";

export function StaffOverview() {
  const [recent, setRecent] = useState<Delivery[]>([]);
  const [meta, setMeta] = useState<Paged<Delivery>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const result = await deliveriesApi.list({ limit: 8 });
        setRecent(result.data);
        setMeta(result.meta);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <PageLoader />;

  const active = recent.filter((d) =>
    ["CONFIRMED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(d.status),
  ).length;

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Staff overview"
        description="Manage and create deliveries on behalf of customers."
        actions={
          <Link href="/dashboard/deliveries/new">
            <Button icon={<PackagePlus className="size-4" />}>New delivery</Button>
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Active deliveries"
          value={active}
          icon={<Truck className="size-5" />}
          tone="sky"
          hint="in progress"
        />
        <StatCard
          label="Total (recent)"
          value={meta?.total ?? recent.length}
          icon={<Package className="size-5" />}
          tone="brand"
          hint="all deliveries"
        />
        <StatCard
          label="Manage users"
          value="Admin"
          icon={<Users className="size-5" />}
          tone="amber"
          hint="contact admin"
        />
      </div>

      <Card>
        <CardHeader title="Recent deliveries" />
        <div className="divide-y divide-white/5">
          {recent.length === 0 ? (
            <EmptyState
              icon={<Package className="size-8" />}
              title="No deliveries yet"
              description="Create the first one using the button above."
            />
          ) : (
            recent.map((delivery) => <DeliveryListItem key={delivery.id} delivery={delivery} />)
          )}
        </div>
        {(meta?.total ?? 0) > 8 && (
          <div className="border-t border-white/5 p-4 text-center">
            <Link
              href="/dashboard/deliveries"
              className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
            >
              View all deliveries →
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
