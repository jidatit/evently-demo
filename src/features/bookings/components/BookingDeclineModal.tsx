import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDeclineBooking } from "../hooks";

const COMMON_REASONS = [
  "Date unavailable",
  "Outside service area",
  "Service no longer available",
  "Schedule conflict",
  "Other",
] as const;

interface BookingDeclineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  vendorId?: string;
}

export function BookingDeclineModal({
  open,
  onOpenChange,
  bookingId,
  vendorId,
}: BookingDeclineModalProps) {
  const [preset, setPreset] = useState<string>(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const declineMutation = useDeclineBooking(vendorId);

  const reason = preset === "Other" ? customReason.trim() : preset;

  const handleSubmit = async () => {
    if (!reason) return;
    await declineMutation.mutateAsync({ bookingId, reason });
    onOpenChange(false);
    setPreset(COMMON_REASONS[0]);
    setCustomReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Decline booking request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={preset} onValueChange={setPreset}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMON_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {preset === "Other" && (
            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Tell the planner why you cannot accept…"
                rows={3}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!reason || declineMutation.isPending}
            onClick={() => void handleSubmit()}
          >
            {declineMutation.isPending ? "Declining…" : "Decline booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

