import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BookDLogo from "@/components/BookDLogo";
import { cn } from "@/lib/utils";

export type DashboardAppRole = "customer" | "vendor" | "admin";

interface DashboardAppHeaderProps {
  role: DashboardAppRole;
  onLogout: () => void | Promise<void>;
  vendorSlug?: string | null;
  /** e.g. Stripe payout badge on vendor dashboard */
  trailing?: ReactNode;
  className?: string;
}

function NavLink({
  to,
  children,
  external,
  disabled,
}: {
  to: string;
  children: ReactNode;
  external?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="text-sm font-medium text-muted-foreground/50 cursor-not-allowed">
        {children}
      </span>
    );
  }

  return (
    <Link
      to={to}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground",
        "hover:text-primary transition-colors",
      )}
    >
      {children}
      {external && <ExternalLink className="h-3.5 w-3.5 opacity-70" />}
    </Link>
  );
}

export function DashboardAppHeader({
  role,
  onLogout,
  vendorSlug,
  trailing,
  className,
}: DashboardAppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className,
      )}
    >
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between gap-3 px-4">
        <Link
          to="/"
          className="shrink-0 hover:opacity-90 transition-opacity"
          aria-label="Evently home"
        >
          <BookDLogo size="sm" showSparkle={false} />
        </Link>

        <nav
          className="hidden sm:flex items-center gap-5 md:gap-6"
          aria-label="Dashboard navigation"
        >
          {role === "customer" && (
            <>
              <NavLink to="/browse">
                <Search className="h-4 w-4" />
                Browse vendors
              </NavLink>
              <NavLink to="/dashboard?tab=favorites">
                <Star className="h-4 w-4" />
                Favorites
              </NavLink>
            </>
          )}
          {role === "vendor" && (
            <>
              <NavLink
                to={vendorSlug ? `/v/${vendorSlug}` : "#"}
                external
                disabled={!vendorSlug}
              >
                View public profile
              </NavLink>
              <NavLink to="/vendor-dashboard?tab=services">
                <Package className="h-4 w-4" />
                Services
              </NavLink>
            </>
          )}
          {role === "admin" && (
            <>
              <NavLink to="/admin-dashboard?tab=overview">
                <LayoutDashboard className="h-4 w-4" />
                Overview
              </NavLink>
              <NavLink to="/admin-dashboard?tab=claims">
                <ClipboardList className="h-4 w-4" />
                Claims
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {trailing}

          {/* Mobile: compact links */}
          <div className="flex sm:hidden items-center gap-1">
            {role === "customer" && (
              <Button variant="ghost" size="sm" asChild className="h-9 px-2">
                <Link to="/browse">
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Browse vendors</span>
                </Link>
              </Button>
            )}
            {role === "vendor" && vendorSlug && (
              <Button variant="ghost" size="sm" asChild className="h-9 px-2">
                <Link to={`/v/${vendorSlug}`} target="_blank" rel="noopener">
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">View public profile</span>
                </Link>
              </Button>
            )}
            {role === "admin" && (
              <Button variant="ghost" size="sm" asChild className="h-9 px-2">
                <Link to="/admin-dashboard?tab=claims">
                  <ClipboardList className="h-4 w-4" />
                  <span className="sr-only">Claims</span>
                </Link>
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full border-2 h-9"
            onClick={() => void onLogout()}
          >
            <LogOut className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
