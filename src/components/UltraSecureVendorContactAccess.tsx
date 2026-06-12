
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, Shield, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getVendorContactUltraSecure } from '@/lib/ultra-secure-vendor-queries';

interface UltraSecureVendorContactAccessProps {
  vendorId: string;
  businessName: string;
  onContactRevealed?: (contactInfo: any) => void;
}

/**
 * ULTRA-SECURE COMPONENT: Maximum security contact information access
 * Updated to use new secure database functions with built-in rate limiting and logging
 */
export const UltraSecureVendorContactAccess: React.FC<UltraSecureVendorContactAccessProps> = ({
  vendorId,
  businessName,
  onContactRevealed
}) => {
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleRevealContact = async () => {
    setLoading(true);
    setAttempts(prev => prev + 1);
    
    try {
      const { data, error } = await getVendorContactUltraSecure(vendorId);
      
      if (error) {
        if (error.message?.includes('Rate limit exceeded')) {
          toast.error('Rate limit exceeded. Please wait before trying again.', {
            description: 'Enhanced security limits contact requests to prevent abuse.',
            duration: 10000,
          });
        } else if (error.message?.includes('Authentication required')) {
          toast.error('Please sign in to view vendor contact information.', {
            description: 'Enhanced security requires authentication for contact access.',
          });
        } else {
          toast.error('Unable to access contact information.', {
            description: 'Security systems are protecting vendor privacy.',
          });
        }
        return;
      }
      
      if (data) {
        setContactInfo(data);
        setHasRequested(true);
        onContactRevealed?.(data);
        toast.success('Contact information revealed securely.', {
          description: 'Access logged with enhanced security monitoring.',
          duration: 5000,
        });
      } else {
        toast.error('Contact information not available for this vendor.', {
          description: 'The vendor may not have provided contact details.',
        });
      }
    } catch (error) {
      console.error('Ultra-secure contact access error:', error);
      toast.error('Failed to access contact information.', {
        description: 'Enhanced security systems prevented access.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (contactInfo) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <Shield className="h-5 w-5" />
            Secure Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {contactInfo.contact_email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a 
                href={`mailto:${contactInfo.contact_email}`}
                className="text-green-600 hover:underline dark:text-green-400"
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
                className="text-green-600 hover:underline dark:text-green-400"
              >
                {contactInfo.contact_phone}
              </a>
            </div>
          )}
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2 bg-green-100 dark:bg-green-900 p-2 rounded">
            <Clock className="h-3 w-3" />
            Enhanced security: Access logged • Rate limited: 5/hour • Full audit trail active
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
            <span className="font-medium">Enhanced Secure Contact Access</span>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Enhanced security protects vendor privacy with comprehensive monitoring, strict rate limiting, and audit logging.
            </p>
            {attempts > 0 && (
              <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-xs">Attempts: {attempts}/5 this hour</span>
              </div>
            )}
          </div>
          
          <Button
            onClick={handleRevealContact}
            disabled={loading || hasRequested}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              'Enhanced Security Check in Progress...'
            ) : hasRequested ? (
              'Contact Access Requested'
            ) : (
              `Secure Access for ${businessName}`
            )}
          </Button>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Enhanced rate limiting: 5 requests/hour maximum</p>
            <p>• Comprehensive security logging with audit trail</p>
            <p>• Real-time threat monitoring and detection</p>
            <p>• Authentication required with session validation</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
