import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VendorSummary } from "../types";

export interface MessagesVendorMiniHeaderProps {
  vendor: VendorSummary;
  eyebrow?: string;
  /** `embedded` = compact strip for ThreadDrawer; `card` = full card (e.g. standalone). */
  variant?: "card" | "embedded";
}

export function MessagesVendorMiniHeader({
  vendor,
  eyebrow,
  variant = "card",
}: MessagesVendorMiniHeaderProps) {
  const slug = vendor.profileSlug?.trim();
  const publicUrl = slug ? `/v/${slug}` : null;

  const inner = (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        variant === "embedded" ? "py-3" : "",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <img
          src={vendor.logoUrl || "/placeholder.svg"}
          alt={vendor.businessName}
          className={cn(
            "shrink-0 rounded-full border-2 border-primary/20 object-cover",
            variant === "embedded" ? "h-12 w-12" : "h-14 w-14",
          )}
        />
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h2
            className={cn(
              "truncate font-semibold text-foreground",
              variant === "embedded" ? "text-base" : "text-lg",
            )}
          >
            {vendor.businessName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {vendor.city}, {vendor.state}
          </p>
        </div>
      </div>
      {publicUrl && (
        <Button variant="outline" size="sm" className="shrink-0 gap-2" asChild>
          <Link to={publicUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            View public profile
          </Link>
        </Button>
      )}
    </div>
  );

  if (variant === "embedded") {
    return (
      <div className="border-b border-border bg-muted/30 px-4">{inner}</div>
    );
  }

  return (
    <Card className="border-0 bg-white/80 shadow-md backdrop-blur-sm">
      <CardContent className="p-4 sm:p-5">{inner}</CardContent>
    </Card>
  );
}