
-- Create messages table for storing chat messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID REFERENCES auth.users NOT NULL,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'pdf', 'system')),
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_size INTEGER,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table for managing chat threads
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES public.vendors(id) NOT NULL,
  customer_id UUID REFERENCES auth.users NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, customer_id, booking_id)
);

-- Create message notifications table
CREATE TABLE public.message_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  message_id UUID REFERENCES public.messages(id) NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id)
);

-- Enable RLS on all tables
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY "Users can view messages in their conversations" 
  ON public.messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = messages.conversation_id 
      AND (
        c.customer_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.vendors v 
          WHERE v.id = c.vendor_id AND v.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert messages in their conversations" 
  ON public.messages FOR INSERT 
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = messages.conversation_id 
      AND (
        c.customer_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.vendors v 
          WHERE v.id = c.vendor_id AND v.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their own messages" 
  ON public.messages FOR UPDATE 
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- RLS policies for conversations
CREATE POLICY "Users can view their conversations" 
  ON public.conversations FOR SELECT 
  USING (
    customer_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.vendors v 
      WHERE v.id = conversations.vendor_id AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" 
  ON public.conversations FOR INSERT 
  WITH CHECK (
    customer_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.vendors v 
      WHERE v.id = conversations.vendor_id AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their conversations" 
  ON public.conversations FOR UPDATE 
  USING (
    customer_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.vendors v 
      WHERE v.id = conversations.vendor_id AND v.user_id = auth.uid()
    )
  );

-- RLS policies for message notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.message_notifications FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" 
  ON public.message_notifications FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
  ON public.message_notifications FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create function to update conversation's last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET last_message_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating conversation timestamp
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Create function to create notifications for new messages
CREATE OR REPLACE FUNCTION create_message_notifications()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
BEGIN
  -- Get the recipient (the other person in the conversation)
  SELECT CASE 
    WHEN c.customer_id = NEW.sender_id THEN v.user_id 
    ELSE c.customer_id 
  END INTO recipient_id
  FROM public.conversations c
  LEFT JOIN public.vendors v ON v.id = c.vendor_id
  WHERE c.id = NEW.conversation_id;
  
  -- Create notification for the recipient
  IF recipient_id IS NOT NULL AND recipient_id != NEW.sender_id THEN
    INSERT INTO public.message_notifications (user_id, message_id, conversation_id)
    VALUES (recipient_id, NEW.id, NEW.conversation_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message notifications
CREATE TRIGGER create_message_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notifications();

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('message-attachments', 'message-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for message attachments bucket
CREATE POLICY "Users can upload message attachments" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'message-attachments' AND 
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view message attachments in their conversations" 
  ON storage.objects FOR SELECT 
  USING (
    bucket_id = 'message-attachments' AND 
    auth.uid() IS NOT NULL AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.conversations c ON c.id = m.conversation_id
        WHERE m.attachment_url LIKE '%' || name || '%'
        AND (
          c.customer_id = auth.uid() OR 
          EXISTS (
            SELECT 1 FROM public.vendors v 
            WHERE v.id = c.vendor_id AND v.user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Users can delete their own message attachments" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'message-attachments' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );
