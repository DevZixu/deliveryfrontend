"use client";

import { BadgeCheck, Bike, KeyRound, Save, ShieldX, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { AvailabilityToggle } from "@/components/rider/AvailabilityToggle";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, Field, Input } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { AccountStatusBadge, AvailabilityBadge } from "@/components/ui/StatusBadges";
import { PageLoader } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/auth";
import { ApiError, ridersApi, usersApi } from "@/lib/api";
import type { RiderProfile } from "@/lib/types";

export default function ProfilePage() {
  const { user, setUser, refresh } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [passwords, setPasswords] = useState({ currentPassword: "", password: "" });
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [riderForm, setRiderForm] = useState({ vehicleType: "", vehiclePlate: "", licenseNumber: "", city: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingRider, setSavingRider] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfile({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? "",
    });
  }, [user]);

  useEffect(() => {
    if (user?.role !== "RIDER") return;
    void (async () => {
      try {
        const { rider: fresh } = await ridersApi.me();
        setRider(fresh);
        setRiderForm({
          vehicleType: fresh.vehicleType,
          vehiclePlate: fresh.vehiclePlate,
          licenseNumber: fresh.licenseNumber,
          city: fresh.city ?? "",
        });
      } catch {
        // ignore
      }
    })();
  }, [user?.role]);

  if (!user) return <PageLoader />;

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const { user: updated } = await usersApi.updateMe({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
      });
      setUser(updated);
      toast.success("Profile saved");
    } catch (error) {
      toast.error("Could not save profile", error instanceof ApiError ? error.message : undefined);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingPassword(true);
    try {
      await usersApi.updateMe(passwords);
      setPasswords({ currentPassword: "", password: "" });
      toast.success("Password updated");
    } catch (error) {
      toast.error("Could not update password", error instanceof ApiError ? error.message : undefined);
    } finally {
      setSavingPassword(false);
    }
  };

  const saveRider = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingRider(true);
    try {
      const { rider: updated } = await ridersApi.updateMe(riderForm);
      setRider(updated);
      await refresh();
      toast.success("Rider profile saved");
    } catch (error) {
      toast.error("Could not save rider profile", error instanceof ApiError ? error.message : undefined);
    } finally {
      setSavingRider(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <PageHeader title="Profile" description="Manage your account details." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <div className="flex items-center gap-4 border-b border-white/5 p-5">
            <Avatar firstName={user.firstName} lastName={user.lastName} className="size-14 text-lg" />
            <div>
              <p className="text-lg font-semibold text-white">{user.fullName}</p>
              <p className="text-sm text-slate-400">{user.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <AccountStatusBadge status={user.status} />
              </div>
            </div>
          </div>
          <form onSubmit={saveProfile} className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <Input
                  value={profile.firstName}
                  onChange={(event) => setProfile((p) => ({ ...p, firstName: event.target.value }))}
                />
              </Field>
              <Field label="Last name">
                <Input
                  value={profile.lastName}
                  onChange={(event) => setProfile((p) => ({ ...p, lastName: event.target.value }))}
                />
              </Field>
            </div>
            <Field label="Phone">
              <Input
                value={profile.phone}
                placeholder="+15550001000"
                onChange={(event) => setProfile((p) => ({ ...p, phone: event.target.value }))}
              />
            </Field>
            <Button type="submit" loading={savingProfile} icon={<Save className="size-4" />}>
              Save changes
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title={<span className="inline-flex items-center gap-2"><KeyRound className="size-4 text-amber-400" /> Password</span>}
            />
            <form onSubmit={savePassword} className="space-y-4 p-5">
              <Field label="Current password">
                <Input
                  type="password"
                  required
                  value={passwords.currentPassword}
                  onChange={(event) => setPasswords((p) => ({ ...p, currentPassword: event.target.value }))}
                />
              </Field>
              <Field label="New password" hint="At least 8 characters">
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={passwords.password}
                  onChange={(event) => setPasswords((p) => ({ ...p, password: event.target.value }))}
                />
              </Field>
              <Button type="submit" variant="secondary" loading={savingPassword}>
                Update password
              </Button>
            </form>
          </Card>

          {user.role === "RIDER" ? (
            <Card>
              <CardHeader
                title={<span className="inline-flex items-center gap-2"><Bike className="size-4 text-brand-400" /> Rider profile</span>}
                action={
                  rider ? (
                    rider.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                        <BadgeCheck className="size-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                        <ShieldX className="size-3.5" /> Pending verification
                      </span>
                    )
                  ) : null
                }
              />
              {rider ? (
                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Availability</span>
                    <AvailabilityBadge availability={rider.availability} />
                  </div>
                  <AvailabilityToggle profile={rider} onChange={setRider} />
                  <form onSubmit={saveRider} className="space-y-4 border-t border-white/5 pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Vehicle type">
                        <Input
                          value={riderForm.vehicleType}
                          onChange={(event) => setRiderForm((p) => ({ ...p, vehicleType: event.target.value }))}
                        />
                      </Field>
                      <Field label="Plate number">
                        <Input
                          value={riderForm.vehiclePlate}
                          onChange={(event) => setRiderForm((p) => ({ ...p, vehiclePlate: event.target.value }))}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Licence number">
                        <Input
                          value={riderForm.licenseNumber}
                          onChange={(event) => setRiderForm((p) => ({ ...p, licenseNumber: event.target.value }))}
                        />
                      </Field>
                      <Field label="City">
                        <Input
                          value={riderForm.city}
                          onChange={(event) => setRiderForm((p) => ({ ...p, city: event.target.value }))}
                        />
                      </Field>
                    </div>
                    <Button type="submit" loading={savingRider} icon={<UserCog className="size-4" />}>
                      Save rider profile
                    </Button>
                  </form>
                </div>
              ) : (
                <PageLoader />
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
