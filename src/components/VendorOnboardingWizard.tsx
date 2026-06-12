import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckCircle,
  Upload,
  CreditCard,
  Eye,
  ArrowRight,
  ArrowLeft,
  X,
  Trash2,
  Image as ImageIcon,
  Play,
} from 'lucide-react';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { toast } from 'sonner';
import { fetchCategoriesMock } from '@/mocks/handlers/categories';
import {
  completeVendorOnboardingMock,
  isProfileSlugAvailableMock,
  uploadVendorLogoMock,
} from '@/mocks/handlers/vendors';
import { mockUpdateUserMetadata } from '@/mocks/handlers/auth';

// Location data import
import { US_STATES, US_STATES_AND_CITIES } from '@/utils/locationData';

import { z } from 'zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

type ServiceMedia = {
  file: File;
  preview: string;
  type: 'image' | 'video';
};

interface Category {
  id: string;
  name: string;
}

type LogoState = {
  logo: File | null;
  preview: string;
};

const serviceSchema = z.object({
  name: z.string().trim().min(1, 'Service name is required'),
  description: z.string().trim().optional(),
  price: z.number().positive('Price must be greater than 0'),
  pricingType: z.enum(['per_hour', 'per_event', 'per_day']),
  duration: z.number().int().positive('Duration must be at least 1 minute'),
});

const vendorSchema = z.object({
  businessName: z.string().trim().min(1, 'Business name is required'),
  description: z.string().trim().optional(),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  contactEmail: z.string().email('Please enter a valid email').min(1, 'Contact email is required'),
  contactPhone: z.string().trim().optional(),
  primaryCategory: z.string().min(1, 'Primary category is required'),
  secondaryCategories: z.array(z.string()).optional(),
  services: z.array(serviceSchema).optional(),
});

type FormData = z.infer<typeof vendorSchema>;

const steps = [
  { id: 1, title: 'Business Profile', icon: CheckCircle },
  { id: 2, title: 'Services', icon: Upload },
  { id: 3, title: 'Payment Setup', icon: CreditCard },
  { id: 4, title: 'Preview & Launch', icon: Eye },
];

