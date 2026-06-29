// src/components/customer/FavoritesList.tsx (or wherever you place it)

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Star, ExternalLink, Trash2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCustomerFavorites, useToggleFavorite } from '@/features/vendor-favorites/hooks';
import type { FavoritedVendor } from '@/features/vendor-favorites/types';
import { useConsolidatedAuth } from './ConsolidatedAuthProvider';
import { formatDate } from '@/utils/dateUtils';


export const FavoritesList: React.FC = () => {
  const { isAuthenticated, isCustomer } = useConsolidatedAuth();
  const { toast } = useToast();

  const {
    data: favorites = [],
    isLoading,
    isError,
  } = useCustomerFavorites();

  const toggleFavorite = useToggleFavorite();
  console.log('favorites', favorites);
  const handleRemoveFavorite = (vendorId: string) => {
    toggleFavorite.mutate(vendorId, {
      onSuccess: () => {
        toast({
          title: 'Removed from favorites',
          description: 'This vendor has been removed from your favorites list.',
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to remove vendor. Please try again.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleViewVendor = (profileSlug?: string) => {
    if (profileSlug) {
      window.open(`/v/${profileSlug}`, '_blank');
    } else {
      toast({
        title: 'Profile not available',
        description: 'This vendor profile is not public yet.',
      });
    }
  };

  if (!isAuthenticated || !isCustomer) {
    return null; // Protected by CustomerProtectedFeatures anyway
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-0 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Heart className="h-6 w-6 text-pink-500 fill-pink-500" />
            Your Favorite Vendors
          </CardTitle>
          <p className="text-gray-600">Keep track of vendors you love for easy booking later</p>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 animate-pulse">
                  <div className="w-full md:w-48 h-32 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-500 mb-4">Failed to load favorites</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      ) : favorites.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No favorites yet</h3>
            <p className="text-gray-500 mb-4">Start browsing vendors and save your favorites!</p>
            <Button
              onClick={() => window.location.href = '/browse-vendors'}
              className="bg-primary hover:bg-primary/90"
            >
              Browse Vendors
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {favorites.map((vendor: FavoritedVendor) => (
            <Card
              key={vendor.id}
              className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Vendor Image / Logo */}
                  <div className="w-full md:w-48 h-32 bg-gradient-to-br from-primary/20 to-pink-200 rounded-lg overflow-hidden flex-shrink-0">
                    {vendor.logo_url ? (
                      <img
                        src={vendor.logo_url}
                        alt={vendor.business_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl font-bold text-primary opacity-60">
                          {vendor.business_name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Vendor Details */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">
                          {vendor.business_name}
                        </h3>
                        {/* You can add primary category here later if you fetch it */}
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                          {vendor?.primaryCategory ? vendor.primaryCategory : 'Vendor'}
                        </Badge>
                      </div>

                      {/* Rating placeholder - no real rating yet */}
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium text-gray-600">New</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">
                          {vendor.city}, {vendor.state}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          Favorited on {formatDate(vendor.favoritedAt)}
                        </span>
                      </div>
                      {/* You can add saved_at later if you expose created_at in the join */}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleViewVendor(vendor.profile_slug)}
                        className="bg-primary hover:bg-primary/90"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>


                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFavorite(vendor.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};