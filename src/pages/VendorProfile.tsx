// src/pages/VendorProfile.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Edit,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Check,
  AlertCircle,
  Link as LinkIcon,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { useVendor } from '@/features/vendor/hooks';
import { toast } from 'sonner';
import { SOCIAL_PLATFORMS } from '@/utils/socialLinks';


interface VendorProfileProps {
  onEdit: () => void;
}

export const VendorProfile: React.FC<VendorProfileProps> = ({ onEdit }) => {
  const { user } = useConsolidatedAuth();
  const { data: vendor, isLoading, error } = useVendor(user?.id);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Skeleton className="h-96" />
              <Skeleton className="h-64" />
            </div>
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-48" />
              <Skeleton className="h-32" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load profile</h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Please try again'}
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const joinedDate = new Date(vendor.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  const hasSocialLinks = Object.keys(vendor.socialLinks || {}).length > 0;

  return (
    <div className="bg-white rounded-lg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
              Your Profile
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your vendor profile and business information
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {vendor.profileSlug && vendor.isProfilePublic && (
              <>
                {/* Copy Link Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/v/${vendor.profileSlug}`);
                    toast.success("Public profile link copied!");
                  }}
                  title="Copy public profile link"
                  className="h-10 w-10 self-center sm:self-auto"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  asChild
                  className="border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-colors w-full sm:w-auto"
                >
                  <a
                    href={`/v/${vendor.profileSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Public Profile
                  </a>
                </Button>


              </>
            )}

            <Button
              onClick={onEdit}
              className="gradient-party text-white font-cta shadow-party hover:shadow-party-hover transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Main Profile Card */}
            <Card className="shadow-party border-primary/20">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="relative mb-4 sm:mb-6">
                  <img
                    src={vendor.logoUrl || '/placeholder.svg'}
                    alt={vendor.businessName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto object-cover border-4 border-primary/20"
                  />
                  {vendor.status === 'approved' && (
                    <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground mb-2">
                  {vendor.businessName}
                </h2>

                {vendor.primaryCategory && (
                  <Badge className="mb-4 bg-green-600">{vendor.primaryCategory.name}</Badge>
                )}

                <div className="space-y-3 text-sm mt-4 sm:mt-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{vendor.city}, {vendor.state}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{vendor.contactEmail}</span>
                  </div>
                  {vendor.contactPhone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      {vendor.contactPhone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    Member since {joinedDate}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* New: Dedicated Social Links Section */}
            {hasSocialLinks && (
              <Card className="shadow-party border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <LinkIcon className="w-5 h-5" />
                    Connect Online
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                    {SOCIAL_PLATFORMS.map((platform) => {
                      const url = vendor.socialLinks?.[platform.key];
                      if (!url) return null;

                      return (
                        <a
                          key={platform.key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-2 sm:p-3 rounded-full transition-all duration-200 hover:bg-inherit ${platform.color}`}
                          title={platform.label}
                          aria-label={`Visit us on ${platform.label}`}
                        >
                          <platform.Icon className="w-7 h-7 sm:w-9 sm:h-9" strokeWidth={1.6} />
                        </a>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Badge */}
            <Card className="shadow-party">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant={vendor.status === 'approved' ? 'default' : 'secondary'}
                  >
                    {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                  </Badge>
                </div>
                {vendor.status === 'pending' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Your profile is under review. You'll be notified once approved.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <Card className="shadow-party">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">About Our Business</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {vendor.description}
                </p>
              </CardContent>
            </Card>

            {vendor.secondaryCategories.length > 0 && (
              <Card className="shadow-party">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Additional Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vendor.secondaryCategories.map((category) => (
                      <Badge key={category.id} variant="outline" className="text-xs sm:text-sm">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {vendor.media.length > 0 && (
              <Card className="shadow-party">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    {vendor.media.slice(0, 6).map((media) => (
                      <div key={media.id} className="relative">
                        {media.fileType === 'image' ? (
                          <img
                            src={media.fileUrl}
                            alt="Gallery image"
                            className="w-full h-28 sm:h-36 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                          />
                        ) : media.fileType === 'video' ? (
                          <video
                            src={media.fileUrl}
                            className="w-full h-28 sm:h-36 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                            controls
                            muted
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {vendor.media.length > 6 && (
                    <Button variant="outline" className="mt-4 w-full text-sm sm:text-base">
                      View All {vendor.media.length} Items
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};