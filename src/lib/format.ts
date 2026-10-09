import type { Availability, AccountStatus, DeliveryStatus, PaymentStatus, Role } from "./types";

export const currency = (value: number, code = "USD"): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(value ?? 0);

export const dateTime = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const relativeTime = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 1) return "just now";
  if (Math.abs(minutes) < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return `${days}d ago`;
  return dateTime(value);
};

export const initials = (firstName: string, lastName: string): string =>
  `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();

export const DELIVERY_STATUS_META: Record<
  DeliveryStatus,
  { label: string; tone: string; dot: string }
> = {
  PENDING: { label: "Pending", tone: "bg-amber-500/10 text-amber-300 ring-amber-500/30", dot: "bg-amber-400" },
  CONFIRMED: { label: "Confirmed", tone: "bg-sky-500/10 text-sky-300 ring-sky-500/30", dot: "bg-sky-400" },
  ASSIGNED: { label: "Assigned", tone: "bg-indigo-500/10 text-indigo-300 ring-indigo-500/30", dot: "bg-indigo-400" },
  PICKED_UP: { label: "Picked up", tone: "bg-violet-500/10 text-violet-300 ring-violet-500/30", dot: "bg-violet-400" },
  IN_TRANSIT: { label: "In transit", tone: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/30", dot: "bg-cyan-400" },
  DELIVERED: { label: "Delivered", tone: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30", dot: "bg-emerald-400" },
  CANCELLED: { label: "Cancelled", tone: "bg-rose-500/10 text-rose-300 ring-rose-500/30", dot: "bg-rose-400" },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; tone: string; dot: string }> = {
  PENDING: { label: "Pending", tone: "bg-amber-500/10 text-amber-300 ring-amber-500/30", dot: "bg-amber-400" },
  SUCCESSFUL: { label: "Paid", tone: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30", dot: "bg-emerald-400" },
  FAILED: { label: "Failed", tone: "bg-rose-500/10 text-rose-300 ring-rose-500/30", dot: "bg-rose-400" },
  REFUNDED: { label: "Refunded", tone: "bg-slate-500/10 text-slate-300 ring-slate-500/30", dot: "bg-slate-400" },
};

export const AVAILABILITY_META: Record<Availability, { label: string; tone: string; dot: string }> = {
  AVAILABLE: { label: "Available", tone: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30", dot: "bg-emerald-400" },
  BUSY: { label: "Busy", tone: "bg-amber-500/10 text-amber-300 ring-amber-500/30", dot: "bg-amber-400" },
  OFFLINE: { label: "Offline", tone: "bg-slate-500/10 text-slate-300 ring-slate-500/30", dot: "bg-slate-400" },
};

export const ACCOUNT_STATUS_META: Record<AccountStatus, { label: string; tone: string; dot: string }> = {
  ACTIVE: { label: "Active", tone: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30", dot: "bg-emerald-400" },
  INACTIVE: { label: "Inactive", tone: "bg-slate-500/10 text-slate-300 ring-slate-500/30", dot: "bg-slate-400" },
  SUSPENDED: { label: "Suspended", tone: "bg-rose-500/10 text-rose-300 ring-rose-500/30", dot: "bg-rose-400" },
};

export const ROLE_META: Record<Role, { label: string; tone: string }> = {
  CUSTOMER: { label: "Customer", tone: "bg-sky-500/10 text-sky-300 ring-sky-500/30" },
  RIDER: { label: "Rider", tone: "bg-violet-500/10 text-violet-300 ring-violet-500/30" },
  ADMIN: { label: "Admin", tone: "bg-brand-500/10 text-brand-300 ring-brand-500/30" },
};
