import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Eye, MapPin, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

interface VendorCategory {
  id: string;
  name: string;
  slug: string;
  isPrimary: boolean;
  displayOrder: number;
}

interface VendorCardProps {
  id: string;
  businessName: string;
  city: string;
  state: string;
  logoUrl: string | null;
  profileSlug: string;
  categories: VendorCategory[];
  acceptingBookings: boolean;
  unavailableUntil: string | null;
  minServicePrice: number | null;
  maxServicePrice: number | null;
  onViewVendor?: (vendorId: string) => void;
}

const VendorCard = ({
  id,
  businessName,
  city,
  state,
  logoUrl,
  profileSlug,
  categories,
  acceptingBookings,
  unavailableUntil,
  minServicePrice,
  maxServicePrice,
  onViewVendor
}: VendorCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const primaryCategory = categories.find(cat => cat.isPrimary);
  const secondaryCategories = categories
    .filter(cat => !cat.isPrimary)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const getPriceDisplay = () => {
    if (minServicePrice) {
      return `Starting from $${minServicePrice}`;
    }
    return "Contact for pricing";
  };

  const location = `${city}, ${state}`;

  const handleViewClick = () => {
    onViewVendor?.(id);
  };

  return (
    <Card
      className="group relative flex flex-col overflow-hidden rounded-xl border-0 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/2] overflow-hidden bg-gray-100">
        <img
          src={logoUrl || "/placeholder.svg"}
          alt={businessName}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={e => (e.currentTarget.src = "/placeholder.svg")}
        />

        {/* Booking Status Badge */}
        <div
          className={`absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-white shadow-md sm:text-xs ${acceptingBookings ? "bg-green-600" : "bg-red-600"
            }`}
        >
          {acceptingBookings ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          <span className="hidden sm:inline">
            {acceptingBookings ? "Accepting" : "Unavailable"}
          </span>
        </div>

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-opacity duration-300">
            <Button
              onClick={handleViewClick}
              className="hidden sm:flex scale-100 transform bg-[#8BC34A] px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-[#7CB342] active:scale-95"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {/* Top Row: Title + Rating */}
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="line-clamp-2 text-base font-bold leading-tight text-gray-900 sm:text-lg">
              {businessName}
            </h3>

            <p className="mt-0.5 text-sm font-medium text-gray-600">
              {primaryCategory?.name || "Service Provider"}
            </p>
          </div>

          {/* Rating - Right side */}
          <div className="flex items-center rounded bg-yellow-50 px-2 py-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="ml-1.5 text-sm font-bold text-gray-800">4.8</span>
            <span className="ml-1 text-xs text-gray-500">(24)</span>
          </div>
        </div>

        {/* Location */}
        <div className="mb-3 flex items-center text-sm text-gray-600">
          <MapPin className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
          <span className="truncate">{location}</span>
        </div>

        {/* Secondary Categories */}
        {secondaryCategories.length > 0 && (
          <div className="mb-3">
            <div
              className="inline-flex cursor-help items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-200"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              +{secondaryCategories.length} more categories
            </div>

            {showTooltip && (
              <div className="absolute z-10 mt-1 rounded-lg bg-gray-900 p-2.5 text-xs text-white shadow-xl">
                {secondaryCategories.map(cat => (
                  <div key={cat.id} className="py-0.5">
                    {cat.name}
                  </div>
                ))}
                <div className="absolute -top-2 left-4 h-0 w-0 border-l-6 border-r-6 border-b-6 border-transparent border-b-gray-900" />
              </div>
            )}
          </div>
        )}

        {/* Price + CTA space */}
        <div className="mt-auto">
          <div className="mb-3 text-lg font-bold text-[#8BC34A]">
            {getPriceDisplay()}
          </div>

          {/* Mobile-only View button (hidden on hover overlay) */}
          <Button
            variant="outline"
            size="sm"
            className="w-full border-[#8BC34A] text-[#8BC34A] hover:bg-[#8BC34A]/10 sm:hidden"
            onClick={handleViewClick}
          >
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default VendorCard;