
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, Video, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DragDropMediaUploadProps {
  onUpload: (files: File[]) => void;
  uploading: boolean;
  accept?: string;
  maxFiles?: number;
}

const DragDropMediaUpload: React.FC<DragDropMediaUploadProps> = ({
  onUpload,
  uploading,
  accept = "image/*,video/*",
  maxFiles = 10
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    // Validate file types
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/') || file.type.startsWith('video/');
      if (!isValid) {
        toast({
          title: 'Invalid File Type',
          description: `${file.name} is not a valid image or video file`,
          variant: 'destructive',
        });
      }
      return isValid;
    });

    // Validate file sizes (50MB max)
    const sizeValidFiles = validFiles.filter(file => {
      const isValidSize = file.size <= 50 * 1024 * 1024;
      if (!isValidSize) {
        toast({
          title: 'File Too Large',
          description: `${file.name} exceeds 50MB limit`,
          variant: 'destructive',
        });
      }
      return isValidSize;
    });

    // Check total file count
    if (selectedFiles.length + sizeValidFiles.length > maxFiles) {
      toast({
        title: 'Too Many Files',
        description: `Maximum ${maxFiles} files allowed`,
        variant: 'destructive',
      });
      return;
    }

    setSelectedFiles(prev => [...prev, ...sizeValidFiles]);
  }, [selectedFiles.length, maxFiles, toast]);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
      setSelectedFiles([]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragActive 
            ? 'border-lime-500 bg-lime-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <FileImage className="w-12 h-12 text-gray-400" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {dragActive ? 'Drop files here' : 'Upload your media'}
            </h3>
            <p className="text-gray-500 mt-1">
              Drag & drop images or videos, or click to browse
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Supports images and videos up to 50MB each
            </p>
          </div>
          
          <Button
            type="button"
            variant="outline"
            className="bg-lime-500 text-black hover:bg-black hover:text-lime-500"
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
          </Button>
        </div>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Selected Files ({selectedFiles.length})</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Remove button */}
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="mt-1 text-xs text-gray-500 truncate">
                  <div className="font-medium">{file.name}</div>
                  <div>{formatFileSize(file.size)}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="bg-lime-500 text-black hover:bg-black hover:text-lime-500"
            >
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`}
            </Button>
            
            <Button
              onClick={() => setSelectedFiles([])}
              variant="outline"
              disabled={uploading}
            >
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropMediaUpload;
