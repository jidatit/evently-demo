
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  X,
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

interface MessageInputProps {
  onSendMessage: (content: string, messageType?: 'text' | 'image' | 'pdf', attachmentUrl?: string, attachmentName?: string) => Promise<void>;
  onUploadAttachment: (file: File) => Promise<string>;
  disabled?: boolean;
}

const MessageInput = ({ onSendMessage, onUploadAttachment, disabled }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if ((!message.trim() && !selectedFile) || sending) return;

    setSending(true);
    try {
      if (selectedFile) {
        // Upload attachment first
        const attachmentUrl = await onUploadAttachment(selectedFile);
        const messageType = selectedFile.type.startsWith('image/') ? 'image' : 'pdf';
        
        await onSendMessage(
          message.trim() || `Sent ${messageType === 'image' ? 'an image' : 'a document'}`,
          messageType,
          attachmentUrl,
          selectedFile.name
        );
        
        setSelectedFile(null);
      } else {
        await onSendMessage(message.trim());
      }
      
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (type === 'image' && !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (type === 'file' && file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Clear the input
    event.target.value = '';
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="border-t border-border bg-card p-4">
      {/* File attachment preview */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-muted rounded-lg border border-border">
          <div className="flex items-center space-x-3">
            {selectedFile.type.startsWith('image/') ? (
              <ImageIcon className="w-8 h-8 text-primary" />
            ) : (
              <FileText className="w-8 h-8 text-primary" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {Math.round(selectedFile.size / 1024)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-end space-x-2">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[44px] max-h-32 resize-none border-input focus:border-primary"
            disabled={disabled || sending}
          />
        </div>

        <div className="flex items-center space-x-1">
          {/* Image attachment button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled || sending}
            className="shrink-0"
            title="Attach image"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>

          {/* PDF attachment button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || sending}
            className="shrink-0"
            title="Attach PDF"
          >
            <FileText className="w-4 h-4" />
          </Button>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={disabled || sending || (!message.trim() && !selectedFile)}
            size="sm"
            className="shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <Input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={(e) => handleFileSelect(e, 'file')}
        className="hidden"
      />
      <Input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, 'image')}
        className="hidden"
      />
    </div>
  );
};

export default MessageInput;
