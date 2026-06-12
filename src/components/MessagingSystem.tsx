
import React, { useState, useEffect, useRef } from 'react';
import { useMessaging, Message } from '@/hooks/useMessaging';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import ConversationList from '@/components/ConversationList';
import MessageBubble from '@/components/MessageBubble';
import MessageInput from '@/components/MessageInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  ArrowLeft, 
  Phone, 
  Video, 
  MoreVertical 
} from 'lucide-react';
import { toast } from 'sonner';

const MessagingSystem = () => {
  const { user } = useConsolidatedAuth();
  const {
    conversations,
    messages,
    loading,
    unreadCounts,
    fetchMessages,
    sendMessage,
    markAsRead,
    uploadAttachment
  } = useMessaging();

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const conversationMessages = selectedConversation ? messages[selectedConversation] || [] : [];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      markAsRead(selectedConversation);
    }
  }, [selectedConversation]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
  };

  const handleSendMessage = async (
    content: string, 
    messageType: 'text' | 'image' | 'pdf' = 'text', 
    attachmentUrl?: string, 
    attachmentName?: string
  ) => {
    if (!selectedConversation) return;
    
    await sendMessage(selectedConversation, content, messageType, attachmentUrl, attachmentName);
  };

  const handleUploadAttachment = async (file: File): Promise<string> => {
    if (!selectedConversation) throw new Error('No conversation selected');
    
    return uploadAttachment(file, selectedConversation);
  };

  const getOtherParticipantName = (conversation: any) => {
    if (!user) return 'Unknown';
    
    if (conversation.customer_id === user.id) {
      return conversation.vendor?.business_name || 'Vendor';
    }
    return conversation.customer?.name || conversation.customer?.email || 'Customer';
  };

  if (loading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List */}
        <div className={`w-80 border-r border-border ${selectedConversation ? 'hidden md:block' : 'block'}`}>
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation || undefined}
            onSelectConversation={handleSelectConversation}
            unreadCounts={unreadCounts}
            currentUserId={user?.id}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation && currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {getOtherParticipantName(currentConversation)}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {currentConversation.customer_id === user?.id ? 'Vendor' : 'Customer'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" disabled>
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {conversationMessages.map((message: Message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.sender_id === user?.id}
                      senderName={
                        message.sender_id === user?.id 
                          ? 'You' 
                          : getOtherParticipantName(currentConversation)
                      }
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <MessageInput
                onSendMessage={handleSendMessage}
                onUploadAttachment={handleUploadAttachment}
              />
            </>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Welcome to Book'D Messages
                </h3>
                <p className="text-muted-foreground">
                  Select a conversation to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MessagingSystem;
