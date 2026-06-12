import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useInitiateStripeOnboarding,
  useStripeStatus,
  useSyncStripeStatus,
} from "@/features/stripe/hooks";
import {
  deriveStripeConnectionStatus,
  type StripeConnectionStatus,
} from "@/features/stripe/types";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
} from "lucide-react";

type PayoutProps = {
  vendorId: string;
  userId: string;
};

function copyForStatus(status: StripeConnectionStatus): {
  title: string;
  description: string;
  primaryLabel: string | null;
  showRefresh: boolean;
  showExpressLink: boolean;
  variant: "default" | "destructive";
} {
  switch (status) {
    case "not_started":
      return {
        title: "Connect your payout account",
        description:
          "Connect your payout account to appear in search results and receive bookings.",
        primaryLabel: "Connect payout account",
        showRefresh: false,
        showExpressLink: false,
        variant: "default",
      };
    case "incomplete":
      return {
        title: "Setup incomplete",
        description:
          "Missing information — continue Stripe setup to finish connecting payouts.",
        primaryLabel: "Continue setup",
        showRefresh: false,
        showExpressLink: false,
        variant: "default",
      };
    case "pending_verification":
      return {
        title: "Under review by Stripe",
        description:
          "Stripe is verifying your account — usually 1–2 business days. Refresh status after you finish any open tasks.",
        primaryLabel: null,
        showRefresh: true,
        showExpressLink: false,
        variant: "default",
      };
    case "partially_enabled":
      return {
        title: "Additional requirements pending",
        description:
          "Charges may be enabled but payouts are not yet active. Complete remaining requirements in Stripe.",
        primaryLabel: "Complete requirements",
        showRefresh: true,
        showExpressLink: true,
        variant: "default",
      };
    case "restricted":
      return {
        title: "Account needs attention",
        description:
          "Stripe is pausing payments or payouts until you finish their requests — for example tax ID (SSN), identity documents, or other verification. Open the Express dashboard to complete what Stripe lists there.",
        primaryLabel: "Continue setup",
        showRefresh: true,
        showExpressLink: true,
        variant: "destructive",
      };
    case "fully_active":
    default:
      return {
        title: "Payouts active",
        description: "Your services are live in the marketplace.",
        primaryLabel: null,
        showRefresh: false,
        showExpressLink: true,
        variant: "default",
      };
  }
}

function statusHeadline(status: StripeConnectionStatus): string {
  switch (status) {
    case "not_started":
      return "Not connected";
    case "incomplete":
      return "Setup incomplete";
    case "pending_verification":
      return "Pending Stripe verification";
    case "partially_enabled":
      return "Partially enabled";
    case "fully_active":
      return "Payouts active";
    case "restricted":
      return "Action required";
    default:
      return "Unknown";
  }
}

export function StripePayoutStatusBadge({ vendorId }: { vendorId: string }) {
  const { data: row, isLoading } = useStripeStatus(vendorId);
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Payouts…
      </span>
    );
  }
  const status = deriveStripeConnectionStatus(row ?? null);
  if (status !== "fully_active") return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Payouts active — you&apos;re live
    </span>
  );
}

/** Full Stripe Connect + payout experience — use on the Payouts tab. */
export function VendorStripePayoutsPanel({ vendorId, userId }: PayoutProps) {
  const { data: row, isLoading } = useStripeStatus(vendorId);
  const initiate = useInitiateStripeOnboarding(vendorId, userId);
  const sync = useSyncStripeStatus(vendorId, userId);
  const [expressUrl, setExpressUrl] = React.useState<string | null>(null);

  const status = deriveStripeConnectionStatus(row ?? null);
  const copy = copyForStatus(status);
  const busy = initiate.isPending || sync.isPending;

  const goOnboarding = async () => {
    const url = await initiate.mutateAsync();
    window.location.href = url;
  };

  const doSync = async () => {
    const res = await sync.mutateAsync();
    if (res.expressLoginUrl) setExpressUrl(res.expressLoginUrl);
  };

  const openExpress = () => {
    if (expressUrl) {
      window.open(expressUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">
                  Payouts &amp; marketplace
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                  Connect Stripe so planners can find you and you can get paid.
                  You manage bank details and verification in Stripe&apos;s secure
                  flow — Book&apos;D only stores your connection status.
                </p>
              </div>
            </div>
            <div
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${status === "fully_active"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : status === "restricted"
                    ? "border-destructive/50 bg-destructive/10 text-destructive"
                    : "border-muted-foreground/30 bg-muted/50 text-muted-foreground"
                }`}
            >
              {isLoading ? "Loading…" : statusHeadline(status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert
            variant={copy.variant === "destructive" ? "destructive" : "default"}
          >
            <AlertTitle>{copy.title}</AlertTitle>
            <AlertDescription>{copy.description}</AlertDescription>
          </Alert>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Why this matters
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
              <li>
                Until payouts are active, your profile does not appear in
                marketplace browse results.
              </li>
              <li>You cannot accept booking requests until payouts are enabled.</li>
              <li>
                After Stripe verifies your account, status updates here and via
                email.
              </li>
            </ul>
          </div>

          <Separator />

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading payout status…
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                {copy.primaryLabel && (
                <Button
                  type="button"
                  size="lg"
                  disabled={busy}
                  onClick={() => void goOnboarding()}
                  className="rounded-full"
                >
                  {initiate.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {copy.primaryLabel}
                </Button>
                )}
                {copy.showRefresh && (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  disabled={busy}
                  className="rounded-full"
                  onClick={() => void doSync()}
                >
                  {sync.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Refresh status
                </Button>
                )}
                {copy.showExpressLink && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={busy && !expressUrl}
                  className="rounded-full"
                  onClick={() => {
                    if (expressUrl) openExpress();
                    else void doSync();
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {expressUrl
                    ? "Open Stripe Express dashboard"
                    : "Load Stripe dashboard link"}
                </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                Update your bank account, view payout history, and manage
                verification in your Stripe dashboard.
              </p>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}

type BannerProps = {
  vendorId: string;
  onOpenPayoutsTab: () => void;
};

/** Compact prompt — sends vendors to the Payouts tab for the full flow. */
export function StripeConnectBanner({
  vendorId,
  onOpenPayoutsTab,
}: BannerProps) {
  const { data: row, isLoading } = useStripeStatus(vendorId);
  const status = deriveStripeConnectionStatus(row ?? null);
  const copy = copyForStatus(status);

  if (isLoading) {
    return (
      <Card className="shadow-party border-primary/20 mb-4 sm:mb-6">
        <CardContent className="py-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking payout status…
        </CardContent>
      </Card>
    );
  }

  if (status === "fully_active") {
    return (
      <Card className="shadow-party border-primary/20 mb-4 sm:mb-6 bg-white/80 backdrop-blur-sm border-0">
        <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <span>
              <span className="font-medium">Payouts are active.</span> Manage
              details anytime in the Payouts tab.
            </span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full shrink-0"
            onClick={onOpenPayoutsTab}
          >
            View Payouts
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-party border-primary/20 mb-4 sm:mb-6 bg-white/80 backdrop-blur-sm border-0">
      <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {copy.variant === "destructive" ? (
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          ) : (
            <CreditCard className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-medium text-foreground text-sm sm:text-base">
              {copy.title}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {copy.description}{" "}
              <span className="hidden sm:inline">
                Open the Payouts tab for status, Stripe onboarding, and refresh.
              </span>
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          className="rounded-full shrink-0 w-full sm:w-auto"
          onClick={onOpenPayoutsTab}
        >
          Go to Payouts
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
