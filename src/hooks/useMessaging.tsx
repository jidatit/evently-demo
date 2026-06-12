
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type MessageType = 'text' | 'image' | 'pdf' | 'system';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: MessageType;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  vendor_id: string;
  customer_id: string;
  booking_id: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  vendor?: {
    business_name: string;
    logo_url: string | null;
  };
  customer?: {
    name: string | null;
    email: string | null;
  };
}

interface MessagingContextType {
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  unreadCounts: { [conversationId: string]: number };
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, messageType?: MessageType, attachmentUrl?: string, attachmentName?: string) => Promise<void>;
  uploadAttachment: (file: File, conversationId: string) => Promise<string>;
  markAsRead: (conversationId: string) => Promise<void>;
  loading: boolean;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({});
  const [unreadCounts, setUnreadCounts] = useState<{ [conversationId: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadConversations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          vendor:vendors(business_name, logo_url),
          customer:profiles(name, email)
        `)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      
      setConversations((data as any[]).map(conv => ({
        ...conv,
        vendor: conv.vendor || undefined,
        customer: conv.customer || undefined
      })));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading conversations",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(prev => ({
        ...prev,
        [conversationId]: (data || []).map(msg => ({
          ...msg,
          message_type: msg.message_type as MessageType
        }))
      }));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading messages",
        description: error.message,
      });
    }
  };

  const sendMessage = async (
    conversationId: string, 
    content: string, 
    messageType: MessageType = 'text',
    attachmentUrl?: string,
    attachmentName?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          message_type: messageType,
          attachment_url: attachmentUrl || null,
          attachment_name: attachmentName || null,
          sender_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), {
          ...data,
          message_type: data.message_type as MessageType
        }]
      }));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: error.message,
      });
    }
  };

  const uploadAttachment = async (file: File, conversationId: string): Promise<string> => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.data.user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error uploading attachment",
        description: error.message,
      });
      throw error;
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.data.user.id)
        .is('read_at', null);

      if (error) throw error;

      // Update unread counts
      setUnreadCounts(prev => ({
        ...prev,
        [conversationId]: 0
      }));
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <MessagingContext.Provider value={{
      conversations,
      messages,
      unreadCounts,
      fetchMessages,
      sendMessage,
      uploadAttachment,
      markAsRead,
      loading
    }}>
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};
