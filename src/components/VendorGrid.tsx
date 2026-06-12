import React from 'react';
import { Loader2 } from 'lucide-react';
import VendorCard from './VendorCard';

interface VendorCategory {
  id: string;
  name: string;
  slug: string;
  isPrimary: boolean;
  displayOrder: number;
}

interface VendorListItem {
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
}

interface VendorGridProps {
  vendors: VendorListItem[];
  loading: boolean;
  onViewVendor: (vendorId: string) => void;
}

// Loading Spinner Component
const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} style={{ color: '#8BC34A' }} />
  );
};

export const VendorGrid: React.FC<VendorGridProps> = ({ vendors, loading, onViewVendor }) => {
  if (loading) {
    return (
      <div className="flex flex-col sm:flex-row justify-center items-center py-12 gap-3">
        <LoadingSpinner size="lg" />
        <span className="text-sm sm:text-base text-gray-600">Loading vendors...</span>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No vendors found</h3>
        <p className="text-sm sm:text-base text-gray-600">Try adjusting your search criteria to find vendors.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
      {vendors.map((vendor) => (
        <VendorCard
          key={vendor.id}
          id={vendor.id}
          businessName={vendor.businessName}
          city={vendor.city}
          state={vendor.state}
          logoUrl={vendor.logoUrl}
          profileSlug={vendor.profileSlug}
          categories={vendor.categories}
          acceptingBookings={vendor.acceptingBookings}
          unavailableUntil={vendor.unavailableUntil}
          minServicePrice={vendor.minServicePrice}
          maxServicePrice={vendor.maxServicePrice}
          onViewVendor={onViewVendor}
        />
      ))}
    </div>
  );
};