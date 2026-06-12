import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, MapPin, DollarSign, Calendar, X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useCategories } from '@/features/category/hooks';
import {
  getStateOptions,
  getCityOptions,
} from '@/utils/locationData';
import { PRICE_RANGE_OPTIONS, AVAILABILITY_OPTIONS } from '@/features/browse-vendors/types';

interface FilterBarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedState: string;
  onStateChange: (state: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectedPriceRange: string;
  onPriceRangeChange: (priceRange: string) => void;
  selectedAvailability: string;
  onAvailabilityChange: (availability: string) => void;
  children?: React.ReactNode; // For SearchBar
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  onCategoryChange,
  selectedState,
  onStateChange,
  selectedCity,
  onCityChange,
  selectedPriceRange,
  onPriceRangeChange,
  selectedAvailability,
  onAvailabilityChange,
  children,
}) => {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const [isExpanded, setIsExpanded] = useState(true);

  const stateOptions = getStateOptions();
  const cityOptions = getCityOptions(selectedState);

  // Reset city when state changes
  useEffect(() => {
    if (selectedState === 'all' && selectedCity !== 'all') {
      onCityChange('all');
    }
  }, [selectedState, selectedCity, onCityChange]);

  const handleStateChange = (value: string) => {
    onStateChange(value);
    if (value === 'all') {
      onCityChange('all');
    }
  };

  // Check if any filters are active
  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedState !== 'all' ||
    selectedCity !== 'all' ||
    selectedPriceRange !== 'all' ||
    selectedAvailability !== 'all';

  // Count active filters
  const activeFilterCount = [
    selectedCategory !== 'all',
    selectedState !== 'all',
    selectedCity !== 'all',
    selectedPriceRange !== 'all',
    selectedAvailability !== 'all',
  ].filter(Boolean).length;

  // Reset all filters
  const handleResetAll = () => {
    onCategoryChange('all');
    onStateChange('all');
    onCityChange('all');
    onPriceRangeChange('all');
    onAvailabilityChange('all');
  };

  // Get display label for selected value
  const getCategoryLabel = () => {
    if (selectedCategory === 'all') return 'Category';
    const category = categories?.find(c => c.id === selectedCategory);
    return category?.name || 'Category';
  };

  const getStateLabel = () => {
    if (selectedState === 'all') return 'State';
    const state = stateOptions.find(s => s.value === selectedState);
    return state?.label || 'State';
  };

  const getCityLabel = () => {
    if (selectedCity === 'all') return 'City';
    const city = cityOptions.find(c => c.value === selectedCity);
    return city?.label || 'City';
  };

  const getPriceLabel = () => {
    if (selectedPriceRange === 'all') return 'Budget';
    const price = PRICE_RANGE_OPTIONS.find(p => p.value === selectedPriceRange);
    return price?.label || 'Budget';
  };

  const getAvailabilityLabel = () => {
    if (selectedAvailability === 'all') return 'Availability';
    const availability = AVAILABILITY_OPTIONS.find(a => a.value === selectedAvailability);
    return availability?.label || 'Availability';
  };

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Fixed Header - Always visible with consistent height */}
        <div className="flex items-center justify-between py-3 sm:py-4 min-h-[56px]">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 transition-colors group"
          >
            <Filter className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
            <span className="font-semibold">Filters & Search</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 bg-primary text-white text-xs font-medium rounded-full">
                {activeFilterCount}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleResetAll}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset All</span>
              <span className="sm:hidden">Reset</span>
            </button>
          )}
        </div>

        {/* Collapsible Filters & Search Section - Smooth animation with fixed container */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded
            ? 'max-h-[1000px] opacity-100 pb-3 sm:pb-4'
            : 'max-h-0 opacity-0 pb-0'
            }`}
          style={{
            transitionProperty: 'max-height, opacity, padding-bottom',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'max-height, opacity',
          }}
        >
          {/* Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-3 pt-1">
            {/* Category Filter */}
            <div className="relative group">
              <Select value={selectedCategory} onValueChange={onCategoryChange}>
                <SelectTrigger
                  className={`w-full h-10 transition-all outline-none ring-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-none focus-visible:ring-0 focus-visible:outline-none ${selectedCategory !== 'all'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                  <SelectValue placeholder="Category">
                    <span className="truncate">{getCategoryLabel()}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoriesLoading && (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  )}
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => onCategoryChange('all')}
                  className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-primary/20 rounded-full transition-colors z-10"
                  aria-label="Clear category filter"
                >
                  <X className="h-3.5 w-3.5 text-gray-500" />
                </button>
              )}
            </div>

            {/* State Filter */}
            <div className="relative group">
              <Select value={selectedState} onValueChange={handleStateChange}>
                <SelectTrigger
                  className={`w-full h-10 transition-all outline-none ring-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-none focus-visible:ring-0 focus-visible:outline-none ${selectedState !== 'all'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                  <div className="flex items-center w-full">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500" />
                    <SelectValue placeholder="State">
                      <span className="truncate">{getStateLabel()}</span>
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {stateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedState !== 'all' && (
                <button
                  onClick={() => handleStateChange('all')}
                  className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-primary/20 rounded-full transition-colors z-10"
                  aria-label="Clear state filter"
                >
                  <X className="h-3.5 w-3.5 text-gray-500" />
                </button>
              )}
            </div>

            {/* City Filter */}
            <div className="relative group">
              <Select
                value={selectedCity}
                onValueChange={onCityChange}
                disabled={selectedState === 'all'}
              >
                <SelectTrigger
                  className={`w-full h-10 transition-all outline-none ring-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-none focus-visible:ring-0 focus-visible:outline-none ${selectedCity !== 'all'
                    ? 'border-primary bg-primary/10'
                    : selectedState === 'all'
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                  <div className="flex items-center w-full">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500" />
                    <SelectValue placeholder="City">
                      <span className="truncate">{getCityLabel()}</span>
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {cityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCity !== 'all' && selectedState !== 'all' && (
                <button
                  onClick={() => onCityChange('all')}
                  className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-primary/20 rounded-full transition-colors z-10"
                  aria-label="Clear city filter"
                >
                  <X className="h-3.5 w-3.5 text-gray-500" />
                </button>
              )}
            </div>

            {/* Price Range Filter */}
            <div className="relative group">
              <Select value={selectedPriceRange} onValueChange={onPriceRangeChange}>
                <SelectTrigger
                  className={`w-full h-10 transition-all outline-none ring-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-none focus-visible:ring-0 focus-visible:outline-none ${selectedPriceRange !== 'all'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                  <div className="flex items-center w-full">
                    <DollarSign className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500" />
                    <SelectValue placeholder="Budget">
                      <span className="truncate">{getPriceLabel()}</span>
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPriceRange !== 'all' && (
                <button
                  onClick={() => onPriceRangeChange('all')}
                  className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-primary/20 rounded-full transition-colors z-10"
                  aria-label="Clear price filter"
                >
                  <X className="h-3.5 w-3.5 text-gray-500" />
                </button>
              )}
            </div>

            {/* Availability Filter */}
            <div className="relative group col-span-2 sm:col-span-1">
              <Select
                value={selectedAvailability}
                onValueChange={onAvailabilityChange}
              >
                <SelectTrigger
                  className={`w-full h-10 transition-all outline-none ring-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-none focus-visible:ring-0 focus-visible:outline-none ${selectedAvailability !== 'all'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                  <div className="flex items-center w-full">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500" />
                    <SelectValue placeholder="Availability">
                      <span className="truncate">{getAvailabilityLabel()}</span>
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAvailability !== 'all' && (
                <button
                  onClick={() => onAvailabilityChange('all')}
                  className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-primary/20 rounded-full transition-colors z-10"
                  aria-label="Clear availability filter"
                >
                  <X className="h-3.5 w-3.5 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {/* Active Filters Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-3 pb-3 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium self-center">Active:</span>
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 text-xs rounded-full">
                  {getCategoryLabel()}
                  <button
                    onClick={() => onCategoryChange('all')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedState !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 text-xs rounded-full">
                  {getStateLabel()}
                  <button
                    onClick={() => handleStateChange('all')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedCity !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 text-xs rounded-full">
                  {getCityLabel()}
                  <button
                    onClick={() => onCityChange('all')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedPriceRange !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 text-xs rounded-full">
                  {getPriceLabel()}
                  <button
                    onClick={() => onPriceRangeChange('all')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedAvailability !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 text-xs rounded-full">
                  {getAvailabilityLabel()}
                  <button
                    onClick={() => onAvailabilityChange('all')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Search Bar Section */}
          {children && (
            <div className="border-t border-gray-100 pt-3">
              {children}
            </div>
          )}
        </div>

        {/* Collapsed State Summary - Only show active filters when collapsed */}
        {!isExpanded && hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pb-3 sm:pb-4 pt-1 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium self-center">Active:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 text-xs rounded-full">
                {getCategoryLabel()}
              </span>
            )}
            {selectedState !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 text-xs rounded-full">
                {getStateLabel()}
              </span>
            )}
            {selectedCity !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 text-xs rounded-full">
                {getCityLabel()}
              </span>
            )}
            {selectedPriceRange !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 text-xs rounded-full">
                {getPriceLabel()}
              </span>
            )}
            {selectedAvailability !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 text-xs rounded-full">
                {getAvailabilityLabel()}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};