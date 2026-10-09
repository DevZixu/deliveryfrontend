export type Role = "CUSTOMER" | "RIDER" | "ADMIN";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type Availability = "AVAILABLE" | "BUSY" | "OFFLINE";
export type DeliveryStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD" | "TRANSFER";
export type PaymentStatus = "PENDING" | "SUCCESSFUL" | "FAILED" | "REFUNDED";

export interface RiderProfile {
  id: string;
  userId: string;
  availability: Availability;
  vehicleType: string;
  vehiclePlate: string;
  licenseNumber: string;
  city: string | null;
  isVerified: boolean;
  completedRuns: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  role: Role;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
  rider?: RiderProfile;
}

export interface Payment {
  id: string;
  reference: string;
  deliveryId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  gatewayRef: string | null;
  failureReason: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryEvent {
  id: string;
  deliveryId: string;
  fromStatus: DeliveryStatus | null;
  toStatus: DeliveryStatus;
  actorId: string | null;
  note: string | null;
  createdAt: string;
}

export interface Delivery {
  id: string;
  trackingCode: string;
  status: DeliveryStatus;
  customerId: string;
  riderId: string | null;
  pickup: { name: string; address: string; city: string; phone: string; note: string | null };
  dropoff: {
    recipientName: string;
    address: string;
    city: string;
    phone: string;
    note: string | null;
  };
  package: { description: string; weightKg: number; distanceKm: number };
  fee: number;
  currency: string;
  scheduledFor: string | null;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; firstName: string; lastName: string; fullName: string; email?: string };
  rider?: { id: string; firstName: string; lastName: string; fullName: string; email?: string } | null;
  payment?: Payment | null;
  events?: DeliveryEvent[];
}

export interface Paged<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface PlatformStats {
  usersByRole: Partial<Record<Role, number>>;
  deliveriesByStatus: Partial<Record<DeliveryStatus, number>>;
  paymentsByStatus: Partial<Record<PaymentStatus, number>>;
  revenue: { total: number; successfulPayments: number };
  recentDeliveries: Delivery[];
}

export interface RiderStats {
  availability: Availability;
  isVerified: boolean;
  completedRuns: number;
  activeDeliveries: number;
  deliveredDeliveries: number;
  earnings: { total: number; paidDeliveries: number };
}

export interface CustomerStats {
  totalDeliveries: number;
  deliveriesByStatus: Partial<Record<DeliveryStatus, number>>;
  activeDeliveries: number;
  spend: { total: number; paidDeliveries: number };
}

export interface ApiErrorShape {
  error: string;
  code: string;
  details?: string[];
}
