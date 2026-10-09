"use client";

import {
  ArrowLeft,
  Ban,
  Bike,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  Phone,
  Receipt,
  RefreshCw,
  Truck,
  UserSquare2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, Field, Input, Select, Textarea } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader, Spinner } from "@/components/ui/Spinner";
import { Avatar } from "@/components/ui/Avatar";
import { DeliveryStatusBadge, PaymentStatusBadge } from "@/components/ui/StatusBadges";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/auth";
import {
  ApiError,
  deliveriesApi,
  paymentsApi,
  ridersApi,
} from "@/lib/api";
import { currency, dateTime, relativeTime } from "@/lib/format";
import type { Delivery, DeliveryStatus, PaymentMethod, User } from "@/lib/types";

const NEXT: Record<DeliveryStatus, DeliveryStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["PICKED_UP", "CONFIRMED", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const RIDER_STEP: Partial<Record<DeliveryStatus, { to: DeliveryStatus; label: string }>> = {
  ASSIGNED: { to: "PICKED_UP", label: "Mark picked up" },
  PICKED_UP: { to: "IN_TRANSIT", label: "Start transit" },
  IN_TRANSIT: { to: "DELIVERED", label: "Mark delivered" },
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-right text-sm text-slate-200">{children}</span>
    </div>
  );
}

function EventDot() {
  return <span className="mt-1 size-2.5 shrink-0 rounded-full bg-brand-400 ring-4 ring-brand-500/10" />;
}

