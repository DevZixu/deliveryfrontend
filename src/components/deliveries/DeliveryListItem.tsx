import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import { DeliveryStatusBadge } from "@/components/ui/StatusBadges";
import { currency, relativeTime } from "@/lib/format";
import type { Delivery } from "@/lib/types";

export function DeliveryListItem({ delivery }: { delivery: Delivery }) {
  return (
    <Link
      href={`/dashboard/deliveries/${delivery.id}`}
      className="group flex items-center gap-4 border-b border-white/5 px-4 py-3.5 transition last:border-0 hover:bg-slate-800/40"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-400">{delivery.trackingCode}</span>
          <DeliveryStatusBadge status={delivery.status} />
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-300">
          <MapPin className="size-3.5 shrink-0 text-slate-500" />
          <span className="truncate">
            {delivery.pickup.city} → {delivery.dropoff.city}
          </span>
        </div>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-white">{currency(delivery.fee, delivery.currency)}</p>
        <p className="text-xs text-slate-500">{relativeTime(delivery.createdAt)}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-brand-400" />
    </Link>
  );
}
