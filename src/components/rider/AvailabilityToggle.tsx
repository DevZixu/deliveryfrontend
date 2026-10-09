"use client";

import { Power } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AvailabilityBadge } from "@/components/ui/StatusBadges";
import { useToast } from "@/components/ui/Toast";
import { ridersApi } from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { RiderProfile } from "@/lib/types";

export function AvailabilityToggle({
  profile,
  onChange,
}: {
  profile: RiderProfile;
  onChange: (profile: RiderProfile) => void;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const target = profile.availability === "OFFLINE" ? "AVAILABLE" : "OFFLINE";

  const toggle = async () => {
    setLoading(true);
    try {
      const { rider } = await ridersApi.setAvailability(target);
      onChange(rider);
      toast.success(target === "AVAILABLE" ? "You're online" : "You're offline");
    } catch (error) {
      toast.error("Could not update availability", error instanceof ApiError ? error.message : undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-300">Availability</span>
        <AvailabilityBadge availability={profile.availability} />
      </div>
      <Button
        size="sm"
        variant={target === "AVAILABLE" ? "success" : "secondary"}
        loading={loading}
        disabled={!profile.isVerified || profile.availability === "BUSY"}
        icon={<Power className="size-3.5" />}
        onClick={toggle}
      >
        {target === "AVAILABLE" ? "Go online" : "Go offline"}
      </Button>
    </div>
  );
}
