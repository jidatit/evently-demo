
import React from 'react';
import { Conversation } from '@/hooks/useMessaging';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Users } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation?: string;
  onSelectConversation: (conversationId: string) => void;
  unreadCounts: { [conversationId: string]: number };
  currentUserId?: string;
}

const ConversationList = ({ 
  conversations, 
  selectedConversation, 
  onSelectConversation, 
  unreadCounts,
  currentUserId 
}: ConversationListProps) => {
  const getConversationTitle = (conversation: Conversation) => {
    // If current user is the customer, show vendor name
    if (conversation.customer_id === currentUserId) {
      return conversation.vendor?.business_name || 'Vendor';
    }
    // If current user is the vendor, show customer name
    return conversation.customer?.name || conversation.customer?.email || 'Customer';
  };

  const getConversationSubtitle = (conversation: Conversation) => {
    if (conversation.customer_id === currentUserId) {
      return 'Vendor';
    }
    return 'Customer';
  };

  const formatLastMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No conversations yet</h3>
        <p className="text-sm text-muted-foreground">
          Start a conversation with a vendor or customer to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="border-r border-border bg-card">
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Messages</h2>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {conversations.map((conversation) => {
            const unreadCount = unreadCounts[conversation.id] || 0;
            const isSelected = selectedConversation === conversation.id;
            
            return (
              <Button
                key={conversation.id}
                variant={isSelected ? "secondary" : "ghost"}
                className="w-full justify-start p-3 h-auto mb-2 hover:bg-muted/50 transition-colors"
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-start space-x-3 w-full text-left">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getConversationTitle(conversation).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm text-foreground truncate">
                        {getConversationTitle(conversation)}
                      </h4>
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2 min-w-5 h-5 text-xs px-1.5">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate">
                        {getConversationSubtitle(conversation)}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatLastMessageTime(conversation.last_message_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationList;