export default function VendorOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [logoState, setLogoState] = useState<LogoState>({ logo: null, preview: '' });
  const [serviceMedias, setServiceMedias] = useState<ServiceMedia[][]>([]);

  const { user } = useConsolidatedAuth();
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      businessName: '',
      description: '',
      city: '',
      state: '',
      contactEmail: '',
      contactPhone: '',
      primaryCategory: '',
      secondaryCategories: [],
      services: [],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'services',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await fetchCategoriesMock();
      setCategories(data.map((c) => ({ id: c.id, name: c.name })));
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['businessName', 'city', 'state', 'contactEmail', 'primaryCategory'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['services'];
    }

    const isValid = fieldsToValidate.length > 0 ? await form.trigger(fieldsToValidate) : true;

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } else {
      toast.error('Please correct the errors before proceeding');
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo must be less than 5MB');
        return;
      }
      const preview = URL.createObjectURL(file);
      setLogoState({ logo: file, preview });
    }
  };

  const addService = () => {
    append({
      name: '',
      description: '',
      price: 0,
      pricingType: 'per_hour',
      duration: 60,
    });
    setServiceMedias((prev) => [...prev, []]);
  };

  const deleteService = (index: number) => {
    remove(index);
    setServiceMedias((prev) => prev.filter((_, i) => i !== index));
  };

  const handleServiceMediaUpload = (serviceIndex: number, files: FileList | null) => {
    if (!files) return;

    const newMedia: ServiceMedia[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) return;

      newMedia.push({
        file,
        preview: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
      });
    });

    if (!newMedia.length) return;

    setServiceMedias((prev) =>
      prev.map((media, i) =>
        i === serviceIndex ? [...media, ...newMedia] : media
      )
    );

    // reset input so same file can be picked again
    if (mediaInputRefs.current[serviceIndex]) {
      mediaInputRefs.current[serviceIndex]!.value = '';
    }
  };

  const removeServiceMedia = (serviceIndex: number, mediaIndex: number) => {
    setServiceMedias((prev) =>
      prev.map((media, i) => {
        if (i !== serviceIndex) return media;

        const mediaToRemove = media[mediaIndex];
        if (mediaToRemove?.preview) {
          URL.revokeObjectURL(mediaToRemove.preview);
        }

        return media.filter((_, mi) => mi !== mediaIndex);
      })
    );
  };

  const completeOnboarding = async (data: FormData) => {
    if (!user) {
      toast.error('Authentication required');
      navigate('/become-vendor');
      return;
    }

    setIsLoading(true);

    try {
      let logoUrl: string | null = null;
      if (logoState.logo) {
        logoUrl = await uploadVendorLogoMock(user.id, logoState.logo);
      }

      let baseSlug = data.businessName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'vendor';

      let profileSlug = baseSlug;
      let suffix = 0;
      while (suffix < 10) {
        const available = await isProfileSlugAvailableMock(profileSlug);
        if (available) break;
        suffix++;
        profileSlug = `${baseSlug}${suffix === 1 ? '' : '-'}${suffix}`;
      }

      if (suffix >= 10) {
        throw new Error('Could not generate a unique profile slug. Please try a different business name.');
      }

      await completeVendorOnboardingMock({
        userId: user.id,
        businessName: data.businessName.trim(),
        description: data.description?.trim() || '',
        city: data.city.trim(),
        state: data.state,
        contactEmail: data.contactEmail.trim(),
        contactPhone: data.contactPhone?.trim(),
        primaryCategory: data.primaryCategory,
        secondaryCategories: data.secondaryCategories || [],
        profileSlug,
        logoUrl,
        services: (data.services || []).map((service) => ({
          name: service.name.trim(),
          description: service.description?.trim() || '',
          price: service.price,
          pricingType: service.pricingType,
          duration: service.duration,
        })),
      });

      await mockUpdateUserMetadata(user.id, { role: 'vendor' });

      toast.success("Congratulations! Your vendor profile is now live! 🎉");
      navigate('/vendor-dashboard');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.message || 'Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaInputRefs = useRef<HTMLInputElement[]>([]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-yellow-100 border-l-4 border-yellow-400 p-4 rounded-lg text-yellow-800 font-semibold text-lg">
              🎉 Special Offer: No platform fee on your first 3 bookings!
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <Label>Business Logo</Label>

              <div className="flex items-center gap-4">
                {logoState.preview ? (
                  <div className="relative">
                    <img
                      src={logoState.preview}
                      alt="Logo preview"
                      className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setLogoState({ logo: null, preview: '' })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Logo
                  </Button>

                  <p className="text-xs text-gray-500 mt-1">
                    Max 5MB. Square recommended.
                  </p>
                </div>
              </div>
            </div>

            {/* Name + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  placeholder="Your business name"

                  id="businessName"
                  {...form.register('businessName')}
                />
                {form.formState.errors.businessName && (
                  <p className="text-red-600 text-sm">{form.formState.errors.businessName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="business@example.com"
                  {...form.register('contactEmail')}
                />
                {form.formState.errors.contactEmail && (
                  <p className="text-red-600 text-sm">{form.formState.errors.contactEmail.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                {...form.register('description')}
                placeholder="Tell customers about your business..."

                rows={4}
              />
              {form.formState.errors.description && (
                <p className="text-red-600 text-sm">{form.formState.errors.description.message}</p>
              )}
            </div>

            {/* State + City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>State *</Label>
                <Controller
                  name="state"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        form.setValue('city', '');
                      }}
                      value={field.value}
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
                  )}
                />
                {form.formState.errors.state && (
                  <p className="text-red-600 text-sm">{form.formState.errors.state.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>City *</Label>
                <Controller
                  name="city"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!form.watch('state')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={form.watch('state') ? "Select city" : "Select state first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {form.watch('state') &&
                          US_STATES_AND_CITIES[form.watch('state')]?.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.city && (
                  <p className="text-red-600 text-sm">{form.formState.errors.city.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input
                {...form.register('contactPhone')}
                placeholder="(555) 123-4567"
              />
              {form.formState.errors.contactPhone && (
                <p className="text-red-600 text-sm">{form.formState.errors.contactPhone.message}</p>
              )}
            </div>

            {/* Categories */}
            <div className="space-y-6 border-t pt-6">
              <div className="space-y-2">
                <Label>Primary Category *</Label>
                <Controller
                  name="primaryCategory"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.primaryCategory && (
                  <p className="text-red-600 text-sm">{form.formState.errors.primaryCategory.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Secondary Categories (Optional)</Label>
                <Controller
                  name="secondaryCategories"
                  control={form.control}
                  render={({ field }) => (
                    <Select>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            field.value?.length
                              ? `${field.value.length} selected`
                              : "Select secondary categories"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((cat) => cat.id !== form.watch('primaryCategory'))
                          .map((cat) => (
                            <div
                              key={cat.id}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer"
                              onClick={() => {
                                const newValue = field.value?.includes(cat.id)
                                  ? field.value.filter((id) => id !== cat.id)
                                  : [...(field.value || []), cat.id];
                                field.onChange(newValue);
                              }}
                            >
                              <Checkbox
                                checked={field.value?.includes(cat.id)}
                              />
                              <span className="text-sm">{cat.name}</span>
                            </div>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.secondaryCategories && (
                  <p className="text-red-600 text-sm">{form.formState.errors.secondaryCategories.message}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Your Services (Optional)</h3>
            {fields.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Services are optional. You can add them later from your dashboard.</p>
                <Button variant="outline" onClick={addService}>
                  + Add a Service
                </Button>
              </div>
            ) : (
              <>
                {fields.map((field, index) => (
                  <Card key={field.id} className="relative">
                    <CardContent className="p-6">
                      <button
                        type="button"
                        onClick={() => deleteService(index)}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Service Name *</Label>
                          <Input
                            {...form.register(`services.${index}.name`)}
                            placeholder="e.g. Wedding Photography"
                          />
                          {form.formState.errors.services?.[index]?.name && (
                            <p className="text-red-600 text-sm">
                              {form.formState.errors.services[index].name?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Price ($) *</Label>
                          <Input
                            type="number"
                            {...form.register(`services.${index}.price`, { valueAsNumber: true })}
                            placeholder="0.00"
                          />
                          {form.formState.errors.services?.[index]?.price && (
                            <p className="text-red-600 text-sm">
                              {form.formState.errors.services[index].price?.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          {...form.register(`services.${index}.description`)}
                          placeholder="Describe this service..."
                          rows={2}
                        />
                        {form.formState.errors.services?.[index]?.description && (
                          <p className="text-red-600 text-sm">
                            {form.formState.errors.services[index].description?.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Pricing Type</Label>
                          <Controller
                            name={`services.${index}.pricingType`}
                            control={form.control}
                            render={({ field }) => (
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="per_hour">Per Hour</SelectItem>
                                  <SelectItem value="per_event">Per Event</SelectItem>
                                  <SelectItem value="per_day">Per Day</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {form.formState.errors.services?.[index]?.pricingType && (
                            <p className="text-red-600 text-sm">
                              {form.formState.errors.services[index].pricingType?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Duration (minutes)</Label>
                          <Input
                            type="number"
                            {...form.register(`services.${index}.duration`, { valueAsNumber: true })}
                          />
                          {form.formState.errors.services?.[index]?.duration && (
                            <p className="text-red-600 text-sm">
                              {form.formState.errors.services[index].duration?.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Media */}
                      <div className="mt-6">
                        <Label>Photos / Videos</Label>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mt-2 text-center">
                          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />

                          <input
                            ref={(el) => (mediaInputRefs.current[index] = el)}
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={(e) => handleServiceMediaUpload(index, e.target.files)}
                            className="hidden"
                          />

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => mediaInputRefs.current[index]?.click()}
                          >
                            Choose Files
                          </Button>

                          <p className="text-xs text-gray-500 mt-2">
                            Max 10MB per file
                          </p>
                        </div>

                        {serviceMedias[index]?.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                            {serviceMedias[index].map((media, mIndex) => (
                              <div key={mIndex} className="relative group">
                                {media.type === 'image' ? (
                                  <img
                                    src={media.preview}
                                    alt={`preview ${mIndex + 1}`}
                                    className="w-full h-24 object-cover rounded-md border"
                                  />
                                ) : (
                                  <video
                                    src={media.preview}
                                    className="w-full h-24 object-cover rounded-md border"
                                    muted
                                    playsInline
                                    preload="metadata"
                                  />
                                )}

                                {media.type === 'video' && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
                                    <Play className="h-6 w-6 text-white" />
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() => removeServiceMedia(index, mIndex)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button variant="outline" onClick={addService} className="w-full">
                  + Add Another Service
                </Button>
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3 text-lg">
                Payment Processing – Coming Soon! 💳
              </h3>
              <p className="text-blue-700">
                We're actively working on secure payment integration. For now, you can receive bookings and handle payments directly with your customers.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-medium mb-3">In the meantime, you can:</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Coordinate payments via email or phone</li>
                <li>Use your preferred payment methods (Venmo, Cash App, bank transfer, etc.)</li>
                <li>Include payment instructions in your booking confirmation</li>
              </ul>
            </div>
          </div>
        );

      case 4:
        const data = form.watch();
        const primaryCat = categories.find((c) => c.id === data.primaryCategory);
        const secondaryCats = categories.filter((c) => data.secondaryCategories?.includes(c.id));
        const validServices = data.services || [];

        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">You're Almost There!</h2>
              <p className="text-gray-600">Review your profile and launch your business</p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  {logoState.preview && (
                    <img
                      src={logoState.preview}
                      alt="Business logo"
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                  )}
                  <div>
                    <CardTitle className="text-2xl">{data.businessName || 'Your Business'}</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {primaryCat && (
                        <Badge className="bg-green-600">{primaryCat.name} (Primary)</Badge>
                      )}
                      {secondaryCats.map((cat) => (
                        <Badge key={cat.id} variant="secondary">
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {data.description && (
                  <p className="text-gray-700">{data.description}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Location:</span><br />
                    {data.city && data.state ? `${data.city}, ${data.state}` : 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span><br />
                    {data.contactEmail || 'Not set'}
                  </div>
                  {data.contactPhone && (
                    <div>
                      <span className="font-medium">Phone:</span><br />
                      {data.contactPhone}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Services:</span><br />
                    {validServices.length}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Services Offered:</h4>
                  {validServices.length === 0 ? (
                    <p className="text-gray-600">No services added yet. You can add them later.</p>
                  ) : (
                    <div className="space-y-4">
                      {validServices.map((service, i) => (
                        <div key={i} className="border-l-4 border-green-500 pl-4 py-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium">{service.name}</h5>
                              {service.description && (
                                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                              )}
                            </div>
                            <span className="font-bold text-green-700">${service.price}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-2 flex gap-4">
                            <span>{service.pricingType.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>{service.duration} min</span>
                            <span>•</span>
                            <span>{serviceMedias[i]?.length || 0} media</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="bg-green-50 p-6 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-3">What happens next?</h4>
              <ul className="space-y-2 text-green-700">
                <li>✓ Your profile will be live immediately</li>
                <li>✓ Customers can discover and book your services</li>
                <li>✓ You will receive booking notifications</li>
                <li>✓ Manage everything from your vendor dashboard</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Become a Vendor</h1>
            <span className="text-sm text-gray-500">Step {currentStep} of {steps.length}</span>
          </div>

          <Progress value={(currentStep / steps.length) * 100} className="h-2 mb-6" />

          <div className="flex justify-between">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 mb-2 transition-colors ${currentStep >= step.id
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-gray-300 text-gray-400'
                    }`}
                >
                  <step.icon className="h-6 w-6" />
                </div>
                <span
                  className={`text-xs font-medium ${currentStep >= step.id ? 'text-green-700' : 'text-gray-500'
                    }`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{steps[currentStep - 1]?.title}</CardTitle>
          </CardHeader>
          <CardContent>{renderStepContent()}</CardContent>
        </Card>

        <div className="flex justify-between mt-10">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isLoading}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={form.handleSubmit(completeOnboarding)}
              disabled={isLoading}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Launching...' : 'Launch My Business'}
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}