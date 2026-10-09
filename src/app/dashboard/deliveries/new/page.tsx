"use client";

import { Calculator, MapPin, PackagePlus, Receipt, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, Field, Input, Select, Textarea } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { ApiError, deliveriesApi, type CreateDeliveryPayload } from "@/lib/api";
import { currency } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";
import { useDebounced } from "@/lib/useDebounced";

interface AddressForm {
  name: string;
  address: string;
  city: string;
  phone: string;
  note: string;
}

const EMPTY_PICKUP: AddressForm = { name: "", address: "", city: "", phone: "", note: "" };

export default function NewDeliveryPage() {
  const router = useRouter();
  const toast = useToast();

  const [pickup, setPickup] = useState<AddressForm>(EMPTY_PICKUP);
  const [dropoff, setDropoff] = useState<AddressForm>({ ...EMPTY_PICKUP, name: "" });
  const [packageDescription, setPackageDescription] = useState("");
  const [weightKg, setWeightKg] = useState("1");
  const [distanceKm, setDistanceKm] = useState("5");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");
  const [scheduledFor, setScheduledFor] = useState("");

  const [fee, setFee] = useState<{ fee: number; currency: string } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const debouncedDistance = useDebounced(distanceKm, 400);
  const debouncedWeight = useDebounced(weightKg, 400);

  useEffect(() => {
    const distance = Number.parseFloat(debouncedDistance);
    const weight = Number.parseFloat(debouncedWeight);
    if (!Number.isFinite(distance) || distance < 0.1 || !Number.isFinite(weight) || weight < 0.1) {
      setFee(null);
      return;
    }
    let active = true;
    setQuoteLoading(true);
    void (async () => {
      try {
        const quote = await deliveriesApi.quote(distance, weight);
        if (active) setFee(quote);
      } catch {
        if (active) setFee(null);
      } finally {
        if (active) setQuoteLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [debouncedDistance, debouncedWeight]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload: CreateDeliveryPayload = {
        pickup: {
          name: pickup.name,
          address: pickup.address,
          city: pickup.city,
          phone: pickup.phone,
          note: pickup.note || undefined,
        },
        dropoff: {
          recipientName: dropoff.name,
          address: dropoff.address,
          city: dropoff.city,
          phone: dropoff.phone,
          note: dropoff.note || undefined,
        },
        packageDescription,
        weightKg: Number.parseFloat(weightKg),
        distanceKm: Number.parseFloat(distanceKm),
        paymentMethod,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
      };
      const { delivery } = await deliveriesApi.create(payload);
      toast.success("Delivery created", `Tracking ${delivery.trackingCode}`);
      router.push(`/dashboard/deliveries/${delivery.id}`);
    } catch (error) {
      const message =
        error instanceof ApiError && error.details?.length ? error.details.join(" · ") : undefined;
      toast.error("Could not create delivery", message ?? (error instanceof ApiError ? error.message : undefined));
    } finally {
      setSubmitting(false);
    }
  };

  const addressSection = (
    value: AddressForm,
    onChange: (next: AddressForm) => void,
    labels: { name: string; namePlaceholder: string },
  ) => (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={labels.name}>
          <Input
            required
            value={value.name}
            placeholder={labels.namePlaceholder}
            onChange={(event) => onChange({ ...value, name: event.target.value })}
          />
        </Field>
        <Field label="Phone">
          <Input
            required
            value={value.phone}
            placeholder="+15550001000"
            onChange={(event) => onChange({ ...value, phone: event.target.value })}
          />
        </Field>
      </div>
      <Field label="Address">
        <Input
          required
          value={value.address}
          placeholder="24 Market Street"
          onChange={(event) => onChange({ ...value, address: event.target.value })}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="City">
          <Input
            required
            value={value.city}
            placeholder="Lagos"
            onChange={(event) => onChange({ ...value, city: event.target.value })}
          />
        </Field>
        <Field label="Note" hint="Optional">
          <Input
            value={value.note}
            placeholder="Flat 3B, call on arrival"
            onChange={(event) => onChange({ ...value, note: event.target.value })}
          />
        </Field>
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} className="animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">New delivery</h1>
        <p className="mt-1 text-sm text-slate-400">Tell us where to pick up and drop off the parcel.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title={<span className="inline-flex items-center gap-2"><MapPin className="size-4 text-emerald-400" /> Pickup</span>} />
            <div className="p-5">{addressSection(pickup, setPickup, { name: "Pickup contact", namePlaceholder: "Store / sender" })}</div>
          </Card>

          <Card>
            <CardHeader title={<span className="inline-flex items-center gap-2"><MapPin className="size-4 text-brand-400" /> Drop-off</span>} />
            <div className="p-5">{addressSection(dropoff, setDropoff, { name: "Recipient name", namePlaceholder: "Jordan Lee" })}</div>
          </Card>

          <Card>
            <CardHeader title={<span className="inline-flex items-center gap-2"><PackagePlus className="size-4 text-violet-400" /> Package</span>} />
            <div className="space-y-4 p-5">
              <Field label="Description">
                <Textarea
                  required
                  maxLength={500}
                  value={packageDescription}
                  placeholder="Small parcel — documents in an envelope"
                  onChange={(event) => setPackageDescription(event.target.value)}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Weight (kg)" hint="0.1 – 500">
                  <Input
                    required
                    type="number"
                    min={0.1}
                    max={500}
                    step={0.1}
                    value={weightKg}
                    onChange={(event) => setWeightKg(event.target.value)}
                  />
                </Field>
                <Field label="Distance (km)" hint="0.1 – 5000">
                  <Input
                    required
                    type="number"
                    min={0.1}
                    max={5000}
                    step={0.1}
                    value={distanceKm}
                    onChange={(event) => setDistanceKm(event.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={<span className="inline-flex items-center gap-2"><Receipt className="size-4 text-amber-400" /> Payment & schedule</span>} />
            <div className="space-y-4 p-5">
              <Field label="Payment method">
                <Select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>
                  <option value="CARD">Card</option>
                  <option value="TRANSFER">Bank transfer</option>
                  <option value="CASH">Cash on delivery</option>
                </Select>
              </Field>
              <Field label="Schedule for" hint="Optional — leave blank to send now">
                <Input type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} />
              </Field>
            </div>
          </Card>

          <Card className="sticky top-6">
            <CardHeader title={<span className="inline-flex items-center gap-2"><Calculator className="size-4 text-brand-400" /> Live quote</span>} />
            <div className="p-5">
              <div className="flex items-end justify-between">
                <span className="text-sm text-slate-400">Estimated fee</span>
                <span className="text-3xl font-semibold text-white">
                  {quoteLoading ? (
                    <Spinner className="size-6 text-brand-400" />
                  ) : fee ? (
                    currency(fee.fee, fee.currency)
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Priced server-side from distance and weight. The final charge uses this fee.
              </p>
              <Button
                type="submit"
                className="mt-5 w-full"
                size="lg"
                loading={submitting}
                disabled={!fee}
                icon={<Truck className="size-4" />}
              >
                Place delivery request
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
