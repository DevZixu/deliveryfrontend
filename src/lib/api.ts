import type {
  ApiErrorShape,
  Availability,
  CustomerStats,
  Delivery,
  DeliveryEvent,
  DeliveryStatus,
  Paged,
  Payment,
  PaymentMethod,
  PlatformStats,
  RiderProfile,
  RiderStats,
  Role,
  User,
} from "./types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(
  /\/$/,
  "",
);

const TOKEN_KEY = "dp_token";

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    window.localStorage.removeItem(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: string[];

  constructor(status: number, body: ApiErrorShape) {
    super(body.error || "Request failed");
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Query;
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true } = options;

  let url = `${API_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, {
      error: "Cannot reach the API server. Is the backend running?",
      code: "NETWORK_ERROR",
    });
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { error: text, code: "INTERNAL_ERROR" };
    }
  }

  if (!response.ok) {
    const shape = (parsed ?? {}) as ApiErrorShape;
    if (response.status === 401 && auth) {
      tokenStore.clear();
      onUnauthorized?.();
    }
    throw new ApiError(response.status, {
      error: shape.error ?? response.statusText,
      code: shape.code ?? "INTERNAL_ERROR",
      details: shape.details,
    });
  }

  return parsed as T;
}

const get = <T>(path: string, query?: Query) => request<T>(path, { query });
const post = <T>(path: string, body?: unknown, auth = true) =>
  request<T>(path, { method: "POST", body, auth });
const patch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "PATCH", body });

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authApi = {
  login: (email: string, password: string) =>
    post<{ token: string; user: User }>("/api/auth/login", { email, password }, false),
  register: (payload: Record<string, unknown>) =>
    post<{ token: string; user: User }>("/api/auth/register", payload, false),
  logout: () => post<void>("/api/auth/logout"),
  me: () => get<{ user: User }>("/api/auth/me"),
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const usersApi = {
  me: () => get<{ user: User }>("/api/users/me"),
  updateMe: (patchBody: Record<string, unknown>) => patch<{ user: User }>("/api/users/me", patchBody),
  list: (query?: Query) => get<Paged<User>>("/api/users", query),
  get: (id: string) => get<{ user: User }>(`/api/users/${id}`),
  changeStatus: (id: string, status: string) =>
    patch<{ user: User }>(`/api/users/${id}/status`, { status }),
};

// ---------------------------------------------------------------------------
// Riders
// ---------------------------------------------------------------------------

export const ridersApi = {
  me: () => get<{ rider: RiderProfile; user: User }>("/api/riders/me"),
  updateMe: (payload: Record<string, unknown>) => patch<{ rider: RiderProfile }>("/api/riders/me", payload),
  setAvailability: (availability: "AVAILABLE" | "OFFLINE") =>
    patch<{ rider: RiderProfile }>("/api/riders/me/availability", { availability }),
  list: (query?: Query) => get<Paged<User>>("/api/riders", query),
  get: (id: string) => get<{ user: User }>(`/api/riders/${id}`),
  verify: (id: string, isVerified = true) =>
    post<{ rider: RiderProfile }>(`/api/riders/${id}/verify`, { isVerified }),
  setAvailabilityFor: (id: string, availability: "AVAILABLE" | "OFFLINE") =>
    patch<{ rider: RiderProfile }>(`/api/riders/${id}/availability`, { availability }),
};

// ---------------------------------------------------------------------------
// Deliveries
// ---------------------------------------------------------------------------

export interface CreateDeliveryPayload {
  pickup: { name: string; address: string; city: string; phone: string; note?: string };
  dropoff: { recipientName: string; address: string; city: string; phone: string; note?: string };
  packageDescription: string;
  weightKg: number;
  distanceKm: number;
  paymentMethod: PaymentMethod;
  scheduledFor?: string;
}

export const deliveriesApi = {
  quote: (distanceKm: number, weightKg: number) =>
    post<{ fee: number; currency: string }>("/api/deliveries/quote", { distanceKm, weightKg }),
  create: (payload: CreateDeliveryPayload) =>
    post<{ delivery: Delivery }>("/api/deliveries", payload),
  list: (query?: Query) => get<Paged<Delivery>>("/api/deliveries", query),
  get: (id: string) => get<{ delivery: Delivery }>(`/api/deliveries/${id}`),
  events: (id: string) => get<{ events: DeliveryEvent[] }>(`/api/deliveries/${id}/events`),
  payment: (id: string) => get<{ payment: Payment | null }>(`/api/deliveries/${id}/payment`),
  assign: (id: string, riderId: string) =>
    post<{ delivery: Delivery }>(`/api/deliveries/${id}/assign`, { riderId }),
  unassign: (id: string) => post<{ delivery: Delivery }>(`/api/deliveries/${id}/unassign`),
  accept: (id: string) => post<{ delivery: Delivery }>(`/api/deliveries/${id}/accept`),
  cancel: (id: string, reason: string) =>
    post<{ delivery: Delivery }>(`/api/deliveries/${id}/cancel`, { reason }),
  updateStatus: (id: string, status: DeliveryStatus, note?: string) =>
    patch<{ delivery: Delivery }>(`/api/deliveries/${id}/status`, { status, note }),
};

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export const paymentsApi = {
  pay: (deliveryId: string, method: PaymentMethod, cardNumber?: string, transferReference?: string) =>
    post<{ payment: Payment; delivery: Pick<Delivery, "id" | "status" | "trackingCode">; message: string }>(
      "/api/payments",
      { deliveryId, method, cardNumber, transferReference },
    ),
  list: (query?: Query) => get<Paged<Payment>>("/api/payments", query),
  get: (id: string) => get<{ payment: Payment }>(`/api/payments/${id}`),
  refund: (id: string) => post<{ payment: Payment }>(`/api/payments/${id}/refund`),
};

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export const statsApi = {
  platform: () => get<PlatformStats>("/api/stats/platform"),
  rider: () => get<RiderStats>("/api/stats/rider"),
  customer: () => get<CustomerStats>("/api/stats/customer"),
};

export type { Availability, Delivery, DeliveryStatus, Payment, Role, User };

// ---------------------------------------------------------------------------
// Admin: staff management
// ---------------------------------------------------------------------------

export interface CreateStaffPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export const adminStaffsApi = {
  list: (query?: Query) => get<Paged<User>>("/api/admin/staffs", query),
  get: (id: string) => get<{ user: User }>(`/api/admin/staffs/${id}`),
  create: (payload: CreateStaffPayload) => post<{ user: User }>("/api/admin/staffs", payload),
  changeStatus: (id: string, status: string) =>
    patch<{ user: User }>(`/api/admin/staffs/${id}/status`, { status }),
};

// ---------------------------------------------------------------------------
// Staff: delivery creation
// ---------------------------------------------------------------------------

export interface StaffCreateDeliveryPayload {
  customerEmail: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  pickup: { name: string; address: string; city: string; phone: string; note?: string };
  dropoff: { recipientName: string; address: string; city: string; phone: string; note?: string };
  packageDescription: string;
  weightKg: number;
  distanceKm: number;
  paymentMethod: "CASH" | "CARD" | "TRANSFER";
  scheduledFor?: string;
}

export const staffApi = {
  createDelivery: (payload: StaffCreateDeliveryPayload) =>
    post<{ delivery: Delivery; customerCreated: boolean; customer: { id: string; email: string; fullName: string } }>(
      "/api/staff/deliveries",
      payload,
    ),
};
