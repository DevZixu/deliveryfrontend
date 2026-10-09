"use client";

import { Search, Users as UsersIcon } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Avatar, EmptyState } from "@/components/ui/Avatar";
import { Card, Input, Select } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination, Table, Td, Th } from "@/components/ui/Table";
import { AccountStatusBadge, RoleBadge } from "@/components/ui/StatusBadges";
import { PageLoader } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { ApiError, usersApi } from "@/lib/api";
import { dateTime } from "@/lib/format";
import type { AccountStatus, Paged, User } from "@/lib/types";
import { useDebounced } from "@/lib/useDebounced";

const STATUSES: AccountStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];

export default function UsersAdminPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<Paged<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersApi.list({
        page,
        limit: 10,
        role: role || undefined,
        status: status || undefined,
        search: debouncedSearch || undefined,
      });
      setResult(data);
    } finally {
      setLoading(false);
    }
  }, [page, role, status, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = async (user: User, next: AccountStatus) => {
    setBusyId(user.id);
    try {
      await usersApi.changeStatus(user.id, next);
      toast.success("Status updated", `${user.fullName} → ${next}`);
      await load();
    } catch (error) {
      toast.error("Could not update status", error instanceof ApiError ? error.message : undefined);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <PageHeader title="Users" description="Every account on the platform." />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or email…"
              className="pl-9"
            />
          </div>
          <Select value={role} onChange={(event) => setRole(event.target.value)} className="sm:w-40">
            <option value="">All roles</option>
            <option value="CUSTOMER">Customers</option>
            <option value="RIDER">Riders</option>
            <option value="ADMIN">Admins</option>
          </Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="sm:w-40">
            <option value="">All statuses</option>
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
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
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Joined</Th>
                  <Th className="text-right">Change status</Th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((user) => (
                  <tr key={user.id} className="transition hover:bg-slate-800/40">
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar firstName={user.firstName} lastName={user.lastName} className="size-8" />
                        <span className="font-medium text-white">{user.fullName}</span>
                      </div>
                    </Td>
                    <Td className="text-slate-400">{user.email}</Td>
                    <Td>
                      <RoleBadge role={user.role} />
                    </Td>
                    <Td>
                      <AccountStatusBadge status={user.status} />
                    </Td>
                    <Td className="text-xs text-slate-400">{dateTime(user.createdAt)}</Td>
                    <Td className="text-right">
                      <select
                        value={user.status}
                        disabled={busyId === user.id}
                        onChange={(event) => changeStatus(user, event.target.value as AccountStatus)}
                        className="rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 text-xs text-slate-200 disabled:opacity-50"
                      >
                        {STATUSES.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={result.meta.page} totalPages={result.meta.totalPages} total={result.meta.total} onPage={setPage} />
          </>
        ) : (
          <EmptyState icon={<UsersIcon className="size-5" />} title="No users found" description="Adjust your filters." />
        )}
      </Card>
    </div>
  );
}
