
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, MapPin, Star } from "lucide-react";
import { useState } from "react";

interface SearchFiltersProps {
  onSearch: (searchTerm: string, category: string) => void;
}

const US_MAJOR_CITIES = [
  { value: 'new-york', label: 'New York, NY' },
  { value: 'los-angeles', label: 'Los Angeles, CA' },
  { value: 'chicago', label: 'Chicago, IL' },
  { value: 'houston', label: 'Houston, TX' },
  { value: 'phoenix', label: 'Phoenix, AZ' },
  { value: 'philadelphia', label: 'Philadelphia, PA' },
  { value: 'san-antonio', label: 'San Antonio, TX' },
  { value: 'san-diego', label: 'San Diego, CA' },
  { value: 'dallas', label: 'Dallas, TX' },
  { value: 'san-jose', label: 'San Jose, CA' },
  { value: 'austin', label: 'Austin, TX' },
  { value: 'jacksonville', label: 'Jacksonville, FL' },
  { value: 'san-francisco', label: 'San Francisco, CA' },
  { value: 'indianapolis', label: 'Indianapolis, IN' },
  { value: 'columbus', label: 'Columbus, OH' },
  { value: 'charlotte', label: 'Charlotte, NC' },
  { value: 'seattle', label: 'Seattle, WA' },
  { value: 'denver', label: 'Denver, CO' },
  { value: 'boston', label: 'Boston, MA' },
  { value: 'detroit', label: 'Detroit, MI' },
  { value: 'nashville', label: 'Nashville, TN' },
  { value: 'portland', label: 'Portland, OR' },
  { value: 'las-vegas', label: 'Las Vegas, NV' },
  { value: 'atlanta', label: 'Atlanta, GA' },
  { value: 'miami', label: 'Miami, FL' },
  { value: 'minneapolis', label: 'Minneapolis, MN' },
  { value: 'tampa', label: 'Tampa, FL' },
  { value: 'cleveland', label: 'Cleveland, OH' }
];

const SearchFilters = ({ onSearch }: SearchFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");

  const handleSearch = () => {
    onSearch(searchTerm, category);
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    onSearch(value, category);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    onSearch(searchTerm, value);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Your Perfect Vendor</h3>
        <p className="text-gray-600">Search and filter to discover the best vendors for your event across the U.S.</p>
      </div>
      
      {/* Main Search Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            placeholder="Search vendors, services, or keywords..." 
            className="w-full pl-10 h-12 text-base border-gray-200 focus:border-lime-500 focus:ring-lime-500"
            value={searchTerm}
            onChange={(e) => handleInputChange(e.target.value)}
          />
        </div>
        
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="h-12 border-gray-200 focus:border-lime-500 focus:ring-lime-500">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="catering">Catering</SelectItem>
            <SelectItem value="photography">Photography</SelectItem>
            <SelectItem value="entertainment">Entertainment</SelectItem>
            <SelectItem value="decoration">Decoration</SelectItem>
            <SelectItem value="venue">Venues</SelectItem>
            <SelectItem value="flowers">Flowers</SelectItem>
            <SelectItem value="music">Music</SelectItem>
            <SelectItem value="transportation">Transportation</SelectItem>
          </SelectContent>
        </Select>
        
        <Select>
          <SelectTrigger className="h-12 border-gray-200 focus:border-lime-500 focus:ring-lime-500">
            <SelectValue placeholder="Budget" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="under-500">Under $500</SelectItem>
            <SelectItem value="500-1000">$500 - $1,000</SelectItem>
            <SelectItem value="1000-2500">$1,000 - $2,500</SelectItem>
            <SelectItem value="2500-5000">$2,500 - $5,000</SelectItem>
            <SelectItem value="over-5000">Over $5,000</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Additional Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>Filters:</span>
        </div>
        
        <Select>
          <SelectTrigger className="w-auto h-10 border-gray-200 focus:border-lime-500 focus:ring-lime-500">
            <MapPin className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="all">All Locations</SelectItem>
            {US_MAJOR_CITIES.map((city) => (
              <SelectItem key={city.value} value={city.value}>
                {city.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select>
          <SelectTrigger className="w-auto h-10 border-gray-200 focus:border-lime-500 focus:ring-lime-500">
            <Star className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5-plus">5+ Stars</SelectItem>
            <SelectItem value="4-plus">4+ Stars</SelectItem>
            <SelectItem value="3-plus">3+ Stars</SelectItem>
            <SelectItem value="any">Any Rating</SelectItem>
          </SelectContent>
        </Select>
        
        <Select>
          <SelectTrigger className="w-auto h-10 border-gray-200 focus:border-lime-500 focus:ring-lime-500">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available Now</SelectItem>
            <SelectItem value="weekend">Weekend Only</SelectItem>
            <SelectItem value="weekday">Weekday Only</SelectItem>
            <SelectItem value="any">Any Time</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          className="bg-lime-500 text-black border-0 hover:bg-lime-600 h-10 px-6 font-medium shadow-sm"
          onClick={handleSearch}
        >
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>
    </div>
  );
};

export default SearchFilters;
