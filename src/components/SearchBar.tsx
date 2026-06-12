import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onSearch
}) => {
  // Local state for input value before search is triggered
  const [inputValue, setInputValue] = useState(searchTerm);

  // Sync with prop changes (e.g., when filters are reset)
  React.useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Basic length check on input
    if (value.length > 100) {
      return;
    }

    // Basic character filtering for security
    const filtered = value.replace(/[<>'";&|]/g, '');
    setInputValue(filtered);
  };

  const handleSearch = () => {
    // Only trigger search if value has changed
    if (inputValue !== searchTerm) {
      onSearchChange(inputValue);
      onSearch();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setInputValue('');
    onSearchChange('');
    onSearch();
  };

  const isSearchActive = searchTerm !== '';
  const hasInputChanged = inputValue !== searchTerm;

  return (
    <div className="w-full">
      <div className="relative flex items-center gap-2">
        {/* Search Input Container */}
        <div className="relative flex-1 p-1">
          <Search
            className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 transition-colors ${isSearchActive ? 'text-primary' : 'text-gray-400'
              }`}
          />
          <Input
            placeholder="Search vendors..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className={`w-full pl-10 sm:pl-12 pr-10 h-11 sm:h-12 text-sm sm:text-base transition-all focus:border-none focus:ring-primary-100 focus:ring-offset-primary-100  ${isSearchActive
              ? 'border-primary bg-primary/10'
              : 'border-gray-300 hover:border-gray-400 focus:border-primary'
              } rounded-lg`}
            maxLength={100}
          />

          {/* Clear Button - Only show when there's input */}
          {inputValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          disabled={!inputValue.trim()}
          className={`h-11 rouneded-full  font-medium shadow-sm transition-all
            ${inputValue.trim()
              ? 'bg-primary hover:bg-primary/90 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
        >
          <Search className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Search</span>
        </Button>
      </div>

      {/* Active Search Indicator */}
      {isSearchActive && (
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">
              Searching for:
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
              "{searchTerm}"
              <button
                onClick={handleClear}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>

          {hasInputChanged && inputValue.trim() && (
            <span className="text-xs text-gray-500 italic hidden sm:block">
              Press Enter or click Search
            </span>
          )}
        </div>
      )}
    </div>
  );
};