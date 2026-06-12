
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  DollarSign, 
  Calendar,
  Filter,
  Grid3X3,
  Map as MapIcon,
  Crown,
  Award,
  Users,
  Heart
} from 'lucide-react';
import { getPublicVendors } from '@/lib/secure-vendor-queries';
import { Link } from 'react-router-dom';

interface Vendor {
  id: string;
  business_name: string;
  category: string;
  description: string;
  location: string;
  logo_url: string;
  created_at: string;
  services: any[];
  vendor_media: any[];
}

interface SearchFilters {
  searchTerm: string;
  category: string;
  location: string;
  budgetRange: string;
  availability: string;
  rating: string;
}

const CATEGORIES = [
  'Photography', 'Catering', 'Music', 'Decoration', 'Planning', 
  'Venue', 'Transportation', 'Flowers', 'Entertainment', 'Other'
];

const US_CITIES = [
  { value: 'new-york', label: 'New York, NY' },
  { value: 'los-angeles', label: 'Los Angeles, CA' },
  { value: 'chicago', label: 'Chicago, IL' },
  { value: 'houston', label: 'Houston, TX' },
  { value: 'miami', label: 'Miami, FL' },
  { value: 'san-francisco', label: 'San Francisco, CA' },
  { value: 'seattle', label: 'Seattle, WA' },
  { value: 'austin', label: 'Austin, TX' },
  { value: 'denver', label: 'Denver, CO' },
  { value: 'atlanta', label: 'Atlanta, GA' }
];

const BUDGET_RANGES = [
  { value: 'under-500', label: 'Under $500' },
  { value: '500-1000', label: '$500 - $1,000' },
  { value: '1000-2500', label: '$1,000 - $2,500' },
  { value: '2500-5000', label: '$2,500 - $5,000' },
  { value: '5000-10000', label: '$5,000 - $10,000' },
  { value: 'over-10000', label: 'Over $10,000' }
];

const FEATURED_VENDORS = [
  {
    id: '1',
    business_name: 'Elite Photography Studio',
    category: 'Photography',
    description: 'Award-winning wedding and event photography with 10+ years experience.',
    location: 'New York, NY',
    logo_url: '/placeholder.svg',
    rating: 4.9,
    reviews: 156,
    price: 'Starting from $2,500',
    badges: ['Featured', 'Top Rated', 'Premium']
  },
  {
    id: '2',
    business_name: 'Gourmet Catering Co.',
    category: 'Catering',
    description: 'Luxury catering services for weddings and corporate events.',
    location: 'Los Angeles, CA',
    logo_url: '/placeholder.svg',
    rating: 4.8,
    reviews: 203,
    price: 'Starting from $45/person',
    badges: ['Featured', 'Premium', 'Verified']
  }
];

export const AdvancedVendorSearch: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    category: 'all',
    location: 'all',
    budgetRange: 'all',
    availability: 'all',
    rating: 'all'
  });

  useEffect(() => {
    fetchVendors();
  }, [filters]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const { data } = await getPublicVendors({
        category: filters.category !== 'all' ? filters.category : undefined,
        searchTerm: filters.searchTerm || undefined,
        limit: 20
      });
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      category: 'all',
      location: 'all',
      budgetRange: 'all',
      availability: 'all',
      rating: 'all'
    });
  };

  const VendorCard = ({ vendor, isFeatured = false }: { vendor: any; isFeatured?: boolean }) => (
    <Card className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
      isFeatured ? 'ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5' : ''
    }`}>
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
          <img 
            src={vendor.logo_url || '/placeholder.svg'}
            alt={vendor.business_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {isFeatured && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                <Crown className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            </div>
          )}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            {vendor.badges?.map((badge: string) => (
              <Badge key={badge} variant="secondary" className="text-xs">
                {badge === 'Top Rated' && <Award className="w-3 h-3 mr-1" />}
                {badge === 'Premium' && <Star className="w-3 h-3 mr-1" />}
                {badge === 'Verified' && <Users className="w-3 h-3 mr-1" />}
                {badge}
              </Badge>
            ))}
          </div>
        </div>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                {vendor.business_name}
              </h3>
              <Badge variant="outline" className="mt-1">
                {vendor.category}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500">
              <Heart className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1 mb-3">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{vendor.rating || 4.5}</span>
            <span className="text-sm text-gray-500">({vendor.reviews || 0} reviews)</span>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {vendor.description}
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{vendor.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Quick Response</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="font-bold text-primary text-lg">
              {vendor.price || 'Contact for pricing'}
            </div>
            <Link to={`/vendor/${vendor.id}`}>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                View Details
              </Button>
            </Link>
          </div>
        </CardContent>
      </div>
    </Card>
  );

  const MapView = () => (
    <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <MapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Interactive Map View</h3>
        <p className="text-gray-500">Map integration coming soon</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Find Your Perfect Vendor
          </h1>
          <p className="text-gray-600 text-lg">
            Discover amazing vendors for your event with advanced search and filtering
          </p>
        </div>

        {/* Advanced Search Filters */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Main Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search vendors, services, or keywords..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              {/* Category Filter */}
              <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Budget Filter */}
              <Select value={filters.budgetRange} onValueChange={(value) => updateFilter('budgetRange', value)}>
                <SelectTrigger className="h-12">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Budget</SelectItem>
                  {BUDGET_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Secondary Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filters:</span>
              </div>

              {/* Location Filter */}
              <Select value={filters.location} onValueChange={(value) => updateFilter('location', value)}>
                <SelectTrigger className="w-48">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All Locations</SelectItem>
                  {US_CITIES.map((city) => (
                    <SelectItem key={city.value} value={city.value}>
                      {city.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Availability Filter */}
              <Select value={filters.availability} onValueChange={(value) => updateFilter('availability', value)}>
                <SelectTrigger className="w-44">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Time</SelectItem>
                  <SelectItem value="available">Available Now</SelectItem>
                  <SelectItem value="weekend">Weekend Only</SelectItem>
                  <SelectItem value="weekday">Weekday Only</SelectItem>
                </SelectContent>
              </Select>

              {/* Rating Filter */}
              <Select value={filters.rating} onValueChange={(value) => updateFilter('rating', value)}>
                <SelectTrigger className="w-36">
                  <Star className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Rating</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {vendors.length + FEATURED_VENDORS.length} vendors found
            </span>
          </div>
          
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'map')}>
            <TabsList>
              <TabsTrigger value="grid" className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" />
                Grid View
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapIcon className="w-4 h-4" />
                Map View
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Results */}
        {viewMode === 'grid' ? (
          <div className="space-y-8">
            {/* Featured Vendors Section */}
            {FEATURED_VENDORS.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Crown className="w-6 h-6 text-amber-500" />
                  <h2 className="text-2xl font-bold text-gray-900">Featured Vendors</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {FEATURED_VENDORS.map((vendor) => (
                    <VendorCard key={vendor.id} vendor={vendor} isFeatured />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Vendors */}
            {vendors.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">All Vendors</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vendors.map((vendor) => (
                    <VendorCard key={vendor.id} vendor={vendor} />
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!loading && vendors.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No vendors found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search criteria or filters</p>
                <Button onClick={clearFilters} variant="outline">
                  Clear All Filters
                </Button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-[4/3] bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <MapView />
        )}
      </div>
    </div>
  );
};
