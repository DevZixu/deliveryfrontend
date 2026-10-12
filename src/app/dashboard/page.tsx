"use client";

import { AdminOverview } from "@/components/overview/AdminOverview";
import { CustomerOverview } from "@/components/overview/CustomerOverview";
import { RiderOverview } from "@/components/overview/RiderOverview";
import { StaffOverview } from "@/components/overview/StaffOverview";
import { PageLoader } from "@/components/ui/Spinner";
import { useAuth } from "@/context/auth";

export default function DashboardHome() {
  const { user } = useAuth();
  if (!user) return <PageLoader />;

  if (user.role === "ADMIN") return <AdminOverview />;
  if (user.role === "RIDER") return <RiderOverview />;
  if (user.role === "STAFF") return <StaffOverview />;
  return <CustomerOverview />;
}
