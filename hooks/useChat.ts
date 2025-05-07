import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import * as Crypto from 'expo-crypto';
import { 
  mockConversations, 
  mockConversationDetails,
  updateMockChatUserIds,
  ChatConversation,
  ChatMessage,
  ChatParticipant,
  ConversationDetails
} from '../lib/__mocks__/chat';

// Define interfaces to match Supabase query returns
interface UserProfile {
  full_name: string;
  avatar_url: string | null;
}

interface ParticipantData {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  user_profiles: UserProfile[];
}

interface MessageData {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_profiles: UserProfile[];
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuth();
  const userId = user?.id;

  // Fetch all conversations for the current user
  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get conversations where the current user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('chat_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (participantError) throw participantError;

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        return;
      }

      // Extract conversation IDs
      const conversationIds = participantData.map(p => p.conversation_id);

      // Get conversation details with last message
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('chat_conversations')
        .select(`
          id,
          created_at,
          chat_messages!inner (
            id,
            content,
            created_at,
            sender_id
          )
        `)
        .in('id', conversationIds)
        .order('created_at', { foreignTable: 'chat_messages', ascending: false })
        .limit(1, { foreignTable: 'chat_messages' });

      if (conversationsError) throw conversationsError;

      // Format the data
      const formattedConversations: ChatConversation[] = (conversationsData || []).map(conv => {
        const lastMessage = conv.chat_messages && conv.chat_messages.length > 0
          ? conv.chat_messages[0]
          : null;
        
        return {
          id: conv.id,
          created_at: conv.created_at,
          last_message: lastMessage ? (lastMessage.content || 'Shared an image') : undefined,
          last_message_at: lastMessage ? lastMessage.created_at : undefined
        };
      });

      setConversations(formattedConversations);
    } catch (e: unknown) {
      console.error('Error fetching conversations:', e instanceof Error ? e.message : 'Unknown error');
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      
      // Use mock data as fallback
      if (userId) {
        updateMockChatUserIds(userId);
      }
      setConversations(mockConversations);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Create a new conversation
  const createConversation = async (participantIds: string[]) => {
    if (!userId) return { error: 'User not authenticated' };

    // Ensure the current user is included in participants
    if (!participantIds.includes(userId)) {
      participantIds.push(userId);
    }

    try {
      // Create new conversation
      const newConversationId = Crypto.randomUUID();

      const { error: conversationError } = await supabase
        .from('chat_conversations')
        .insert({ id: newConversationId });

      if (conversationError) throw conversationError;

      const conversationId = newConversationId; // Use the generated ID

      // Add participants
      const participantsToInsert = participantIds.map(participantId => ({
        conversation_id: conversationId,
        user_id: participantId
      }));

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participantsToInsert);

      if (participantsError) throw participantsError;

      // Refresh conversations list
      fetchConversations();

      return { data: { conversationId } }; // Return the generated ID
    } catch (e: unknown) {
      console.error('Error creating conversation:', e instanceof Error ? e.message : 'Unknown error');
      return { error: e instanceof Error ? e.message : 'An unknown error occurred' };
    }
  };

  // Function to handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    refreshing,
    onRefresh,
    createConversation
  };
};

