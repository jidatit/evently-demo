
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from './LoadingSpinner';
import { useEnhancedInputValidation } from '@/hooks/useEnhancedInputValidation';
import { EnhancedInputSecurity } from '@/lib/enhanced-input-security';
import { toast } from 'sonner';
import { getPublicVendors } from '@/lib/secure-vendor-queries';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';

interface VendorSearchProps {
  onResults: (vendors: any[]) => void;
  onLoading: (loading: boolean) => void;
}

const CATEGORIES = [
  'Photography',
  'Catering',
  'Music',
  'Decoration',
  'Planning',
  'Venue',
  'Transportation',
  'Other'
];

export const VendorSearch: React.FC<VendorSearchProps> = ({ onResults, onLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { validateInput } = useEnhancedInputValidation();
  const { user } = useConsolidatedAuth();

  const sanitizeAndValidateInput = async (input: string, fieldName: string): Promise<{ isValid: boolean; sanitized: string; errors: string[] }> => {
    // First, use our enhanced input security
    const securityResult = EnhancedInputSecurity.sanitizeInput(input, {
      maxLength: 100, // Limit search terms to 100 characters
      allowHtml: false,
      stripScripts: true
    });

    if (!securityResult.isValid || securityResult.riskLevel === 'critical' || securityResult.riskLevel === 'high') {
      return {
        isValid: false,
        sanitized: '',
        errors: securityResult.errors
      };
    }

    // Then validate with backend if available
    try {
      const validationResult = await validateInput(securityResult.sanitized, {
        maxLength: 100,
        allowHtml: false,
        fieldName
      });

      return {
        isValid: validationResult.is_valid,
        sanitized: validationResult.sanitized,
        errors: validationResult.errors
      };
    } catch (error) {
      // If backend validation fails, fall back to frontend validation
      console.warn('Backend validation unavailable, using frontend validation only');
      return {
        isValid: securityResult.isValid,
        sanitized: securityResult.sanitized,
        errors: securityResult.errors
      };
    }
  };

  const performSearch = async () => {
    setIsSearching(true);
    onLoading(true);

    try {
      // Validate and sanitize all inputs before sending to database
      const searchValidation = await sanitizeAndValidateInput(searchTerm, 'Search Term');
      const locationValidation = await sanitizeAndValidateInput(location, 'Location');

      if (!searchValidation.isValid) {
        toast.error(`Invalid search term: ${searchValidation.errors.join(', ')}`);
        setIsSearching(false);
        onLoading(false);
        return;
      }

      if (!locationValidation.isValid) {
        toast.error(`Invalid location: ${locationValidation.errors.join(', ')}`);
        setIsSearching(false);
        onLoading(false);
        return;
      }

      // Validate category selection
      if (selectedCategory !== 'all' && !CATEGORIES.includes(selectedCategory)) {
        toast.error('Invalid category selected');
        setIsSearching(false);
        onLoading(false);
        return;
      }

      // Use secure vendor query method based on authentication status
      const queryResult = await getPublicVendors({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        location: locationValidation.sanitized && locationValidation.sanitized.trim() 
          ? locationValidation.sanitized.trim() 
          : undefined,
        searchTerm: searchValidation.sanitized && searchValidation.sanitized.trim() 
          ? searchValidation.sanitized.trim() 
          : undefined,
        limit: 50
      });

      const { data: vendors, error } = queryResult;

      if (error) {
        console.error('Search error:', error);
        toast.error('Search failed. Please try again.');
        onResults([]);
      } else {
        onResults(vendors || []);
      }
    } catch (error) {
      console.error('Search exception:', error);
      toast.error('An error occurred during search. Please try again.');
      onResults([]);
    } finally {
      setIsSearching(false);
      onLoading(false);
    }
  };

  // Enhanced input handlers with validation
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Basic length check on input
    if (value.length > 100) {
      toast.warning('Search term is too long');
      return;
    }

    // Basic character filtering
    const filtered = value.replace(/[<>'";&|]/g, '');
    if (filtered !== value) {
      toast.warning('Some characters were removed for security');
    }

    setSearchTerm(filtered);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Basic length check on input
    if (value.length > 100) {
      toast.warning('Location is too long');
      return;
    }

    // Basic character filtering
    const filtered = value.replace(/[<>'";&|]/g, '');
    if (filtered !== value) {
      toast.warning('Some characters were removed for security');
    }

    setLocation(filtered);
  };

  // Auto-search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory, location]);

  // Initial load
  useEffect(() => {
    performSearch();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={handleSearchTermChange}
            className="pl-10"
            maxLength={100}
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <Filter className="h-4 w-4 mr-2" />
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

        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Location..."
            value={location}
            onChange={handleLocationChange}
            className="pl-10"
            maxLength={100}
          />
        </div>

        <Button
          onClick={performSearch}
          disabled={isSearching}
          className="bg-lime-500 hover:bg-lime-600 text-black"
        >
          {isSearching ? <LoadingSpinner size="sm" /> : 'Search'}
        </Button>
      </div>
    </div>
  );
};
