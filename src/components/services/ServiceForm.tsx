// src/components/service/ServiceForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { X, Upload, Loader2, DollarSign, Clock, Play, Eye } from 'lucide-react';
import { useCreateService, useUpdateService } from '@/features/services/hooks';
import { serviceFormSchema, type ServiceFormSchema, type Service } from '@/features/services/types';
import { toast } from 'sonner';

interface ServiceFormProps {
    vendorId: string;
    service?: Service | null;
    onClose: () => void;
}

const MAX_MEDIA_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface MediaFile {
    file: File;
    preview: string;
    type: 'image' | 'video';
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
    vendorId,
    service,
    onClose,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { mutate: createService, isPending: isCreating } = useCreateService();
    const { mutate: updateService, isPending: isUpdating } = useUpdateService();
    const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

    const isEditMode = !!service;
    const isPending = isCreating || isUpdating;

    // Media state (not part of form validation)
    const [media, setMedia] = useState<MediaFile[]>([]);
    const [existingMedia, setExistingMedia] = useState<typeof service.media>([]);
    const [deleteMediaIds, setDeleteMediaIds] = useState<string[]>([]);

    // Initialize react-hook-form with Zod validation
    const form = useForm<ServiceFormSchema>({
        resolver: zodResolver(serviceFormSchema),
        defaultValues: {
            name: '',
            description: '',
            price: '',
            pricingType: 'per_event',
            durationMinutes: '60',
        },
        mode: 'onChange', // Validate on change for real-time feedback
    });

    // Populate form in edit mode
    useEffect(() => {
        if (service) {
            console.log('Populating form for edit mode with service:', service);
            form.reset({
                name: service.name,
                description: service.description,
                price: service.price !== null ? service.price.toString() : '',
                pricingType: service.pricingType,
                durationMinutes: service.durationMinutes?.toString() || '',
            });
            setExistingMedia(service.media || []);
        }
    }, [service, form]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const totalMedia = existingMedia.length + media.length;

        if (totalMedia + files.length > MAX_MEDIA_FILES) {
            toast.error('Too many files', {
                description: `Maximum ${MAX_MEDIA_FILES} media files allowed per service`,
            });
            return;
        }

        const validFiles: MediaFile[] = [];

        for (const file of files) {
            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`${file.name} is too large`, {
                    description: 'Maximum file size is 10MB',
                });
                continue;
            }

            // Validate file type
            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                toast.error(`${file.name} is not supported`, {
                    description: 'Only images and videos are allowed',
                });
                continue;
            }

            // Create preview
            const preview = URL.createObjectURL(file);
            validFiles.push({
                file,
                preview,
                type: file.type.startsWith('image/') ? 'image' : 'video',
            });
        }

        setMedia((prev) => [...prev, ...validFiles]);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeNewMedia = (index: number) => {
        setMedia((prev) => {
            const newMedia = [...prev];
            URL.revokeObjectURL(newMedia[index].preview);
            newMedia.splice(index, 1);
            return newMedia;
        });
    };

    const removeExistingMedia = (mediaId: string) => {
        setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId));
        setDeleteMediaIds((prev) => [...prev, mediaId]);
    };

    const onSubmit = (data: ServiceFormSchema) => {
        const price = data.price ? parseFloat(data.price) : null;
        const durationMinutes = data.durationMinutes ? parseInt(data.durationMinutes) : null;

        if (isEditMode) {
            updateService(
                {
                    serviceId: service.id,
                    vendorId,
                    name: data.name,
                    description: data.description,
                    price,
                    pricingType: data.pricingType,
                    durationMinutes,
                    newMediaFiles: media.map((m) => m.file),
                    deleteMediaIds,
                },
                {
                    onSuccess: () => {
                        // Clean up preview URLs
                        media.forEach((m) => URL.revokeObjectURL(m.preview));
                        onClose();
                    },
                }
            );
        } else {
            createService(
                {
                    vendorId,
                    name: data.name,
                    description: data.description,
                    price,
                    pricingType: data.pricingType,
                    durationMinutes,
                    mediaFiles: media.map((m) => m.file),
                },
                {
                    onSuccess: () => {
                        // Clean up preview URLs
                        media.forEach((m) => URL.revokeObjectURL(m.preview));
                        onClose();
                    },
                }
            );
        }
    };

    const totalMediaCount = existingMedia.length + media.length;

    return (
        <>
            <Dialog open onOpenChange={onClose}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
                    {/* Sticky Header */}
                    <DialogHeader className="px-6 py-4 border-b shrink-0">
                        <DialogTitle className="text-2xl font-heading">
                            {isEditMode ? 'Edit Service' : 'Add New Service'}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <Form {...form}>
                            <form id="service-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <FormField

                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Service Name *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className='border border-border'
                                                        placeholder="e.g., Wedding Photography Package"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description *</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describe your service in detail..."
                                                        className="resize-none border border-border"
                                                        rows={4}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                                        <FormField
                                            control={form.control}
                                            name="pricingType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Pricing Type *</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className='border border-border'>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="per_hour">Per Hour</SelectItem>
                                                            <SelectItem value="per_event">Per Event</SelectItem>
                                                            <SelectItem value="per_day">Per Day</SelectItem>
                                                            <SelectItem value="quote">Quote</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Price {form.watch('pricingType') !== 'quote' && '*'}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <DollarSign className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                                                            <Input
                                                                type="number"
                                                                placeholder={
                                                                    form.watch('pricingType') === 'quote' ? 'N/A' : '0.00'
                                                                }
                                                                className="pl-10 border border-border"
                                                                min="0"
                                                                step="0.01"
                                                                disabled={form.watch('pricingType') === 'quote'}
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="durationMinutes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Duration (minutes)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Clock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                                                        <Input
                                                            type="number"
                                                            placeholder="60"
                                                            className="pl-10"
                                                            min="1"
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Media Section */}
                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">Photos & Videos</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Showcase your work ({totalMediaCount}/{MAX_MEDIA_FILES})
                                            </p>
                                        </div>
                                    </div>

                                    {/* Upload Area */}
                                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                                        <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept="image/*,video/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={totalMediaCount >= MAX_MEDIA_FILES}
                                            className="mb-2"
                                        >
                                            Choose Files
                                        </Button>
                                        <p className="text-sm text-muted-foreground">
                                            or drag and drop files here
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Max 10MB per file • Images and videos only
                                        </p>
                                    </div>

                                    {/* Media Gallery */}
                                    {(existingMedia.length > 0 || media.length > 0) && (
                                        <div className="space-y-3">
                                            {existingMedia.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium mb-2">Existing Media</p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                                        {existingMedia.map((mediaItem) => (
                                                            <div key={mediaItem.id} className="relative group">
                                                                {mediaItem.fileType === 'image' ? (
                                                                    <img
                                                                        src={mediaItem.fileUrl}
                                                                        alt={mediaItem.fileName}
                                                                        className="w-full h-28 object-cover rounded-lg border-2 border-border group-hover:border-primary transition-colors"
                                                                    />
                                                                ) : (
                                                                    <div className="relative w-full h-28 bg-muted rounded-lg border-2 border-border group-hover:border-primary transition-colors overflow-hidden">
                                                                        <video
                                                                            src={mediaItem.fileUrl}
                                                                            className="w-full h-full object-cover"
                                                                            muted
                                                                            playsInline
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                                            <Play className="w-8 h-8 text-white" />
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setPreviewMedia({
                                                                            url: mediaItem.fileUrl,
                                                                            type: mediaItem.fileType,
                                                                        })
                                                                    }
                                                                    className="absolute top-2 right-10 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                                                                >
                                                                    <Eye className="w-3 h-3" />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeExistingMedia(mediaItem.id)}
                                                                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>

                                                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1.5 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity truncate">
                                                                    {mediaItem.fileName}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {media.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium mb-2">New Media</p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                                        {media.map((mediaItem, index) => (
                                                            <div key={index} className="relative group">
                                                                {mediaItem.type === 'image' ? (
                                                                    <img
                                                                        src={mediaItem.preview}
                                                                        alt={`Preview ${index + 1}`}
                                                                        className="w-full h-28 object-cover rounded-lg border-2 border-border group-hover:border-primary transition-colors"
                                                                    />
                                                                ) : (
                                                                    <div className="relative w-full h-28 bg-muted rounded-lg border-2 border-border group-hover:border-primary transition-colors overflow-hidden">
                                                                        <video
                                                                            src={mediaItem.preview}
                                                                            className="w-full h-full object-cover"
                                                                            muted
                                                                            playsInline
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                                            <Play className="w-8 h-8 text-white" />
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setPreviewMedia({
                                                                            url: mediaItem.preview,
                                                                            type: mediaItem.type,
                                                                        })
                                                                    }
                                                                    className="absolute top-2 right-10 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                                                                >
                                                                    <Eye className="w-3 h-3" />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeNewMedia(index)}
                                                                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>

                                                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1.5 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity truncate">
                                                                    {mediaItem.file.name}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </form>
                        </Form>
                    </div>

                    {/* Sticky Footer */}
                    <DialogFooter className="px-6 py-4 border-t shrink-0">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="service-form"
                            className="gradient-party text-white"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {isEditMode ? 'Updating...' : 'Creating...'}
                                </>
                            ) : isEditMode ? (
                                'Update Service'
                            ) : (
                                'Add Service'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Media Preview Dialog */}
            {previewMedia && (
                <Dialog open onOpenChange={() => setPreviewMedia(null)}>
                    <DialogContent className="max-w-5xl max-h-[90vh] p-2">
                        <div className="relative w-full h-full flex items-center justify-center">
                            {previewMedia.type === 'image' ? (
                                <img
                                    src={previewMedia.url}
                                    alt="Preview"
                                    className="max-w-full max-h-[85vh] object-contain rounded-lg"
                                />
                            ) : (
                                <video
                                    src={previewMedia.url}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[85vh] object-contain rounded-lg"
                                />
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};