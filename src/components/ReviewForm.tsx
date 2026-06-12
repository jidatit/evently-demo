
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/StarRating';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReviewFormProps {
  vendorId: string;
  bookingId?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  vendorId,
  bookingId,
  onSubmit,
  onCancel
}) => {
  const [overallRating, setOverallRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length + photos.length > 5) {
      toast({
        variant: "destructive",
        title: "Too many photos",
        description: "You can upload a maximum of 5 photos per review.",
      });
      return;
    }

    setPhotos(prev => [...prev, ...imageFiles]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (overallRating === 0 || serviceRating === 0 || communicationRating === 0 || valueRating === 0) {
      toast({
        variant: "destructive",
        title: "Please provide all ratings",
        description: "All rating categories are required.",
      });
      return;
    }

    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      // Upload photos if any
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${user.data.user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('review-photos')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('review-photos')
          .getPublicUrl(fileName);

        photoUrls.push(publicUrl);
      }

      // Create review
      const { error } = await supabase
        .from('vendor_reviews')
        .insert({
          vendor_id: vendorId,
          booking_id: bookingId || null,
          overall_rating: overallRating,
          service_rating: serviceRating,
          communication_rating: communicationRating,
          value_rating: valueRating,
          review_text: reviewText.trim() || null,
          review_photos: photoUrls.length > 0 ? photoUrls : null,
          customer_id: user.data.user.id
        });

      if (error) throw error;

      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      });

      onSubmit?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error submitting review",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Write a Review
          {bookingId && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Verified Booking
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Categories */}
        <div className="space-y-4">
          <StarRating
            rating={overallRating}
            onRatingChange={setOverallRating}
            showLabel
            label="Overall"
            size="lg"
          />
          <StarRating
            rating={serviceRating}
            onRatingChange={setServiceRating}
            showLabel
            label="Service Quality"
          />
          <StarRating
            rating={communicationRating}
            onRatingChange={setCommunicationRating}
            showLabel
            label="Communication"
          />
          <StarRating
            rating={valueRating}
            onRatingChange={setValueRating}
            showLabel
            label="Value for Money"
          />
        </div>

        {/* Review Text */}
        <div className="space-y-2">
          <Label htmlFor="reviewText">Your Experience</Label>
          <Textarea
            id="reviewText"
            placeholder="Share details about your experience with this vendor..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Photo Upload */}
        <div className="space-y-3">
          <Label>Photos (Optional)</Label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors">
                <Camera className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Add Photos</span>
              </div>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
            <span className="text-xs text-gray-500">
              Up to 5 photos, max 5MB each
            </span>
          </div>

          {/* Photo Previews */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Review photo ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={loading || overallRating === 0}
            className="flex-1"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
