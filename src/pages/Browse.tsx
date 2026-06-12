// src/pages/Browse.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { VendorGrid } from '@/components/VendorGrid';
import { FilterBar } from '@/components/FilterBar';
import { SearchBar } from '@/components/SearchBar';
import { CategoryBanner } from '@/components/CategoryBanner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useVendorBrowseData } from '@/features/browse-vendors/hooks';
import { convertToApiFilters, sanitizeSearchTerm } from '@/features/browse-vendors/utils';
import type { VendorFilterOptions } from '@/features/browse-vendors/types';

const VENDORS_PER_PAGE = 12;

const Browse: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  // Filter state
  const [filterOptions, setFilterOptions] = useState<VendorFilterOptions>({
    searchTerm: '',
    selectedCategory: 'all',
    selectedState: 'all',
    selectedCity: 'all',
    selectedPriceRange: 'all',
    selectedAvailability: 'all',
  });

  // Initialize filters from URL params
  useEffect(() => {
    const category = searchParams.get('category');
    const state = searchParams.get('state');
    const city = searchParams.get('city');

    if (category || state || city) {
      setFilterOptions((prev) => ({
        ...prev,
        ...(category && { selectedCategory: category }),
        ...(state && { selectedState: state }),
        ...(city && { selectedCity: city }),
      }));
    }
  }, [searchParams]);

  // Convert UI filters to API format
  const apiFilters = convertToApiFilters(filterOptions, VENDORS_PER_PAGE);

  // Fetch vendors with infinite query
  const {
    vendors,
    totalCount,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useVendorBrowseData(apiFilters);


  // Handle search term change with sanitization
  const handleSearchChange = (value: string) => {
    const sanitized = sanitizeSearchTerm(value);
    setFilterOptions((prev) => ({
      ...prev,
      searchTerm: sanitized,
    }));
  };

  // Handle filter changes
  const handleCategoryChange = (value: string) => {
    setFilterOptions((prev) => ({ ...prev, selectedCategory: value }));
  };

  const handleStateChange = (value: string) => {
    setFilterOptions((prev) => ({ ...prev, selectedState: value }));
  };

  const handleCityChange = (value: string) => {
    setFilterOptions((prev) => ({ ...prev, selectedCity: value }));
  };

  const handlePriceRangeChange = (value: string) => {
    setFilterOptions((prev) => ({ ...prev, selectedPriceRange: value }));
  };

  const handleAvailabilityChange = (value: string) => {
    setFilterOptions((prev) => ({ ...prev, selectedAvailability: value }));
  };

  // Handle vendor navigation
  const handleViewVendor = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (vendor?.profileSlug) {
      navigate(`/v/${vendor.profileSlug}`);
    } else {
      navigate(`/vendor/${vendorId}`);
    }
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Fixed height for consistency */}
      <header className="bg-primary shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-5">
          <div className="relative flex items-center justify-between min-h-[40px] sm:min-h-[56px]">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/20 -ml-1 sm:-ml-2 px-2 sm:px-3 py-1 sm:py-2 text-sm sm:text-base"
            >
              <ArrowLeft className="h-4 w-4 mr-1 sm:h-6 sm:w-6 sm:mr-2" />
              <span className="hidden xs:inline">Back</span>
            </Button>

            {/* Responsive: reduce font and spacing on mobile */}
            <h1 className="text-lg xs:text-xl sm:text-3xl font-bold text-white font-heading absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
              Browse Vendors
            </h1>

            {/* Invisible/empty spacer for symmetry */}
            <div className="w-[48px] xs:w-[72px] sm:w-[140px]" />
          </div>
        </div>
      </header>

      {/* Sticky Filter Section - Fixed positioning for stability */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <FilterBar
          selectedCategory={filterOptions.selectedCategory}
          onCategoryChange={handleCategoryChange}
          selectedState={filterOptions.selectedState}
          onStateChange={handleStateChange}
          selectedCity={filterOptions.selectedCity}
          onCityChange={handleCityChange}
          selectedPriceRange={filterOptions.selectedPriceRange}
          onPriceRangeChange={handlePriceRangeChange}
          selectedAvailability={filterOptions.selectedAvailability}
          onAvailabilityChange={handleAvailabilityChange}
        >
          {/* Pass SearchBar as children */}
          <SearchBar
            searchTerm={filterOptions.searchTerm}
            onSearchChange={handleSearchChange}
            onSearch={() => { }}
          />
        </FilterBar>
      </div>
      {/* Main Content */}
      <main
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24"
        style={{ scrollPaddingTop: '140px' }} // ← IMPORTANT: compensate for sticky header + filter
      >
        {/* Results count + loading state */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          {!isLoading && (
            <p className="text-sm text-gray-600">
              {totalCount === 0
                ? 'No vendors found'
                : `Showing ${vendors.length} of ${totalCount} vendor${totalCount !== 1 ? 's' : ''}`}
            </p>
          )}

          {/* Optional: Filters summary chips on desktop */}
          {/* {showFilterSummary && <ActiveFilters ... />} */}
        </div>

        {/* Error */}
        {error && (
          <div className="text-center py-16">
            <p className="text-lg text-red-600 mb-6">Something went wrong</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Vendors */}
        {!error && (
          <VendorGrid
            vendors={vendors}
            loading={isLoading}
            onViewVendor={handleViewVendor}
          />
        )}

        {/* Load More / End of results */}
        {!isLoading && !error && vendors.length > 0 && (
          <div className="mt-10 text-center">
            {hasNextPage ? (
              <Button
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
                className={`
                bg-primary hover:bg-primary/90 text-primary-foreground 
                font-medium rounded-lg px-8 py-3 transition-all
                ${isMobile ? 'fixed bottom-4 left-4 right-4 z-50 shadow-lg max-w-md mx-auto' : ''}
              `}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Vendors'
                )}
              </Button>
            ) : (
              <p className="text-gray-500 py-12 text-sm">
                You've reached the end of the list
              </p>
            )}
          </div>
        )}

        {/* Extra bottom padding when Load More is fixed on mobile */}
        {isMobile && hasNextPage && !isLoading && (
          <div className="h-[100px] sm:h-0" />
        )}
      </main>
    </div>
  );
};

export default Browse;