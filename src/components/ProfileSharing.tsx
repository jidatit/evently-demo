import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Facebook, Twitter, Instagram, Copy, Check } from 'lucide-react';

interface ProfileSharingProps {
  vendor: any;
}

const ProfileSharing: React.FC<ProfileSharingProps> = ({ vendor }) => {
  const [shareUrlCopied, setShareUrlCopied] = useState(false);

  const getProfileUrl = () => `${window.location.origin}/vendor/${vendor.id}`;
  
  const getShareText = () => `Check out my services at ${vendor.business_name}! Book me for your next event. #BookD #EventVendor`;

  const handleCopyProfileUrl = async () => {
    const profileUrl = getProfileUrl();
    try {
      await navigator.clipboard.writeText(profileUrl);
      setShareUrlCopied(true);
      setTimeout(() => setShareUrlCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = profileUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShareUrlCopied(true);
      setTimeout(() => setShareUrlCopied(false), 2000);
    }
  };

  const handleSocialShare = (platform: string) => {
    const profileUrl = getProfileUrl();
    const text = getShareText();
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, copy text for user to paste
        navigator.clipboard.writeText(`${text} ${profileUrl}`);
        alert('Promotional text copied! You can paste it in your Instagram post or story.');
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-black mb-4">Share Your Profile</h3>
      <div className="space-y-4">
        <div>
          <p className="text-gray-600 mb-2">Your public profile URL:</p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={getProfileUrl()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-600 text-sm"
            />
            <Button onClick={handleCopyProfileUrl} variant="outline">
              {shareUrlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        <div>
          <p className="text-gray-600 mb-3">Share on social media:</p>
          <div className="flex gap-2">
            <Button
              onClick={() => handleSocialShare('facebook')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Facebook className="w-4 h-4" />
              Facebook
            </Button>
            <Button
              onClick={() => handleSocialShare('twitter')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Twitter className="w-4 h-4" />
              Twitter
            </Button>
            <Button
              onClick={() => handleSocialShare('instagram')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Instagram className="w-4 h-4" />
              Instagram
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSharing;