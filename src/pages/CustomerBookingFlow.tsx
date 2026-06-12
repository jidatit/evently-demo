
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Search, MapPin, Star, Filter, Heart, Clock, DollarSign } from 'lucide-react';
import { getPublicVendorsUltraSecure } from '@/lib/ultra-secure-vendor-queries';
import { Link } from 'react-router-dom';
import { SaveVendorButton } from '@/components/SaveVendorButton';

interface Vendor {
  id: string;
  business_name: string;
  category: string;
  description: string;
  location: string;
  logo_url: string;
  created_at: string;
  services?: Array<{
    id: string;
    name: string;
    price?: number;
    duration_minutes?: number;
  }>;
}

export const CustomerBookingFlow: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    'all', 'photography', 'catering', 'music', 'decoration', 'planning', 'venue', 'transportation', 'beauty', 'entertainment'
  ];

  const locations = [
    'all', 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas'
  ];

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    filterVendors();
  }, [vendors, searchTerm, selectedCategory, selectedLocation, priceRange]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const { data } = await getPublicVendorsUltraSecure({
        limit: 50
      });
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const filterVendors = () => {
    let filtered = vendors;

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(vendor => 
        vendor.business_name.toLowerCase().includes(search) ||
        vendor.description?.toLowerCase().includes(search) ||
        vendor.category.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(vendor => vendor.category === selectedCategory);
    }

    // Location filter
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(vendor => 
        vendor.location?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Price filter (based on services if available)
    filtered = filtered.filter(vendor => {
      if (!vendor.services || vendor.services.length === 0) return true;
      const minPrice = Math.min(...vendor.services.map(s => s.price || 0));
      const maxPrice = Math.max(...vendor.services.map(s => s.price || 0));
      return maxPrice >= priceRange[0] && minPrice <= priceRange[1];
    });

    setFilteredVendors(filtered);
  };

  const getMinPrice = (vendor: Vendor) => {
    if (!vendor.services || vendor.services.length === 0) return null;
    const prices = vendor.services.map(s => s.price).filter(Boolean);
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-4">
            Find Your Perfect Vendor
          </h1>
          <p className="text-gray-600 text-xl">Discover amazing vendors for your special event</p>
        </div>

        {/* Search and Quick Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search for vendors, services, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 text-lg rounded-full border-2 border-purple-200 focus:border-purple-400 shadow-lg"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {categories.slice(0, 8).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-6 transition-all duration-200 ${
                  selectedCategory === category 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                    : 'border-purple-200 hover:border-purple-400 hover:bg-purple-50'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-full px-6 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location.charAt(0).toUpperCase() + location.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={1000}
                    min={0}
                    step={50}
                    className="mt-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Summary */}
        <div className="mb-6 text-center">
          <p className="text-gray-600">
            Found <span className="font-semibold text-purple-600">{filteredVendors.length}</span> amazing vendors for you
          </p>
        </div>

        {/* Vendors Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg animate-pulse">
                <div className="h-48 bg-gradient-to-br from-purple-200 to-pink-200 rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-600 mb-2">No vendors found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
            <Button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedLocation('all');
                setPriceRange([0, 1000]);
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => {
              const minPrice = getMinPrice(vendor);
              return (
                <Link key={vendor.id} to={`/vendor/${vendor.id}`}>
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group overflow-hidden">
                    <div className="relative h-48 bg-gradient-to-br from-purple-200 to-pink-200 overflow-hidden">
                      {vendor.logo_url ? (
                        <img 
                          src={vendor.logo_url} 
                          alt={vendor.business_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-4xl font-bold text-purple-600 opacity-60">
                            {vendor.business_name.charAt(0)}
                          </div>
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        <SaveVendorButton
                          vendorId={vendor.id}
                          vendorName={vendor.business_name}
                          className="bg-white/80 backdrop-blur-sm hover:bg-white/90 rounded-full"
                        />
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <Badge className="bg-white/90 text-purple-700 backdrop-blur-sm">
                          {vendor.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-lg group-hover:text-purple-600 transition-colors line-clamp-1">
                          {vendor.business_name}
                        </h3>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm font-medium text-gray-600">4.9</span>
                        </div>
                      </div>
                      
                      {vendor.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {vendor.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        {vendor.location && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">{vendor.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">Quick response</span>
                        </div>
                        {minPrice && (
                          <div className="flex items-center gap-1 text-purple-600 font-semibold">
                            <DollarSign className="h-4 w-4" />
                            <span>From ${minPrice}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
