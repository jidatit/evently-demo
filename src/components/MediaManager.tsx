
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DragDropMediaUpload from './DragDropMediaUpload';

interface MediaManagerProps {
  vendor: any;
}

const MediaManager: React.FC<MediaManagerProps> = ({ vendor }) => {
  const [uploading, setUploading] = useState(false);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMedia();
  }, [vendor.id]);

  const fetchMedia = async () => {
    try {
      const { data: mediaData, error } = await supabase
        .from('vendor_media')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedia(mediaData || []);
    } catch (error: any) {
      console.error('Error fetching media:', error);
      toast({
        title: 'Error',
        description: 'Failed to load media files',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${vendor.user_id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('vendor-media')
          .upload(fileName, file, {
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('vendor-media')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase
          .from('vendor_media')
          .insert({
            vendor_id: vendor.id,
            file_name: file.name,
            file_url: data.publicUrl,
            file_type: file.type.startsWith('image/') ? 'image' : 'video',
            mime_type: file.type,
            file_size: file.size,
          });

        if (dbError) throw dbError;
      });

      await Promise.all(uploadPromises);
      
      toast({
        title: 'Success',
        description: `${files.length} file(s) uploaded successfully!`,
      });
      
      await fetchMedia();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload files',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string, fileUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${vendor.user_id}/${fileName}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('vendor-media')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('vendor_media')
        .delete()
        .eq('id', mediaId);

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Media deleted successfully!',
      });
      
      await fetchMedia();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete media',
        variant: 'destructive',
      });
    }
  };

  const previewVendorPage = () => {
    window.open(`/vendor/${vendor.id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Loading media...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-black">Media Gallery</h3>
            <p className="text-gray-600 mt-1">Upload photos and videos to showcase your services</p>
          </div>
          <Button
            onClick={previewVendorPage}
            variant="outline"
            className="bg-lime-500 text-black hover:bg-black hover:text-lime-500 font-semibold"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Profile
          </Button>
        </div>
        
        {/* Drag & Drop Upload */}
        <DragDropMediaUpload
          onUpload={handleFileUpload}
          uploading={uploading}
          accept="image/*,video/*"
          maxFiles={20}
        />
      </div>

      {/* Media Grid */}
      {media.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-black">Your Media ({media.length})</h4>
            <div className="text-sm text-gray-500">
              Click and hold to rearrange • Right-click to delete
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {media.map((item) => (
              <div key={item.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-lime-500 transition-colors">
                  {item.file_type === 'image' ? (
                    <img
                      src={item.file_url}
                      alt={item.file_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-400" />
                      <video
                        src={item.file_url}
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                        muted
                        preload="metadata"
                      />
                    </div>
                  )}
                  
                  {/* Overlay with delete button */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                    <button
                      onClick={() => handleDeleteMedia(item.id, item.file_url)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* File info */}
                <div className="mt-2 text-xs text-gray-500">
                  <div className="font-medium truncate" title={item.file_name}>
                    {item.file_name}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="capitalize">{item.file_type}</span>
                    <span>{(item.file_size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {media.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Eye className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No media uploaded yet</h3>
          <p className="text-gray-500">
            Upload your first photos or videos to start building your portfolio
          </p>
        </div>
      )}
    </div>
  );
};

export default MediaManager;
