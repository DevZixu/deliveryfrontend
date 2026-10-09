"use client";

import { BadgeCheck, Bike, Search, ShieldX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Avatar, EmptyState } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, Input, Select } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination, Table, Td, Th } from "@/components/ui/Table";
import { AccountStatusBadge, AvailabilityBadge } from "@/components/ui/StatusBadges";
import { PageLoader } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { ApiError, ridersApi } from "@/lib/api";
import type { Paged, User } from "@/lib/types";
import { useDebounced } from "@/lib/useDebounced";

export default function RidersAdminPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [verified, setVerified] = useState("");
  const [availability, setAvailability] = useState("");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<Paged<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ridersApi.list({
        page,
        limit: 10,
        verified: verified || undefined,
        availability: availability || undefined,
        search: debouncedSearch || undefined,
      });
      setResult(data);
    } finally {
      setLoading(false);
    }
  }, [page, verified, availability, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, verified, availability]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (id: string, action: () => Promise<unknown>, message: string) => {
    setBusyId(id);
    try {
      await action();
      toast.success(message);
      await load();
    } catch (error) {
      toast.error("Action failed", error instanceof ApiError ? error.message : undefined);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <PageHeader title="Riders" description="Verify riders and manage availability." />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by plate…"
              className="pl-9"
            />
          </div>
          <Select value={verified} onChange={(event) => setVerified(event.target.value)} className="sm:w-40">
            <option value="">All riders</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </Select>
          <Select value={availability} onChange={(event) => setAvailability(event.target.value)} className="sm:w-40">
            <option value="">Any availability</option>
            <option value="AVAILABLE">Available</option>
            <option value="BUSY">Busy</option>
            <option value="OFFLINE">Offline</option>
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
                  <Th>Rider</Th>
                  <Th>Vehicle</Th>
                  <Th>Availability</Th>
                  <Th>Account</Th>
                  <Th>Runs</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((user) => {
                  const rider = user.rider;
                  if (!rider) return null;
                  return (
                    <tr key={user.id} className="transition hover:bg-slate-800/40">
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar firstName={user.firstName} lastName={user.lastName} className="size-8" />
                          <div>
                            <p className="font-medium text-white">{user.fullName}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <p className="text-slate-200">{rider.vehicleType}</p>
                        <p className="font-mono text-xs text-slate-500">
                          {rider.vehiclePlate} · {rider.city ?? "—"}
                        </p>
                      </Td>
                      <Td>
                        <AvailabilityBadge availability={rider.availability} />
                      </Td>
                      <Td>
                        <AccountStatusBadge status={user.status} />
                      </Td>
                      <Td className="text-slate-300">{rider.completedRuns}</Td>
                      <Td>
                        <div className="flex items-center justify-end gap-2">
                          {rider.isVerified ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={busyId === user.id}
                              icon={<ShieldX className="size-3.5" />}
                              onClick={() => run(user.id, () => ridersApi.verify(user.id, false), "Rider unverified")}
                            >
                              Unverify
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="success"
                              loading={busyId === user.id}
                              icon={<BadgeCheck className="size-3.5" />}
                              onClick={() => run(user.id, () => ridersApi.verify(user.id, true), "Rider verified")}
                            >
                              Verify
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === user.id || !rider.isVerified}
                            onClick={() =>
                              run(
                                user.id,
                                () =>
                                  ridersApi.setAvailabilityFor(
                                    user.id,
                                    rider.availability === "OFFLINE" ? "AVAILABLE" : "OFFLINE",
                                  ),
                                "Availability updated",
                              )
                            }
                          >
                            {rider.availability === "OFFLINE" ? "Go online" : "Go offline"}
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <Pagination page={result.meta.page} totalPages={result.meta.totalPages} total={result.meta.total} onPage={setPage} />
          </>
        ) : (
          <EmptyState icon={<Bike className="size-5" />} title="No riders found" description="Adjust your filters." />
        )}
      </Card>
    </div>
  );
}
