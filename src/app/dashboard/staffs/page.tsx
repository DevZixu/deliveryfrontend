"use client";

import { Briefcase, Plus, Search, Shield } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Avatar, EmptyState } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, Field, Input, Select } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Spinner";
import { AccountStatusBadge } from "@/components/ui/StatusBadges";
import { Pagination, Table, Td, Th } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { adminStaffsApi, type CreateStaffPayload, ApiError } from "@/lib/api";
import { dateTime } from "@/lib/format";
import type { AccountStatus, Paged, User } from "@/lib/types";
import { useDebounced } from "@/lib/useDebounced";

const STATUSES: AccountStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];

const EMPTY_FORM: CreateStaffPayload = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
};

export default function StaffsAdminPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paged<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateStaffPayload>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminStaffsApi.list({
        page,
        limit: 10,
        status: status || undefined,
        search: debouncedSearch || undefined,
      });
      setResult(data);
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = async (user: User, next: AccountStatus) => {
    setBusyId(user.id);
    try {
      await adminStaffsApi.changeStatus(user.id, next);
      toast.success("Status updated", `${user.fullName} → ${next}`);
      await load();
    } catch (error) {
      toast.error("Failed", error instanceof ApiError ? error.message : undefined);
    } finally {
      setBusyId(null);
    }
  };

  const createStaff = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    try {
      const { user } = await adminStaffsApi.create({
        ...form,
        phone: form.phone || undefined,
      });
      toast.success("Staff created", `${user.fullName} can now log in.`);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (error) {
      toast.error("Could not create staff", error instanceof ApiError ? error.message : undefined);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Staff"
        description="Internal operators who manage deliveries."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setShowCreate(true)}>
            New staff
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="pl-9"
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0] + s.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {loading && !result ? (
        <PageLoader label="Loading staff…" />
      ) : (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Status</Th>
                <Th>Joined</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {result?.data.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={<Briefcase className="size-8" />} title="No staff members yet" />
                  </td>
                </tr>
              ) : (
                result?.data.map((user) => (
                  <tr key={user.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar firstName={user.firstName} lastName={user.lastName} />
                        <span className="font-medium text-white">{user.fullName}</span>
                      </div>
                    </Td>
                    <Td className="text-slate-400">{user.email}</Td>
                    <Td className="text-slate-400">{user.phone ?? "—"}</Td>
                    <Td>
                      <AccountStatusBadge status={user.status} />
                    </Td>
                    <Td className="text-slate-400">{dateTime(user.createdAt)}</Td>
                    <Td>
                      <Select
                        value={user.status}
                        disabled={busyId === user.id}
                        onChange={(e) => void changeStatus(user, e.target.value as AccountStatus)}
                        className="w-36 text-xs"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s[0] + s.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </Select>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
          {result && result.meta.totalPages > 1 && (
            <div className="border-t border-white/5 p-4">
              <Pagination
                page={result.meta.page}
                totalPages={result.meta.totalPages}
                total={result.meta.total}
                onPage={setPage}
              />
            </div>
          )}
        </Card>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={
          <span className="inline-flex items-center gap-2">
            <Shield className="size-4 text-amber-400" />
            Create staff account
          </span>
        }
      >
        <form onSubmit={createStaff} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <Input
                required
                value={form.firstName}
                placeholder="Jordan"
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </Field>
            <Field label="Last name">
              <Input
                required
                value={form.lastName}
                placeholder="Smith"
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Email">
            <Input
              required
              type="email"
              value={form.email}
              placeholder="jordan@company.com"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Phone" hint="Optional">
            <Input
              type="tel"
              value={form.phone ?? ""}
              placeholder="+15550001000"
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Temporary password">
            <Input
              required
              type="password"
              value={form.password}
              placeholder="Min 8 characters"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating} icon={<Plus className="size-4" />}>
              Create staff
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
