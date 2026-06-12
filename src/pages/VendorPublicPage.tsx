// src/pages/public/VendorPublicProfile.tsx
import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin,
  Mail,
  Phone,
  Calendar,
  Check,
  AlertCircle,
  Link as LinkIcon,
  Package,
  Heart,
  MessageSquare,
  CalendarPlus,
  BadgeCheck,
} from 'lucide-react';
import { getPublicVendorBySlug } from '@/features/vendor/api';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ServiceCardPublic } from '@/components/services/ServiceCardPublic';
import { MediaGallery } from '@/components/services/MediaGallery';
import { SOCIAL_PLATFORMS } from '@/utils/socialLinks';

// Favorite functionality imports
import { useIsFavorited, useToggleFavorite } from '@/features/vendor-favorites/hooks';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { toast } from 'sonner';
import { EnhancedAuthModal } from '@/components/EnhancedAuthModal';
import { ThreadDrawer } from '@/features/threads/components/ThreadDrawer';
import { BookingRequestSheet } from '@/features/bookings/components/BookingRequestSheet';
import { TrustCues } from '@/components/marketing/TrustCues';
import { HowItWorksLink } from '@/components/marketing/HowItWorksLink';

export const VendorPublicProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Auth context
  const { isAuthenticated, isCustomer, isVendor, user } = useConsolidatedAuth();

  // Local auth modal state (you can replace with context if you have one)
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [threadDrawerOpen, setThreadDrawerOpen] = React.useState(false);
  const [bookingSheetOpen, setBookingSheetOpen] = React.useState(false);
  const [pendingMessageAfterAuth, setPendingMessageAfterAuth] = React.useState(false);
  const [pendingBookingAfterAuth, setPendingBookingAfterAuth] = React.useState(false);

  const { data: vendor, isLoading, error } = useQuery({
    queryKey: ['public-vendor', slug],
    queryFn: () => getPublicVendorBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  // Favorite hooks
  const { data: isFavorited = false, isLoading: isFavLoading } = useIsFavorited(vendor?.id);
  const { mutate: toggleFavorite, isPending: isToggling } = useToggleFavorite();

  React.useEffect(() => {
    if (!showAuthModal && pendingMessageAfterAuth && isAuthenticated && isCustomer) {
      setThreadDrawerOpen(true);
      setPendingMessageAfterAuth(false);
    }
  }, [showAuthModal, pendingMessageAfterAuth, isAuthenticated, isCustomer]);

  React.useEffect(() => {
    if (!showAuthModal && pendingMessageAfterAuth && !isAuthenticated) {
      setPendingMessageAfterAuth(false);
    }
  }, [showAuthModal, pendingMessageAfterAuth, isAuthenticated]);

  React.useEffect(() => {
    if (!showAuthModal && pendingBookingAfterAuth && isAuthenticated && isCustomer) {
      setBookingSheetOpen(true);
      setPendingBookingAfterAuth(false);
    }
  }, [showAuthModal, pendingBookingAfterAuth, isAuthenticated, isCustomer]);

  React.useEffect(() => {
    if (!showAuthModal && pendingBookingAfterAuth && !isAuthenticated) {
      setPendingBookingAfterAuth(false);
    }
  }, [showAuthModal, pendingBookingAfterAuth, isAuthenticated]);

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!isCustomer) {
      // Optional: could show a toast "Only customers can save vendors"
      toast.error("Only customers can save vendors");
      return;
    }

    if (vendor?.id) {
      toggleFavorite(vendor.id);
    }
  };

  const showAskQuestion =
    !(
      (isAuthenticated && user?.id === vendor?.ownerUserId) ||
      (isAuthenticated && isVendor)
    );

  const handleAskQuestionClick = () => {
    if (!isAuthenticated) {
      setPendingMessageAfterAuth(true);
      setShowAuthModal(true);
      return;
    }
    if (!isCustomer) {
      toast.error('Only customers can message vendors');
      return;
    }
    setThreadDrawerOpen(true);
  };

  const handleRequestBookingClick = () => {
    if (!isAuthenticated) {
      setPendingBookingAfterAuth(true);
      setShowAuthModal(true);
      return;
    }
    if (!isCustomer) {
      toast.error('Only customers can request bookings');
      return;
    }
    setBookingSheetOpen(true);
  };


  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invalid URL</h1>
          <p className="text-muted-foreground">No vendor slug provided.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Skeleton className="h-96 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This vendor profile is not public, does not exist, or is not available.
            </p>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const joinedDate = new Date(vendor.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  const hasSocialLinks = Object.keys(vendor.socialLinks).length > 0;

  return (
    <div className="min-h-screen bg-background relative">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
          {/* Left Column - Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-xl border-primary/10 relative">
              {/* Favorite Heart Button */}
              <button
                onClick={handleFavoriteClick}
                disabled={isFavLoading || isToggling}
                className={`
                  absolute top-4 right-4 z-10 
                  p-2.5 rounded-full
                  transition-all duration-200
                  hover:bg-muted/70 active:scale-95
                  ${isFavorited ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'}
                `}
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  className="w-7 h-7 transition-transform"
                  fill={isFavorited ? 'currentColor' : 'none'}
                  strokeWidth={isFavorited ? 0 : 2.2}
                />
              </button>

              <CardContent className="p-6 text-center pt-16">
                <div className="relative mb-6 inline-block">
                  <img
                    src={vendor.logoUrl || '/placeholder.svg'}
                    alt={vendor.businessName}
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-primary/30 shadow-md"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-1.5 shadow">
                    <Check className="w-5 h-5" />
                  </div>
                </div>

                <h1 className="text-3xl font-bold mb-2">{vendor.businessName}</h1>

                {vendor.primaryCategory && (
                  <Badge variant="secondary" className="mb-4 text-base px-4 py-1">
                    {vendor.primaryCategory.name}
                  </Badge>
                )}

                <div className="space-y-4 mt-8 text-left">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    <span>{vendor.city}, {vendor.state}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="w-5 h-5 flex-shrink-0" />
                    <a href={`mailto:${vendor.contactEmail}`} className="hover:text-primary">
                      {vendor.contactEmail}
                    </a>
                  </div>
                  {vendor.contactPhone && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Phone className="w-5 h-5 flex-shrink-0" />
                      <span>{vendor.contactPhone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="w-5 h-5 flex-shrink-0" />
                    <span>Member since {joinedDate}</span>
                  </div>
                </div>

                {showAskQuestion && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-medium">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified on Evently
                    </div>
                    <Button
                      type="button"
                      className="w-full gap-2"
                      variant="default"
                      onClick={handleRequestBookingClick}
                    >
                      <CalendarPlus className="h-4 w-4" />
                      Request Booking
                    </Button>

                    {/* Ask a Question — hidden from clients; threads still power the quote flow internally */}
                    {/* <Button
                      type="button"
                      className="w-full gap-2"
                      variant="outline"
                      onClick={handleAskQuestionClick}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Ask a Question
                    </Button> */}
                    <p className="text-center text-xs text-muted-foreground">
                      <HowItWorksLink className="text-primary hover:underline">
                        How booking works
                      </HowItWorksLink>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Links */}
            {hasSocialLinks && (
              <Card className="shadow-party border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LinkIcon className="w-5 h-5" />
                    Connect Online
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap justify-center gap-6">
                    {SOCIAL_PLATFORMS.map((platform) => {
                      const url = vendor.socialLinks?.[platform.key];
                      if (!url) return null;

                      return (
                        <a
                          key={platform.key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-3 rounded-full transition-all duration-200 hover:bg-inherit ${platform.color}`}
                          title={platform.label}
                          aria-label={`Visit us on ${platform.label}`}
                        >
                          <platform.Icon className="w-9 h-9" strokeWidth={1.6} />
                        </a>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2 space-y-10">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">About {vendor.businessName}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
                  {vendor.description || "No description provided yet."}
                </p>
              </CardContent>
            </Card>

            {vendor.secondaryCategories.length > 0 && (
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle>Services Offered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {vendor.secondaryCategories.map((cat) => (
                      <Badge key={cat.id} variant="outline" className="text-base px-4 py-2">
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services Section */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Available Services</CardTitle>
              </CardHeader>
              <CardContent>
                {vendor.services && vendor.services.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vendor.services.map((service) => (
                      <ServiceCardPublic key={service.id} service={service} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-muted/40 rounded-xl">
                    <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No services listed yet</h3>
                    <p className="text-muted-foreground">
                      Check back later or contact the vendor directly.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gallery */}
            {vendor.media && vendor.media.length > 0 && (
              <section className="">
                <MediaGallery media={vendor.media as any} />
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal - shown when user tries to favorite without being logged in */}
      {showAuthModal && (
        <EnhancedAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="signin"
        />
      )}

      {vendor && user?.id && (
        <BookingRequestSheet
          open={bookingSheetOpen}
          onOpenChange={setBookingSheetOpen}
          vendor={vendor}
          customerId={user.id}
        />
      )}

      {vendor && (
        <ThreadDrawer
          open={threadDrawerOpen}
          onOpenChange={setThreadDrawerOpen}
          vendorId={vendor.id}
          vendorBusinessName={vendor.businessName}
          vendorSummary={{
            id: vendor.id,
            businessName: vendor.businessName,
            logoUrl: vendor.logoUrl,
            profileSlug: vendor.profileSlug,
            city: vendor.city,
            state: vendor.state,
          }}
          listVendorId={vendor.id}
          listCustomerId={user?.id}
        />
      )}
    </div>
  );
};