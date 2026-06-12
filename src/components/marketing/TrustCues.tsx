import { BadgeCheck, Lock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrustCuesVariant = "compact" | "card";

interface TrustCuesProps {
  variant?: TrustCuesVariant;
  className?: string;
  /** Show Stripe wordmark row (for payment/booking CTAs) */
  showStripe?: boolean;
}

function StripeWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold tracking-tight",
        className,
      )}
    >
      <span className="text-muted-foreground font-normal">Payments by</span>
      <span className="text-[#635BFF]">Stripe</span>
    </span>
  );
}

export function TrustCues({
  variant = "compact",
  className,
  showStripe = true,
}: TrustCuesProps) {
  const items = [
    {
      icon: BadgeCheck,
      label: "Verified vendors",
      className: "text-emerald-700",
      iconClass: "text-emerald-600",
    },
    {
      icon: Shield,
      label: "Secure checkout",
      className: "text-foreground",
      iconClass: "text-primary",
    },
    {
      icon: Lock,
      label: "Encrypted payments",
      className: "text-foreground",
      iconClass: "text-muted-foreground",
    },
  ] as const;

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-xl border border-border/80 bg-muted/30 px-4 py-3 space-y-3",
          className,
        )}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {items.map(({ icon: Icon, label, iconClass, className: textClass }) => (
            <span
              key={label}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium",
                textClass,
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 shrink-0", iconClass)} />
              {label}
            </span>
          ))}
        </div>
        {showStripe && (
          <div className="flex justify-center pt-1 border-t border-border/60">
            <StripeWordmark />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground",
        className,
      )}
    >
      {items.map(({ icon: Icon, label, iconClass }) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <Icon className={cn("h-3.5 w-3.5", iconClass)} />
          <span>{label}</span>
        </span>
      ))}
      {showStripe && (
        <>
          <span className="hidden sm:inline text-border">|</span>
          <StripeWordmark />
        </>
      )}
    </div>
  );
}
