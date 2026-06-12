import React, { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCreateBooking } from "../hooks";
import {
  calculateBookingPricingPreview,
  formatCents,
  formatQuantityLabel,
  formatRateLabel,
} from "../pricing";
import {
  bookingRequestFormDefaults,
  bookingRequestFormSchema,
  type BookingRequestFormValues,
} from "../schema";
import type { PublicVendor } from "@/features/vendor/types";
import { TrustCues } from "@/components/marketing/TrustCues";

interface BookingRequestSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: PublicVendor;
  customerId: string;
}

function serviceRateCents(
  price: number | null,
  pricingType: string | null,
): number {
  if (pricingType === "quote" || price == null) return 0;
  return Math.round(price * 100);
}

export function BookingRequestSheet({
  open,
  onOpenChange,
  vendor,
  customerId,
}: BookingRequestSheetProps) {
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const createMutation = useCreateBooking(vendor.id, customerId);

  const form = useForm<BookingRequestFormValues>({
    resolver: zodResolver(bookingRequestFormSchema),
    defaultValues: bookingRequestFormDefaults,
    mode: "onChange",
  });

  const serviceId = form.watch("serviceId");
  const pricingType = form.watch("pricingType");
  const eventDate = form.watch("eventDate");
  const eventEndDate = form.watch("eventEndDate");
  const eventTimeStart = form.watch("eventTimeStart");
  const eventTimeEnd = form.watch("eventTimeEnd");

  const selectedService = vendor.services.find((s) => s.id === serviceId);
  const isQuote = pricingType === "quote";
  const isPerHour = pricingType === "per_hour";
  const isPerDay = pricingType === "per_day";
  const isPerEvent = pricingType === "per_event";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (open) {
      setIdempotencyKey(crypto.randomUUID());
    } else {
      form.reset(bookingRequestFormDefaults);
    }
  }, [open, form]);

  useEffect(() => {
    if (!selectedService) return;
    form.setValue(
      "pricingType",
      selectedService.pricingType as BookingRequestFormValues["pricingType"],
      { shouldValidate: true },
    );
    if (selectedService.pricingType !== "per_day") {
      form.setValue("eventEndDate", undefined, { shouldValidate: true });
    }
    if (selectedService.pricingType !== "per_hour") {
      form.setValue("eventTimeStart", "", { shouldValidate: true });
      form.setValue("eventTimeEnd", "", { shouldValidate: true });
    }
  }, [serviceId, selectedService, form]);

  const eventDateStr = eventDate ? format(eventDate, "yyyy-MM-dd") : "";
  const eventEndDateStr = eventEndDate
    ? format(eventEndDate, "yyyy-MM-dd")
    : "";

  const preview = useMemo(() => {
    if (!selectedService || !eventDateStr) return null;
    const result = calculateBookingPricingPreview(selectedService.name, {
      pricingType,
      rateCents: serviceRateCents(selectedService.price, pricingType),
      eventDate: eventDateStr,
      eventEndDate: eventEndDateStr || null,
      eventTimeStart: eventTimeStart || null,
      eventTimeEnd: eventTimeEnd || null,
    });
    return result.preview;
  }, [
    selectedService,
    eventDateStr,
    eventEndDateStr,
    eventTimeStart,
    eventTimeEnd,
    pricingType,
  ]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!values.eventDate || !idempotencyKey) return;

    await createMutation.mutateAsync({
      idempotencyKey,
      vendorId: vendor.id,
      serviceId: values.serviceId,
      eventDate: format(values.eventDate, "yyyy-MM-dd"),
      eventEndDate: values.eventEndDate
        ? format(values.eventEndDate, "yyyy-MM-dd")
        : undefined,
      eventTimeStart: values.eventTimeStart || undefined,
      eventTimeEnd: values.eventTimeEnd || undefined,
      eventLocation: values.eventLocation || undefined,
      notes: values.notes || undefined,
    });
    onOpenChange(false);
  });

  const rateLabel = selectedService
    ? formatRateLabel(
      pricingType,
      serviceRateCents(selectedService.price, pricingType),
    )
    : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Request booking</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {vendor.businessName}
          </p>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="mt-6 space-y-6"
          >
            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Select a service</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    You can request one service per booking
                  </p>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      {vendor.services.map((service) => {
                        const pt = service.pricingType ?? "";
                        const priceLabel =
                          pt === "quote"
                            ? "Custom quote"
                            : formatRateLabel(
                              pt,
                              serviceRateCents(service.price, pt),
                            );
                        return (
                          <label
                            key={service.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                              field.value === service.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted/50",
                            )}
                          >
                            <RadioGroupItem
                              value={service.id}
                              className="mt-1"
                            />
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {priceLabel}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isQuote && (
              <p className="text-sm rounded-md bg-blue-50 border border-blue-100 p-3 text-blue-900">
                This service requires a custom quote. The vendor will send you a
                price after reviewing your request.
              </p>
            )}

            <FormField
              control={form.control}
              name="eventDate"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Event date</FormLabel>
                  <Popover modal>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(field.value, "PPP")
                            : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 pointer-events-auto"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          if (
                            date &&
                            eventEndDate &&
                            eventEndDate < date
                          ) {
                            form.setValue("eventEndDate", undefined, {
                              shouldValidate: true,
                            });
                          }
                        }}
                        disabled={(date) => date < today}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isPerDay && (
              <FormField
                control={form.control}
                name="eventEndDate"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>End date (if multi-day event)</FormLabel>
                    <Popover modal>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, "PPP")
                              : "Optional end date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 pointer-events-auto"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < today ||
                            (eventDate ? date < eventDate : false)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="eventTimeStart"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>
                      Start time{isPerHour ? " *" : " (optional)"}
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eventTimeEnd"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>
                      End time{isPerHour ? " *" : " (optional)"}
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isPerHour && (
              <p className="text-xs text-muted-foreground -mt-2">
                Start and end time required to calculate total
              </p>
            )}

            {selectedService && !isQuote && preview && (
              <div className="rounded-md bg-muted/50 border p-3 text-sm space-y-1">
                <p className="font-medium">
                  {preview.serviceName} ? {rateLabel}
                </p>
                {isPerHour && preview.quantity > 0 && (
                  <p className="text-muted-foreground">
                    {formatQuantityLabel(
                      preview.quantity,
                      preview.quantityUnit,
                    )}{" "}
                    ? {formatCents(preview.rateCents)} ={" "}
                    {formatCents(preview.totalPriceCents)}
                  </p>
                )}
                {isPerDay && preview.quantity > 0 && (
                  <p className="text-muted-foreground">
                    {preview.quantity}{" "}
                    {preview.quantity === 1 ? "day" : "days"} ?{" "}
                    {formatCents(preview.rateCents)} ={" "}
                    {formatCents(preview.totalPriceCents)}
                  </p>
                )}
                {isPerEvent && (
                  <p className="text-muted-foreground">
                    Total: {formatCents(preview.totalPriceCents)}
                  </p>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="eventLocation"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel htmlFor="location">
                    Event location (optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="location"
                      placeholder="Venue or address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel htmlFor="notes">Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      id="notes"
                      placeholder="Share details about your event?"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedService && (
              <p className="text-base font-semibold">
                {isQuote
                  ? "Total: To be quoted by vendor"
                  : preview
                    ? `Total: ${formatCents(preview.totalPriceCents)}`
                    : "Total: ?"}
              </p>
            )}

            <TrustCues variant="card" className="mt-2" />

            <Button
              type="submit"
              className="w-full"
              disabled={
                !form.formState.isValid ||
                !idempotencyKey ||
                createMutation.isPending
              }
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending?
                </>
              ) : (
                "Send booking request"
              )}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
