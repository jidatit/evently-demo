
import React from 'react';

interface CategoryBannerProps {
  category: string;
}

const CATEGORY_TAGLINES: { [key: string]: string } = {
  'Catering': 'Delicious bites for every occasion nationwide',
  'Entertainment': 'Keep guests on their feet across the country!',
  'Venues': 'The perfect space for your perfect day anywhere',
  'Rentals': 'Everything you need, delivered nationwide',
  'Photography': 'Capture every precious moment coast to coast',
  'Music': 'Set the perfect mood with sound anywhere in the U.S.',
  'Decoration': 'Transform your space beautifully nationwide',
  'Planning': 'Let us handle every detail across the country',
  'Transportation': 'Arrive in style and comfort anywhere',
  'Other': 'Unique services for special moments nationwide'
};

export const CategoryBanner: React.FC<CategoryBannerProps> = ({ category }) => {
  // Don't show banner for 'all' category
  if (category === 'all') return null;

  const tagline = CATEGORY_TAGLINES[category] || 'Find the perfect vendor for your event anywhere in the U.S.';

  return (
    <div className="bg-light-neutral border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-heading text-secondary-dark mb-2">
            {category}
          </h2>
          <p className="text-lg text-secondary-dark opacity-80">
            {tagline}
          </p>
        </div>
      </div>
    </div>
  );
};
