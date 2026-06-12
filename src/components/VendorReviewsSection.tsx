
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StarRating } from '@/components/StarRating';
import { ReviewCard } from '@/components/ReviewCard';
import { ReviewForm } from '@/components/ReviewForm';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Users, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VendorReviewsSectionProps {
  vendorId: string;
  isVendor?: boolean;
  canWriteReview?: boolean;
  bookingId?: string;
}

interface ReviewStats {
  average_overall: number;
  average_service: number;
  average_communication: number;
  average_value: number;
  total_reviews: number;
  rating_breakdown: {
    '5_star': number;
    '4_star': number;
    '3_star': number;
    '2_star': number;
    '1_star': number;
  };
}

export const VendorReviewsSection: React.FC<VendorReviewsSectionProps> = ({
  vendorId,
  isVendor = false,
  canWriteReview = false,
  bookingId
}) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      // Load reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('vendor_reviews')
        .select(`
          *,
          customer:profiles(name, email)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Load stats using the database function
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_vendor_ratings', { vendor_id_param: vendorId });

      if (statsError) throw statsError;

      setReviews(reviewsData || []);
      
      // Type cast the JSON data properly
      if (statsData?.[0]) {
        const rawStats = statsData[0];
        const typedStats: ReviewStats = {
          average_overall: rawStats.average_overall || 0,
          average_service: rawStats.average_service || 0,
          average_communication: rawStats.average_communication || 0,
          average_value: rawStats.average_value || 0,
          total_reviews: rawStats.total_reviews || 0,
          rating_breakdown: typeof rawStats.rating_breakdown === 'object' && rawStats.rating_breakdown !== null
            ? rawStats.rating_breakdown as ReviewStats['rating_breakdown']
            : {
                '5_star': 0,
                '4_star': 0,
                '3_star': 0,
                '2_star': 0,
                '1_star': 0,
              }
        };
        setStats(typedStats);
      } else {
        setStats(null);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading reviews",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [vendorId]);

  if (loading) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center">Loading reviews...</div>
        </CardContent>
      </Card>
    );
  }

  const getRatingPercentage = (count: number, total: number) => {
    return total > 0 ? (count / total) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      {/* Review Statistics */}
      {stats && stats.total_reviews > 0 && (
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" />
              Customer Reviews
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {stats.total_reviews} reviews
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {stats.average_overall.toFixed(1)}
                </div>
                <StarRating rating={stats.average_overall} readonly size="lg" />
                <p className="text-gray-600 mt-2">
                  Based on {stats.total_reviews} reviews
                </p>
              </div>

              {/* Rating Breakdown */}
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.rating_breakdown[`${rating}_star` as keyof typeof stats.rating_breakdown];
                  const percentage = getRatingPercentage(count, stats.total_reviews);
                  
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-8">{rating}★</span>
                      <Progress 
                        value={percentage} 
                        className="flex-1 h-2" 
                      />
                      <span className="text-sm text-gray-600 w-10">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-6 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">Service Quality</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.average_service.toFixed(1)}
                </div>
                <StarRating rating={stats.average_service} readonly />
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">Communication</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.average_communication.toFixed(1)}
                </div>
                <StarRating rating={stats.average_communication} readonly />
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold">Value for Money</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.average_value.toFixed(1)}
                </div>
                <StarRating rating={stats.average_value} readonly />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Write Review Button */}
      {canWriteReview && !showReviewForm && (
        <div className="text-center">
          <Button
            onClick={() => setShowReviewForm(true)}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Star className="h-5 w-5 mr-2" />
            Write a Review
          </Button>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          vendorId={vendorId}
          bookingId={bookingId}
          onSubmit={() => {
            setShowReviewForm(false);
            loadReviews();
          }}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isVendor={isVendor}
              onResponseSubmit={loadReviews}
            />
          ))
        ) : (
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Reviews Yet
              </h3>
              <p className="text-gray-500">
                Be the first to share your experience with this vendor!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