export default function DeliveryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();
  const toast = useToast();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [payMethod, setPayMethod] = useState<PaymentMethod>("CARD");
  const [cardNumber, setCardNumber] = useState("");
  const [transferReference, setTransferReference] = useState("");

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [availableRiders, setAvailableRiders] = useState<User[]>([]);
  const [riderId, setRiderId] = useState("");
  const [refundOpen, setRefundOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const { delivery: fresh } = await deliveriesApi.get(id);
      setDelivery(fresh);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<unknown>, successMessage: string) => {
    setBusy(true);
    try {
      await action();
      await load();
      toast.success(successMessage);
    } catch (error) {
      toast.error(
        "Action failed",
        error instanceof ApiError && error.details?.length
          ? error.details.join(" · ")
          : error instanceof ApiError
            ? error.message
            : undefined,
      );
    } finally {
      setBusy(false);
    }
  };

  const openAssign = async () => {
    setAssignOpen(true);
    try {
      const result = await ridersApi.list({ availability: "AVAILABLE", verified: "true", limit: 50 });
      setAvailableRiders(result.data);
    } catch {
      setAvailableRiders([]);
    }
  };

  if (loading) return <PageLoader />;
  if (notFound || !delivery) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-lg font-medium text-white">Delivery not found</p>
        <p className="mt-1 text-sm text-slate-400">It may have been removed or belongs to someone else.</p>
        <Link href="/dashboard/deliveries" className="mt-4 inline-block">
          <Button variant="outline" icon={<ArrowLeft className="size-4" />}>
            Back to deliveries
          </Button>
        </Link>
      </div>
    );
  }

  const role = user?.role ?? "CUSTOMER";
  const isOwner = delivery.customerId === user?.id;
  const isAssignedRider = delivery.riderId === user?.id;
  const payment = delivery.payment;
  const paymentSettled = payment?.status === "SUCCESSFUL" || payment?.status === "REFUNDED";
  const canPay = role === "CUSTOMER" && isOwner && delivery.status === "PENDING" && !paymentSettled;
  const canCancel =
    (role === "ADMIN" && NEXT[delivery.status].includes("CANCELLED")) ||
    (role === "CUSTOMER" && isOwner && (delivery.status === "PENDING" || delivery.status === "CONFIRMED"));
  const step = role === "RIDER" && isAssignedRider ? RIDER_STEP[delivery.status] : undefined;
  const adminAdvance =
    role === "ADMIN"
      ? NEXT[delivery.status].filter((status) => status !== "CANCELLED" && status !== "ASSIGNED")
      : [];

  const submitPayment = () =>
    run(
      () => paymentsApi.pay(delivery.id, payMethod, cardNumber || undefined, transferReference || undefined),
      "Payment processed",
    );

  return (
    <div className="animate-fade-in-up">
      <Link
        href="/dashboard/deliveries"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white"
      >
        <ArrowLeft className="size-3.5" /> All deliveries
      </Link>

      <PageHeader
        title={<span className="font-mono text-xl">{delivery.trackingCode}</span>}
        description={`Created ${relativeTime(delivery.createdAt)}`}
        actions={
          <div className="flex items-center gap-2">
            <DeliveryStatusBadge status={delivery.status} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void load()}
              icon={<RefreshCw className="size-3.5" />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Route" />
            <div className="space-y-4 p-5">
              <div className="flex gap-3">
                <span className="mt-1 flex size-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <MapPin className="size-3.5" />
                </span>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Pickup</p>
                  <p className="text-sm font-medium text-white">{delivery.pickup.name}</p>
                  <p className="text-sm text-slate-400">
                    {delivery.pickup.address}, {delivery.pickup.city}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                    <Phone className="size-3" /> {delivery.pickup.phone}
                  </p>
                  {delivery.pickup.note ? (
                    <p className="mt-1 text-xs italic text-slate-500">{delivery.pickup.note}</p>
                  ) : null}
                </div>
              </div>

              <div className="ml-3.5 h-6 border-l-2 border-dashed border-slate-700" />

              <div className="flex gap-3">
                <span className="mt-1 flex size-7 items-center justify-center rounded-full bg-brand-500/10 text-brand-400">
                  <MapPin className="size-3.5" />
                </span>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Drop-off</p>
                  <p className="text-sm font-medium text-white">{delivery.dropoff.recipientName}</p>
                  <p className="text-sm text-slate-400">
                    {delivery.dropoff.address}, {delivery.dropoff.city}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                    <Phone className="size-3" /> {delivery.dropoff.phone}
                  </p>
                  {delivery.dropoff.note ? (
                    <p className="mt-1 text-xs italic text-slate-500">{delivery.dropoff.note}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Timeline" subtitle="Oldest first" />
            <div className="p-5">
              {delivery.events && delivery.events.length > 0 ? (
                <ol className="space-y-4">
                  {delivery.events.map((event) => (
                    <li key={event.id} className="flex gap-3">
                      <EventDot />
                      <div className="-mt-0.5">
                        <div className="flex items-center gap-2">
                          <DeliveryStatusBadge status={event.toStatus} />
                          <span className="text-xs text-slate-500">{dateTime(event.createdAt)}</span>
                        </div>
                        {event.note ? <p className="mt-1 text-xs text-slate-400">{event.note}</p> : null}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-slate-500">No events recorded yet.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {canPay ? (
            <Card>
              <CardHeader
                title={<span className="inline-flex items-center gap-2"><CreditCard className="size-4 text-brand-400" /> Pay for this delivery</span>}
              />
              <div className="space-y-4 p-5">
                <Field label="Method">
                  <Select value={payMethod} onChange={(event) => setPayMethod(event.target.value as PaymentMethod)}>
                    <option value="CARD">Card</option>
                    <option value="TRANSFER">Bank transfer</option>
                    <option value="CASH">Cash on delivery</option>
                  </Select>
                </Field>
                {payMethod === "CARD" ? (
                  <Field label="Card number" hint="A number ending in 0000 simulates a decline">
                    <Input
                      value={cardNumber}
                      placeholder="4242 4242 4242 4242"
                      onChange={(event) => setCardNumber(event.target.value)}
                    />
                  </Field>
                ) : null}
                {payMethod === "TRANSFER" ? (
                  <Field label="Transfer reference" hint="Optional">
                    <Input
                      value={transferReference}
                      placeholder="TRX-123456"
                      onChange={(event) => setTransferReference(event.target.value)}
                    />
                  </Field>
                ) : null}
                <Button className="w-full" loading={busy} onClick={submitPayment} icon={<Receipt className="size-4" />}>
                  Pay {currency(delivery.fee, delivery.currency)}
                </Button>
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Summary" />
            <div className="divide-y divide-white/5 px-5 py-2">
              <DetailRow label="Fee">{currency(delivery.fee, delivery.currency)}</DetailRow>
              <DetailRow label="Payment">
                {payment ? <PaymentStatusBadge status={payment.status} /> : "—"}
              </DetailRow>
              <DetailRow label="Method">{payment?.method ?? "—"}</DetailRow>
              <DetailRow label="Weight">{delivery.package.weightKg} kg</DetailRow>
              <DetailRow label="Distance">{delivery.package.distanceKm} km</DetailRow>
              <DetailRow label="Scheduled">{dateTime(delivery.scheduledFor)}</DetailRow>
            </div>
          </Card>

          <Card>
            <CardHeader title={<span className="inline-flex items-center gap-2"><Package className="size-4 text-violet-400" /> Package</span>} />
            <div className="px-5 py-4">
              <p className="text-sm text-slate-300">{delivery.package.description}</p>
            </div>
          </Card>

          <Card>
            <CardHeader title="People" />
            <div className="space-y-3 p-5">
              <div className="flex items-center gap-3">
                <Avatar firstName={delivery.customer?.firstName ?? "?"} lastName={delivery.customer?.lastName ?? ""} />
                <div>
                  <p className="text-sm font-medium text-white">{delivery.customer?.fullName ?? "Customer"}</p>
                  <p className="text-xs text-slate-500">Customer</p>
                </div>
              </div>
              {delivery.rider ? (
                <div className="flex items-center gap-3">
                  <Avatar firstName={delivery.rider.firstName} lastName={delivery.rider.lastName} />
                  <div>
                    <p className="text-sm font-medium text-white">{delivery.rider.fullName}</p>
                    <p className="text-xs text-slate-500">Rider</p>
                  </div>
                </div>
              ) : (
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <Bike className="size-3.5" /> No rider assigned yet
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Actions" />
            <div className="flex flex-col gap-2 p-5">
              {step ? (
                <Button
                  loading={busy}
                  icon={<Truck className="size-4" />}
                  onClick={() => run(() => deliveriesApi.updateStatus(delivery.id, step.to), `Marked ${step.label.toLowerCase()}`)}
                >
                  {step.label}
                </Button>
              ) : null}

              {role === "ADMIN" && delivery.status === "CONFIRMED" ? (
                <Button loading={busy} onClick={openAssign} icon={<UserSquare2 className="size-4" />}>
                  Assign rider
                </Button>
              ) : null}

              {role === "ADMIN" && delivery.status === "ASSIGNED" ? (
                <Button
                  variant="secondary"
                  loading={busy}
                  icon={<Bike className="size-4" />}
                  onClick={() => run(() => deliveriesApi.unassign(delivery.id), "Rider unassigned")}
                >
                  Unassign rider
                </Button>
              ) : null}

              {adminAdvance.map((to) => (
                <Button
                  key={to}
                  variant="secondary"
                  loading={busy}
                  onClick={() => run(() => deliveriesApi.updateStatus(delivery.id, to), `Moved to ${to}`)}
                >
                  Advance to {to.replace(/_/g, " ").toLowerCase()}
                </Button>
              ))}

              {role !== "CUSTOMER" && payment?.status === "SUCCESSFUL" && (delivery.status === "DELIVERED" || delivery.status === "CANCELLED") ? (
                <Button
                  variant="secondary"
                  loading={busy}
                  icon={<CreditCard className="size-4" />}
                  onClick={() => setRefundOpen(true)}
                >
                  Refund payment
                </Button>
              ) : null}

              {canCancel ? (
                <Button variant="danger" loading={busy} icon={<Ban className="size-4" />} onClick={() => setCancelOpen(true)}>
                  Cancel delivery
                </Button>
              ) : null}

              {!step && role === "CUSTOMER" && !canPay && !canCancel ? (
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="size-3.5" /> No actions available for this delivery.
                </p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={async () => {
          await run(() => deliveriesApi.cancel(delivery.id, cancelReason || "Cancelled by user"), "Delivery cancelled");
          setCancelOpen(false);
          setCancelReason("");
        }}
        title="Cancel delivery"
        subtitle="Successful payments are refunded automatically."
        confirmLabel="Cancel delivery"
      >
        <Field label="Reason">
          <Textarea
            value={cancelReason}
            placeholder="Customer changed their mind"
            onChange={(event) => setCancelReason(event.target.value)}
          />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        onConfirm={async () => {
          if (!payment) return;
          await run(() => paymentsApi.refund(payment.id), "Payment refunded");
          setRefundOpen(false);
        }}
        title="Refund payment"
        subtitle={`Refund ${payment ? currency(payment.amount, payment.currency) : ""} to the customer?`}
        confirmLabel="Issue refund"
        confirmVariant="primary"
      >
        <p className="text-sm text-slate-400">The payment will be marked as refunded and the timeline updated.</p>
      </ConfirmDialog>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign a rider"
        subtitle="Verified, available riders only."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!riderId}
              loading={busy}
              onClick={async () => {
                await run(() => deliveriesApi.assign(delivery.id, riderId), "Rider assigned");
                setAssignOpen(false);
                setRiderId("");
              }}
            >
              Assign
            </Button>
          </>
        }
      >
        {availableRiders.length === 0 ? (
          <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
            <Spinner className="size-4" /> No verified riders are currently available.
          </div>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {availableRiders.map((rider) => (
              <button
                key={rider.id}
                type="button"
                onClick={() => setRiderId(rider.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                  riderId === rider.id ? "border-brand-500 bg-brand-500/10" : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <Avatar firstName={rider.firstName} lastName={rider.lastName} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{rider.fullName}</p>
                  <p className="truncate text-xs text-slate-400">
                    {rider.rider?.vehicleType} · {rider.rider?.vehiclePlate} · {rider.rider?.city ?? "—"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
