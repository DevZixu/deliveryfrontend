"use client";

import { ArrowUpRight, Package, PackagePlus, Radar, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, Input, Select } from "@/components/ui/Card";
import { DeliveryStatusBadge } from "@/components/ui/StatusBadges";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, Td, Th, Pagination } from "@/components/ui/Table";
import { useAuth } from "@/context/auth";
import { deliveriesApi } from "@/lib/api";
import { currency, DELIVERY_STATUS_META, relativeTime } from "@/lib/format";
import type { Delivery, DeliveryStatus, Paged } from "@/lib/types";
import { useDebounced } from "@/lib/useDebounced";
import { PageLoader } from "@/components/ui/Spinner";

const STATUS_OPTIONS = Object.keys(DELIVERY_STATUS_META) as DeliveryStatus[];

export default function DeliveriesPage() {
  const { user } = useAuth();
  const role = user?.role ?? "CUSTOMER";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<Paged<Delivery> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void (async () => {
      try {
        const data = await deliveriesApi.list({
          page,
          limit: 10,
          status: status || undefined,
          search: debouncedSearch || undefined,
        });
        if (active) setResult(data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [page, status, debouncedSearch]);

  const title = role === "ADMIN" ? "Deliveries" : role === "RIDER" ? "My deliveries" : "My deliveries";
  const showPeople = role === "ADMIN";

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title={title}
        description="Track every order through its lifecycle."
        actions={
          role === "CUSTOMER" ? (
            <Link href="/dashboard/deliveries/new">
              <Button icon={<PackagePlus className="size-4" />}>New delivery</Button>
            </Link>
          ) : role === "RIDER" ? (
            <Link href="/dashboard/jobs">
              <Button icon={<Radar className="size-4" />}>Find jobs</Button>
            </Link>
          ) : undefined
        }
      />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tracking code, recipient or pickup…"
              className="pl-9"
            />
          </div>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="sm:w-52">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {DELIVERY_STATUS_META[option].label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card>
        {loading && !result ? (
          <PageLoader />
        ) : result && result.data.length > 0 ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Tracking</Th>
                  <Th>Route</Th>
                  {showPeople ? <Th>Customer</Th> : null}
                  {showPeople ? <Th>Rider</Th> : null}
                  <Th>Status</Th>
                  <Th className="text-right">Fee</Th>
                  <Th className="text-right">Created</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {result.data.map((delivery) => (
                  <tr key={delivery.id} className="transition hover:bg-slate-800/40">
                    <Td className="font-mono text-xs text-slate-400">{delivery.trackingCode}</Td>
                    <Td>
                      <span className="text-slate-200">{delivery.pickup.city}</span>
                      <span className="text-slate-500"> → </span>
                      <span className="text-slate-200">{delivery.dropoff.city}</span>
                    </Td>
                    {showPeople ? (
                      <Td>{delivery.customer?.fullName ?? "—"}</Td>
                    ) : null}
                    {showPeople ? (
                      <Td>{delivery.rider?.fullName ?? <span className="text-slate-500">Unassigned</span>}</Td>
                    ) : null}
                    <Td>
                      <DeliveryStatusBadge status={delivery.status} />
                    </Td>
                    <Td className="text-right font-medium text-white">
                      {currency(delivery.fee, delivery.currency)}
                    </Td>
                    <Td className="text-right text-xs text-slate-400">{relativeTime(delivery.createdAt)}</Td>
                    <Td className="text-right">
                      <Link
                        href={`/dashboard/deliveries/${delivery.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300"
                      >
                        View <ArrowUpRight className="size-3.5" />
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination
              page={result.meta.page}
              totalPages={result.meta.totalPages}
              total={result.meta.total}
              onPage={setPage}
            />
          </>
        ) : (
          <EmptyState
            icon={<Package className="size-5" />}
            title="No deliveries found"
            description={
              search || status
                ? "Try adjusting your filters."
                : role === "CUSTOMER"
                  ? "Create your first delivery request."
                  : "Nothing here yet."
            }
            action={
              role === "CUSTOMER" && !search && !status ? (
                <Link href="/dashboard/deliveries/new">
                  <Button size="sm">New delivery</Button>
                </Link>
              ) : undefined
            }
          />
        )}
      </Card>
    </div>
  );
}
