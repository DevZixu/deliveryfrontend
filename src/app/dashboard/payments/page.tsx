"use client";

import { CreditCard, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, Select } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination, Table, Td, Th } from "@/components/ui/Table";
import { PaymentStatusBadge } from "@/components/ui/StatusBadges";
import { PageLoader } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { ApiError, paymentsApi } from "@/lib/api";
import { currency, dateTime } from "@/lib/format";
import type { Paged, Payment, PaymentStatus } from "@/lib/types";

const STATUSES: PaymentStatus[] = ["PENDING", "SUCCESSFUL", "FAILED", "REFUNDED"];

export default function PaymentsAdminPage() {
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paged<Payment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await paymentsApi.list({ page, limit: 10, status: status || undefined });
      setResult(data);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const refund = async (payment: Payment) => {
    setBusyId(payment.id);
    try {
      await paymentsApi.refund(payment.id);
      toast.success("Payment refunded", payment.reference);
      await load();
    } catch (error) {
      toast.error("Refund failed", error instanceof ApiError ? error.message : undefined);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <PageHeader title="Payments" description="All transactions across the platform." />

      <Card className="mb-4">
        <div className="flex items-center justify-between gap-3 p-4">
          <p className="text-sm text-slate-400">
            {result ? `${result.meta.total} payments` : "Loading…"}
          </p>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-52">
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
                  <Th>Reference</Th>
                  <Th>Delivery</Th>
                  <Th>Method</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Amount</Th>
                  <Th>Created</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((payment) => (
                  <tr key={payment.id} className="transition hover:bg-slate-800/40">
                    <Td className="font-mono text-xs text-slate-300">{payment.reference}</Td>
                    <Td className="font-mono text-xs text-slate-500">{payment.deliveryId.slice(0, 8)}…</Td>
                    <Td className="text-slate-300">{payment.method}</Td>
                    <Td>
                      <PaymentStatusBadge status={payment.status} />
                    </Td>
                    <Td className="text-right font-medium text-white">
                      {currency(payment.amount, payment.currency)}
                    </Td>
                    <Td className="text-xs text-slate-400">{dateTime(payment.createdAt)}</Td>
                    <Td className="text-right">
                      {payment.status === "SUCCESSFUL" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={busyId === payment.id}
                          icon={<RotateCcw className="size-3.5" />}
                          onClick={() => setRefundTarget(payment)}
                        >
                          Refund
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={result.meta.page} totalPages={result.meta.totalPages} total={result.meta.total} onPage={setPage} />
          </>
        ) : (
          <EmptyState icon={<CreditCard className="size-5" />} title="No payments found" description="Adjust your filters." />
        )}
      </Card>

      <ConfirmDialog
        open={refundTarget !== null}
        onClose={() => setRefundTarget(null)}
        onConfirm={async () => {
          if (refundTarget) await refund(refundTarget);
          setRefundTarget(null);
        }}
        title="Issue refund"
        subtitle={
          refundTarget ? `Refund ${currency(refundTarget.amount, refundTarget.currency)} for ${refundTarget.reference}?` : undefined
        }
        confirmLabel="Issue refund"
        confirmVariant="primary"
      >
        <p className="text-sm text-slate-400">
          Refunds require the delivery to be cancelled or delivered. The payment will be marked refunded.
        </p>
      </ConfirmDialog>
    </div>
  );
}