export const useConversationDetails = (conversationId: string) => {
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuth();
  const userId = user?.id;

  // Fetch conversation details: participants and messages
  const fetchConversationDetails = useCallback(async () => {
    if (!conversationId || !userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get conversation info first
      const { data: conversationData, error: conversationError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (conversationError) throw conversationError;

      // Get participants and their profiles
      const { data: participantsData, error: participantsError } = await supabase
        .from('chat_participants')
        .select(`
          id,
          conversation_id,
          user_id,
          joined_at,
          user_profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId);

      if (participantsError) throw participantsError;

      // Format participants
      const formattedParticipants: ChatParticipant[] = (participantsData || []).map((p: any) => {
        return {
          id: p.id,
          conversation_id: p.conversation_id,
          user_id: p.user_id,
          joined_at: p.joined_at,
          user_name: p.user_profiles?.[0]?.full_name || 'Unknown User',
          user_avatar: p.user_profiles?.[0]?.avatar_url || null,
          is_current_user: p.user_id === userId
        };
      });

      setParticipants(formattedParticipants);

      // Get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          image_url,
          created_at,
          user_profiles:sender_id (
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Format messages
      const formattedMessages: ChatMessage[] = (messagesData || []).map((m: any) => {
        return {
          id: m.id,
          conversation_id: m.conversation_id,
          sender_id: m.sender_id,
          content: m.content,
          image_url: m.image_url,
          created_at: m.created_at,
          sender_name: m.user_profiles?.[0]?.full_name || 'Unknown User',
          sender_avatar: m.user_profiles?.[0]?.avatar_url || null,
          is_current_user: m.sender_id === userId
        };
      });

      setMessages(formattedMessages);

      // Set complete conversation object
      setConversation({
        id: conversationData.id,
        created_at: conversationData.created_at,
        participants: formattedParticipants,
        messages: formattedMessages
      });
    } catch (e: unknown) {
      console.error('Error fetching conversation details:', e instanceof Error ? e.message : 'Unknown error');
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      
      // Use mock data as fallback
      if (userId) {
        updateMockChatUserIds(userId);
      }
      
      const mockDetails = mockConversationDetails[conversationId];
      if (mockDetails) {
        setConversation(mockDetails);
        setParticipants(mockDetails.participants);
        setMessages(mockDetails.messages);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [conversationId, userId]);

  // Initial fetch
  useEffect(() => {
    fetchConversationDetails();
  }, [fetchConversationDetails]);

  // Send a new message
  const sendMessage = async (content: string | null = null, imageUrl: string | null = null) => {
    if (!conversationId || !userId) {
      return { error: 'Missing conversation ID or user not authenticated' };
    }

    if (!content && !imageUrl) {
      return { error: 'Message must have content or an image' };
    }

    try {
      // Create the message
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content,
          image_url: imageUrl
        })
        .select()
        .single();

      if (error) throw error;

      // Get user profile for the sender
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Create new message object
      const newMessage: ChatMessage = {
        id: data.id,
        conversation_id: data.conversation_id,
        sender_id: data.sender_id,
        content: data.content,
        image_url: data.image_url,
        created_at: data.created_at,
        sender_name: profileData.full_name,
        sender_avatar: profileData.avatar_url,
        is_current_user: true
      };

      // Update local state with the new message
      setMessages(prevMessages => [...prevMessages, newMessage]);

      return { data: newMessage };
    } catch (e: unknown) {
      console.error('Error sending message:', e instanceof Error ? e.message : 'Unknown error');
      return { error: e instanceof Error ? e.message : 'An unknown error occurred' };
    }
  };

  // Upload and send an image
  const sendImage = async (base64Image: string, mimeType: string) => {
    if (!conversationId || !userId) {
      return { error: 'Missing conversation ID or user not authenticated' };
    }

    try {
      // Generate a unique file name
      const fileName = `${userId}_${Date.now()}.${mimeType.split('/')[1]}`;
      const filePath = `chat-images/${fileName}`;

      // Decode base64 data
      const base64Data = base64Image.split(',')[1] || base64Image;
      const blob = Buffer.from(base64Data, 'base64');

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, blob, {
          contentType: mimeType,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath);

      // Send message with image URL
      return sendMessage(null, publicUrl);
    } catch (e: unknown) {
      console.error('Error uploading image:', e instanceof Error ? e.message : 'Unknown error');
      return { error: e instanceof Error ? e.message : 'An unknown error occurred' };
    }
  };

  // Function to handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversationDetails();
  }, [fetchConversationDetails]);

  return {
    conversation,
    participants,
    messages,
    loading,
    error,
    refreshing,
    onRefresh,
    sendMessage,
    sendImage
  };
};
