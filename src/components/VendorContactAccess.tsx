
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getVendorContactForBooking } from '@/lib/secure-vendor-queries';

interface VendorContactAccessProps {
  vendorId: string;
  businessName: string;
  onContactRevealed?: (contactInfo: any) => void;
}

/**
 * SECURITY COMPONENT: Controlled access to vendor contact information
 * Updated to use new secure database functions with enhanced security measures
 */
export const VendorContactAccess: React.FC<VendorContactAccessProps> = ({
  vendorId,
  businessName,
  onContactRevealed
}) => {
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  const handleRevealContact = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await getVendorContactForBooking(vendorId);
      
      if (error) {
        if (error.message?.includes('Rate limit exceeded')) {
          toast.error('Too many contact requests. Please wait before trying again.');
        } else if (error.message?.includes('Authentication required')) {
          toast.error('Please sign in to view vendor contact information.');
        } else {
          toast.error('Unable to access contact information. Please try again.');
        }
        return;
      }
      
      if (data) {
        setContactInfo(data);
        setHasRequested(true);
        onContactRevealed?.(data);
        toast.success('Contact information revealed securely.');
      } else {
        toast.error('Contact information not available for this vendor.');
      }
    } catch (error) {
      console.error('Contact access error:', error);
      toast.error('Failed to access contact information.');
    } finally {
      setLoading(false);
    }
  };

  if (contactInfo) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {contactInfo.contact_email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a 
                href={`mailto:${contactInfo.contact_email}`}
                className="text-primary hover:underline"
              >
                {contactInfo.contact_email}
              </a>
            </div>
          )}
          {contactInfo.contact_phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a 
                href={`tel:${contactInfo.contact_phone}`}
                className="text-primary hover:underline"
              >
                {contactInfo.contact_phone}
              </a>
            </div>
          )}
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
            <Clock className="h-3 w-3" />
            Contact access logged for security with enhanced monitoring
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-muted-foreground/30">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Shield className="h-5 w-5" />
            <span className="font-medium">Secure Contact Access</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            To protect vendor privacy and prevent spam, contact information is only revealed for legitimate booking inquiries with enhanced security monitoring.
          </p>
          
          <Button
            onClick={handleRevealContact}
            disabled={loading || hasRequested}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              'Accessing Contact Info...'
            ) : hasRequested ? (
              'Contact Access Requested'
            ) : (
              `Reveal Contact for ${businessName}`
            )}
          </Button>
          
          <div className="text-xs text-muted-foreground">
            <p>• Access is logged for security with audit trail</p>
            <p>• Enhanced rate limiting to prevent abuse</p>
            <p>• Only for authenticated users with valid sessions</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
