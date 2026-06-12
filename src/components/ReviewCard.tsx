
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { StarRating } from '@/components/StarRating';
import { ThumbsUp, ThumbsDown, Shield, MessageSquare, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Review {
  id: string;
  overall_rating: number;
  service_rating: number;
  communication_rating: number;
  value_rating: number;
  review_text: string | null;
  review_photos: string[] | null;
  is_verified: boolean;
  vendor_response: string | null;
  vendor_response_date: string | null;
  created_at: string;
  customer_id: string;
  vendor_id: string;
  customer?: {
    name: string | null;
    email: string | null;
  };
}

interface ReviewCardProps {
  review: Review;
  isVendor?: boolean;
  onResponseSubmit?: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  isVendor = false,
  onResponseSubmit
}) => {
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);
  const [helpfulVote, setHelpfulVote] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleVendorResponse = async () => {
    if (!responseText.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('vendor_reviews')
        .update({
          vendor_response: responseText,
          vendor_response_date: new Date().toISOString()
        })
        .eq('id', review.id);

      if (error) throw error;

      toast({
        title: "Response posted!",
        description: "Your response has been added to the review.",
      });

      setShowResponse(false);
      setResponseText('');
      onResponseSubmit?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error posting response",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHelpfulVote = async (isHelpful: boolean) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        toast({
          variant: "destructive",
          title: "Please sign in",
          description: "You need to be signed in to vote on reviews.",
        });
        return;
      }

      const { error } = await supabase
        .from('review_helpfulness')
        .upsert({
          review_id: review.id,
          user_id: user.data.user.id,
          is_helpful: isHelpful
        });

      if (error) throw error;

      setHelpfulVote(isHelpful);
      toast({
        title: "Thanks for your feedback!",
        description: "Your vote has been recorded.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error voting",
        description: error.message,
      });
    }
  };

  const customerName = review.customer?.name || 'Anonymous Customer';
  const customerInitials = customerName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
      <CardContent className="p-6">
        {/* Customer Info & Overall Rating */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                {customerInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">{customerName}</h4>
                {review.is_verified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                {format(new Date(review.created_at), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
          <StarRating rating={review.overall_rating} readonly size="lg" />
        </div>

        {/* Detailed Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <StarRating
            rating={review.service_rating}
            readonly
            showLabel
            label="Service"
            size="sm"
          />
          <StarRating
            rating={review.communication_rating}
            readonly
            showLabel
            label="Communication"
            size="sm"
          />
          <StarRating
            rating={review.value_rating}
            readonly
            showLabel
            label="Value"
            size="sm"
          />
        </div>

        {/* Review Text */}
        {review.review_text && (
          <div className="mb-4">
            <p className="text-gray-700 leading-relaxed">{review.review_text}</p>
          </div>
        )}

        {/* Review Photos */}
        {review.review_photos && review.review_photos.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {review.review_photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Review photo ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(photo, '_blank')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Vendor Response */}
        {review.vendor_response && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-blue-800">Vendor Response</span>
              <span className="text-sm text-blue-600">
                {format(new Date(review.vendor_response_date!), 'MMM d, yyyy')}
              </span>
            </div>
            <p className="text-blue-700">{review.vendor_response}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          {/* Helpful Votes */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Was this helpful?</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleHelpfulVote(true)}
              className={helpfulVote === true ? "text-green-600" : ""}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Yes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleHelpfulVote(false)}
              className={helpfulVote === false ? "text-red-600" : ""}
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              No
            </Button>
          </div>

          {/* Vendor Response Button */}
          {isVendor && !review.vendor_response && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResponse(!showResponse)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Respond
            </Button>
          )}
        </div>

        {/* Vendor Response Form */}
        {showResponse && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <Textarea
              placeholder="Write your response to this review..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={3}
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleVendorResponse}
                disabled={loading || !responseText.trim()}
                size="sm"
              >
                {loading ? "Posting..." : "Post Response"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResponse(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
