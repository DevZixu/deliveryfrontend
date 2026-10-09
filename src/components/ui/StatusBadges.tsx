import {
  ACCOUNT_STATUS_META,
  AVAILABILITY_META,
  DELIVERY_STATUS_META,
  PAYMENT_STATUS_META,
  ROLE_META,
} from "@/lib/format";
import type { AccountStatus, Availability, DeliveryStatus, PaymentStatus, Role } from "@/lib/types";
import { Badge } from "./Badge";

export const DeliveryStatusBadge = ({ status }: { status: DeliveryStatus }) => {
  const meta = DELIVERY_STATUS_META[status];
  return (
    <Badge className={meta.tone} dot={meta.dot}>
      {meta.label}
    </Badge>
  );
};

export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
  const meta = PAYMENT_STATUS_META[status];
  return (
    <Badge className={meta.tone} dot={meta.dot}>
      {meta.label}
    </Badge>
  );
};

export const AvailabilityBadge = ({ availability }: { availability: Availability }) => {
  const meta = AVAILABILITY_META[availability];
  return (
    <Badge className={meta.tone} dot={meta.dot}>
      {meta.label}
    </Badge>
  );
};

export const AccountStatusBadge = ({ status }: { status: AccountStatus }) => {
  const meta = ACCOUNT_STATUS_META[status];
  return (
    <Badge className={meta.tone} dot={meta.dot}>
      {meta.label}
    </Badge>
  );
};

export const RoleBadge = ({ role }: { role: Role }) => {
  const meta = ROLE_META[role];
  return <Badge className={meta.tone}>{meta.label}</Badge>;
};
