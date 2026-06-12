// src/pages/VendorProfileEdit.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  X,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { useVendor, useVendorMutation } from '@/features/vendor/hooks';
import { useCategories } from '@/features/category/hooks';
import { vendorUpdateSchema, type VendorFormData } from '@/features/vendor/types';
import { toast } from 'sonner';
import { US_STATES, US_STATES_AND_CITIES } from '@/utils/locationData';

interface VendorProfileEditProps {
  onSave: () => void;
  onCancel: () => void;
}

export const VendorProfileEdit: React.FC<VendorProfileEditProps> = ({ onSave, onCancel }) => {
  const navigate = useNavigate();
  const { user } = useConsolidatedAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: vendor, isLoading: vendorLoading } = useVendor(user?.id);
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { mutate: updateVendor, isPending } = useVendorMutation();

  const [formData, setFormData] = useState<VendorFormData & { socialLinks: Record<string, string> }>({
    businessName: '',
    description: '',
    city: '',
    state: '',
    contactEmail: '',
    contactPhone: '',
    primaryCategory: '',
    secondaryCategories: [],
    logo: null,
    logoPreview: '',
    socialLinks: {}, // ← added
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when vendor data loads
  useEffect(() => {
    if (vendor) {
      setFormData({
        businessName: vendor.businessName,
        description: vendor.description,
        city: vendor.city,
        state: vendor.state,
        contactEmail: vendor.contactEmail,
        contactPhone: vendor.contactPhone || '',
        primaryCategory: vendor.primaryCategory?.id || '',
        secondaryCategories: vendor.secondaryCategories.map(c => c.id),
        logo: null,
        logoPreview: vendor.logoUrl || '',
        socialLinks: vendor.socialLinks || {}, // ← added
      });
    }
  }, [vendor]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', { description: 'Logo must be under 5MB' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', { description: 'Please upload an image file' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({
        ...prev,
        logo: file,
        logoPreview: e.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const toggleSecondaryCategory = (categoryId: string) => {
    setFormData(prev => {
      const current = prev.secondaryCategories;
      const isSelected = current.includes(categoryId);

      if (isSelected) {
        return {
          ...prev,
          secondaryCategories: current.filter(id => id !== categoryId),
        };
      } else {
        if (current.length >= 3) {
          toast.error('Maximum categories reached', {
            description: 'You can select up to 3 secondary categories',
          });
          return prev;
        }
        return {
          ...prev,
          secondaryCategories: [...current, categoryId],
        };
      }
    });
  };

  const validateForm = (): boolean => {
    try {
      // We pass only the fields Zod knows about (socialLinks is optional)
      vendorUpdateSchema.parse({
        ...formData,
        socialLinks: formData.socialLinks,
      });
      setErrors({});
      return true;
    } catch (error: any) {
      const validationErrors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        const path = err.path[0];
        validationErrors[path] = err.message;
      });
      setErrors(validationErrors);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    updateVendor(
      {
        userId: user.id,
        businessName: formData.businessName,
        description: formData.description,
        city: formData.city,
        state: formData.state,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        primaryCategory: formData.primaryCategory,
        secondaryCategories: formData.secondaryCategories,
        logo: formData.logo,
        socialLinks: formData.socialLinks,
      },
      {
        onSuccess: () => {
          onSave();
          toast.success('Profile updated successfully');
        },
      }
    );
  };

  // Loading / not found states (unchanged)
  if (vendorLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-9 w-48 mb-8" />
          <div className="mx-auto space-y-8">
            <Skeleton className="h-96" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Profile not found</h3>
            <Button onClick={onCancel}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white rounded-lg">
      <div className="container mx-auto px-4 py-8">
        {/* Header (unchanged) */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Edit Profile
            </h1>
            <p className="text-muted-foreground">
              Update your business information
            </p>
          </div>
        </div>

        <div className="mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information (unchanged) */}
            <Card className="shadow-party border-primary/20">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-foreground">
                    Business Logo
                  </label>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      {formData.logoPreview ? (
                        <>
                          <img
                            src={formData.logoPreview}
                            alt="Logo preview"
                            className="w-20 h-20 rounded-full object-cover border-2 border-border"
                          />
                          {formData.logo && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  logo: null,
                                  logoPreview: vendor.logoUrl || '',
                                }));
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                          <Upload className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="inline-flex items-center px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {formData.logo ? 'Change Logo' : 'Upload Logo'}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: Square image, max 5MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Business Name *
                    </label>
                    <Input
                      value={formData.businessName}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                      className="border-border "
                      placeholder="Your business name"
                    />
                    {errors.businessName && <p className="text-sm text-destructive">{errors.businessName}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Contact Email *
                    </label>
                    <Input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="border-border "
                      placeholder="business@example.com"
                    />
                    {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Business Description *
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="border-border  resize-none"
                    rows={4}
                    placeholder="Tell customers about your business, services, and what makes you special..."
                  />
                  {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">State *</label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">City *</label>
                    <Select
                      key={formData.state}
                      value={formData.city}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                      disabled={!formData.state}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.state ? "Select city" : "Select state first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.state &&
                          US_STATES_AND_CITIES[formData.state]?.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Contact Phone</label>
                  <Input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                    className="border-border "
                    placeholder="(555) 123-4567"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Categories (unchanged) */}
            <Card className="shadow-party">
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ... primary & secondary categories ... */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Primary Category *
                  </label>
                  <Select
                    value={formData.primaryCategory}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, primaryCategory: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.primaryCategory && <p className="text-sm text-destructive">{errors.primaryCategory}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Secondary Categories (Optional - Max 3)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-border rounded-lg">
                    {categories
                      ?.filter(cat => cat.id !== formData.primaryCategory)
                      .map((cat) => (
                        <div key={cat.id} className="flex items-center gap-2">
                          <Checkbox
                            id={cat.id}
                            checked={formData.secondaryCategories.includes(cat.id)}
                            onCheckedChange={() => toggleSecondaryCategory(cat.id)}
                          />
                          <label htmlFor={cat.id} className="text-sm cursor-pointer">
                            {cat.name}
                          </label>
                        </div>
                      ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selected: {formData.secondaryCategories.length} of 3
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* ── New: Promote Your Business Section ──────────────────────────────── */}
            <Card className="shadow-party border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Promote Your Business
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Add your social profiles and website so customers can find you online.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Instagram</label>
                    <Input
                      type="url"
                      value={formData.socialLinks.instagram || ''}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, instagram: e.target.value.trim() || undefined },
                        }))
                      }
                      placeholder="https://www.instagram.com/yourhandle"
                      className="border-border "
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">TikTok</label>
                    <Input
                      type="url"
                      value={formData.socialLinks.tiktok || ''}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, tiktok: e.target.value.trim() || undefined },
                        }))
                      }
                      placeholder="https://www.tiktok.com/@yourhandle"
                      className="border-border "
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Facebook</label>
                    <Input
                      type="url"
                      value={formData.socialLinks.facebook || ''}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, facebook: e.target.value.trim() || undefined },
                        }))
                      }
                      placeholder="https://www.facebook.com/yourpage"
                      className="border-border "
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Website</label>
                    <Input
                      type="url"
                      value={formData.socialLinks.website || ''}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, website: e.target.value.trim() || undefined },
                        }))
                      }
                      placeholder="https://yourbusiness.com"
                      className="border-border "
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Paste full links (starting with https://). Leave blank if not applicable.
                </p>
              </CardContent>
            </Card>
            {/* ─────────────────────────────────────────────────────────────────────── */}

            {/* Form Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="gradient-party text-white px-8"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};