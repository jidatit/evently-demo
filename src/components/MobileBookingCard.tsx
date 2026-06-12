
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Clock, Phone, Mail } from 'lucide-react';

interface MobileBookingCardProps {
  vendor: {
    id: string;
    business_name: string;
    category: string;
    location: string;
    rating?: number;
    image_url?: string;
    pricing_start?: number;
  };
  onBook: (vendorId: string) => void;
  onViewDetails: (vendorId: string) => void;
}

export const MobileBookingCard: React.FC<MobileBookingCardProps> = ({
  vendor,
  onBook,
  onViewDetails
}) => {
  return (
    <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative h-48 bg-gradient-to-br from-lime-100 to-green-100 rounded-t-lg overflow-hidden">
          {vendor.image_url ? (
            <img 
              src={vendor.image_url} 
              alt={vendor.business_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 bg-lime-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {vendor.business_name.charAt(0)}
                </span>
              </div>
            </div>
          )}
          
          {/* Category Badge */}
          <Badge 
            className="absolute top-3 left-3 bg-white/90 text-gray-800 hover:bg-white"
          >
            {vendor.category}
          </Badge>

          {/* Rating Badge */}
          {vendor.rating && (
            <Badge 
              className="absolute top-3 right-3 bg-lime-500 text-white hover:bg-lime-600"
            >
              <Star className="h-3 w-3 mr-1 fill-current" />
              {vendor.rating.toFixed(1)}
            </Badge>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-lg text-foreground line-clamp-1">
              {vendor.business_name}
            </h3>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{vendor.location}</span>
            </div>
          </div>

          {/* Pricing */}
          {vendor.pricing_start && (
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Starting at</span>
              <span className="font-semibold text-primary">
                ${vendor.pricing_start}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs"
              onClick={() => onViewDetails(vendor.id)}
            >
              View Details
            </Button>
            <Button 
              size="sm" 
              className="flex-1 bg-lime-500 hover:bg-lime-600 text-xs"
              onClick={() => onBook(vendor.id)}
            >
              Book Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
