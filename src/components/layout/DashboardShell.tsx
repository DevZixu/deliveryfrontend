"use client";

import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Radar,
  User as UserIcon,
  Users,
  Bike,
  BarChart3,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Brand } from "@/components/Brand";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import { RoleBadge } from "@/components/ui/StatusBadges";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/cn";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

const NAV: Record<Role, NavItem[]> = {
  CUSTOMER: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/deliveries/new", label: "New delivery", icon: Plus },
    { href: "/dashboard/deliveries", label: "My deliveries", icon: Package },
    { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
    { href: "/dashboard/profile", label: "Profile", icon: UserIcon },
  ],
  RIDER: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/jobs", label: "Available jobs", icon: Radar },
    { href: "/dashboard/deliveries", label: "My deliveries", icon: Package },
    { href: "/dashboard/profile", label: "Profile", icon: UserIcon },
  ],
  ADMIN: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/deliveries", label: "Deliveries", icon: Package },
    { href: "/dashboard/riders", label: "Riders", icon: Bike },
    { href: "/dashboard/users", label: "Users", icon: Users },
    { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
    { href: "/dashboard/stats", label: "Analytics", icon: BarChart3 },
  ],
};

function isActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (loading || !user) {
    return <PageLoader label="Loading your workspace…" />;
  }

  const items = NAV[user.role];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/dashboard">
          <Brand />
        </Link>
        <button
          type="button"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-brand-500/10 text-white ring-1 ring-inset ring-brand-500/30"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white",
              )}
            >
              <item.icon className={cn("size-4", active ? "text-brand-400" : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-slate-950/50 px-3 py-2.5">
          <Avatar firstName={user.firstName} lastName={user.lastName} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user.fullName}</p>
            <div className="mt-0.5">
              <RoleBadge role={user.role} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-rose-300"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-white/5 bg-slate-900/40 lg:block">
        {sidebar}
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-overlay-in bg-slate-950/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="relative z-10 h-full w-72 animate-fade-in-up border-r border-white/5 bg-slate-900">
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 bg-slate-950/80 px-4 py-3 backdrop-blur lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
          <Brand showText />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
