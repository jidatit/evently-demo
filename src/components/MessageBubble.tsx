
import React from 'react';
import { Message } from '@/hooks/useMessaging';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Download, FileText, Image as ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName?: string;
  senderAvatar?: string;
}

const MessageBubble = ({ message, isOwn, senderName, senderAvatar }: MessageBubbleProps) => {
  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const renderAttachment = () => {
    if (!message.attachment_url) return null;

    const isImage = message.message_type === 'image';
    const isPdf = message.message_type === 'pdf';

    if (isImage) {
      return (
        <div className="mt-2">
          <img 
            src={message.attachment_url} 
            alt={message.attachment_name || 'Image'}
            className="max-w-xs max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.attachment_url!, '_blank')}
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="mt-2 p-3 bg-muted rounded-lg border border-border">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {message.attachment_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {message.attachment_size ? `${Math.round(message.attachment_size / 1024)} KB` : 'PDF'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(message.attachment_url!, '_blank')}
              className="shrink-0"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`flex items-start space-x-3 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {!isOwn && (
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage src={senderAvatar} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {senderName?.slice(0, 2).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'ml-auto' : ''}`}>
        <div className={`rounded-2xl px-4 py-2 ${
          isOwn 
            ? 'bg-primary text-primary-foreground ml-auto' 
            : 'bg-muted text-foreground'
        }`}>
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
          {renderAttachment()}
        </div>
        
        <div className={`mt-1 flex items-center space-x-2 text-xs text-muted-foreground ${
          isOwn ? 'flex-row-reverse space-x-reverse' : ''
        }`}>
          <span>{formatTime(message.created_at)}</span>
          {message.read_at && isOwn && (
            <span className="text-primary">✓ Read</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
