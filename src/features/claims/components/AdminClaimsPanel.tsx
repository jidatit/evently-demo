import { ChevronDown, ClipboardList, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAdminClaims } from "../hooks";
import { ClaimReviewCard } from "./ClaimReviewCard";

export function AdminClaimsPanel() {
  const { data: claims = [], isLoading, isError, error } = useAdminClaims();

  const unresolved = claims.filter((c) => c.status === "under_review");
  const resolved = claims.filter((c) => c.status !== "under_review");

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-8 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading claims…
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-8 text-center text-red-700">
          {error instanceof Error ? error.message : "Failed to load claims"}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Claims awaiting review
          {unresolved.length > 0 && (
            <span className="rounded-full bg-amber-100 text-amber-900 text-xs font-medium px-2 py-0.5">
              {unresolved.length}
            </span>
          )}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Approve to issue a full Stripe refund, or deny to allow the booking to
          complete normally.
        </p>

        {unresolved.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-8 text-center text-muted-foreground">
              No claims awaiting review.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {unresolved.map((claim) => (
              <ClaimReviewCard key={claim.id} claim={claim} />
            ))}
          </div>
        )}
      </div>

      {resolved.length > 0 && (
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground w-full">
            <ChevronDown className="h-4 w-4" />
            Resolved claims ({resolved.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 grid gap-4">
            {resolved.map((claim) => (
              <ClaimReviewCard key={claim.id} claim={claim} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
