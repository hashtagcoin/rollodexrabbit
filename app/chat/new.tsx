import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Phone, Video, Image as ImageIcon, Heart, Mic } from 'lucide-react-native';
import { useAuth } from '../../providers/AuthProvider';

// TypeScript interfaces for props
interface ChatBubbleProps {
  text: string;
  alignment: 'left' | 'right';
  bubbleColor: string;
  textColor: string;
  avatar?: string | null;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ text, alignment, bubbleColor, textColor, avatar }) => (
  <View style={[styles.bubbleRow, alignment === 'right' ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
    {alignment === 'left' && avatar && (
      <Image source={{ uri: avatar }} style={styles.bubbleAvatar} accessibilityLabel="Sender avatar" />
    )}
    <View
      style={[
        styles.bubble,
        {
          backgroundColor: bubbleColor,
          alignSelf: alignment === 'right' ? 'flex-end' : 'flex-start',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderBottomLeftRadius: alignment === 'right' ? 18 : 5,
          borderBottomRightRadius: alignment === 'left' ? 18 : 5,
        },
      ]}
    >
      <Text style={[styles.bubbleText, { color: textColor }]}>{text}</Text>
    </View>
    {alignment === 'right' && avatar && (
      <Image source={{ uri: avatar }} style={styles.bubbleAvatar} accessibilityLabel="Your avatar" />
    )}
  </View>
);

interface HeaderProps {
  onBack: () => void;
  friendName: string;
}

const Header: React.FC<HeaderProps> = ({ onBack, friendName }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} accessibilityLabel="Go back">
      <Text style={{ fontSize: 20, color: '#007AFF', marginRight: 8 }}>{'<'}</Text>
    </TouchableOpacity>
    <Text style={styles.headerTitle} numberOfLines={1}>{friendName}</Text>
    <View style={styles.headerIcons}>
      <TouchableOpacity accessibilityLabel="Call">
        <Phone size={24} color="#222" />
      </TouchableOpacity>
      <TouchableOpacity accessibilityLabel="Video Call" style={{ marginLeft: 18 }}>
        <Video size={24} color="#222" />
      </TouchableOpacity>
    </View>
  </View>
);

interface InputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  loading: boolean;
  profileAvatar?: string | null;
}

const InputBar: React.FC<InputBarProps> = ({ value, onChangeText, onSend, loading, profileAvatar }) => (
  <View style={styles.inputBar}>
    {profileAvatar && (
      <Image source={{ uri: profileAvatar }} style={styles.inputAvatar} accessibilityLabel="Your profile picture" />
    )}
    <TextInput
      style={styles.input}
      placeholder="Message..."
      placeholderTextColor="#888"
      value={value}
      onChangeText={onChangeText}
      accessibilityLabel="Message input"
      editable={!loading}
      onSubmitEditing={onSend}
      returnKeyType="send"
    />
    <TouchableOpacity accessibilityLabel="Send Image" style={styles.inputIcon} disabled={loading}>
      <ImageIcon size={20} color="#555" />
    </TouchableOpacity>
    <TouchableOpacity accessibilityLabel="Send Heart" style={styles.inputIcon} disabled={loading}>
      <Heart size={20} color="#555" />
    </TouchableOpacity>
    <TouchableOpacity accessibilityLabel="Send Voice Message" style={styles.inputIcon} disabled={loading}>
      <Mic size={20} color="#555" />
    </TouchableOpacity>
  </View>
);


export default function ChatScreen() {
  const { user } = useAuth();
  const userId = user?.id;
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const { friendId, name } = useLocalSearchParams();

  // State
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendProfile, setFriendProfile] = useState<any>(null);

  // Fetch friend profile (for avatar)
  useEffect(() => {
    if (!friendId) return;
    supabase
      .from('user_profiles')
      .select('id, full_name, avatar_url')
      .eq('id', friendId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setFriendProfile(data);
      });
  }, [friendId]);

  // Conversation lookup/creation
  useEffect(() => {
    if (!userId || !friendId) return;
    setLoading(true);
    setError(null);
    // 1. Try to find an existing 1:1 conversation
    const findOrCreateConversation = async () => {
      // Find conversations with exactly these two participants
      const { data: participantRows, error: partErr } = await supabase
        .from('chat_participants')
        .select('conversation_id')
        .in('user_id', [userId, friendId]);
      const conversationIds = participantRows?.map(row => row.conversation_id) || [];
      let foundId: string | null = null;
      if (conversationIds.length) {
        // Find a conversation with exactly these two participants
        for (const cid of conversationIds) {
          const { count } = await supabase
            .from('chat_participants')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', cid);
          if (count === 2) {
            foundId = cid;
            break;
          }
        }
      }
      if (foundId) {
        setConversationId(foundId);
        setLoading(false);
        return;
      }
      // Not found: create new conversation and add both participants
      const { data: conv, error: convErr } = await supabase
        .from('chat_conversations')
        .insert({})
        .select()
        .single();
      if (convErr || !conv) {
        setError('Failed to create conversation');
        setLoading(false);
        return;
      }
      const cid = conv.id;
      await supabase.from('chat_participants').insert([
        { conversation_id: cid, user_id: userId },
        { conversation_id: cid, user_id: friendId },
      ]);
      setConversationId(cid);
      setLoading(false);
    };
    findOrCreateConversation();
  }, [userId, friendId]);

  // Fetch messages and subscribe for realtime updates
  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, content, sender_id, created_at, sender:sender_id(id, full_name, avatar_url)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) {
        setError('Failed to fetch messages');
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };
    fetchMessages();
    // Subscribe to new messages
    const sub = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
        payload => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [conversationId]);

  // Send message
  const handleSend = async () => {
    if (!input.trim() || !conversationId || !userId) return;
    setSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: input.trim(),
    });
    if (error) {
      Alert.alert('Error', 'Failed to send message');
    } else {
      setInput('');
    }
    setSending(false);
  };

  // Get current user avatar
  // Fix type error: allow avatar_url to be optional on user
  const myAvatar = (user as { avatar_url?: string })?.avatar_url || null;

  // UI rendering
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { flex: 1 }]}> <ActivityIndicator size="large" color="#007AFF" /> </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.loadingContainer, { flex: 1 }]}> <Text style={{ color: 'red' }}>{error}</Text> </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <Header onBack={() => router.back()} friendName={name || friendProfile?.full_name || 'Chat'} />
      <ScrollView
        ref={scrollViewRef as React.RefObject<any>}
        style={styles.messages}
        contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
        onContentSizeChange={() => (scrollViewRef.current as any)?.scrollToEnd?.({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <Text style={{ color: '#888', alignSelf: 'center', marginTop: 24 }}>No messages yet. Say hi!</Text>
        )}
        {messages.map((msg, idx) => (
          <ChatBubble
            key={msg.id || idx}
            text={msg.content}
            alignment={msg.sender_id === userId ? 'right' : 'left'}
            bubbleColor={msg.sender_id === userId ? '#007AFF' : '#f1f1f1'}
            textColor={msg.sender_id === userId ? '#fff' : '#000'}
            avatar={msg.sender_id === userId ? myAvatar : msg.sender?.avatar_url || friendProfile?.avatar_url}
          />
        ))}
      </ScrollView>
      <InputBar
        value={input}
        onChangeText={setInput}
        onSend={handleSend}
        loading={sending}
        profileAvatar={myAvatar}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Chat UI styles
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
  },
  bubbleRowLeft: {
    justifyContent: 'flex-start',
  },
  bubbleRowRight: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 6,
    backgroundColor: '#eee',
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginLeft: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#eee',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f1f1f1',
    borderRadius: 18,
    marginRight: 8,
    color: '#000',
  },
  inputIcon: {
    marginHorizontal: 2,
    padding: 4,
  },
  messages: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  headerButton: {
    marginRight: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#1F2937',
  },
  searchButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  selectedContainer: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  selectedList: {
    paddingRight: 12,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  selectedChipText: {
    fontSize: 14,
    color: '#4F46E5',
    marginRight: 4,
    maxWidth: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4B5563',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedUserItem: {
    backgroundColor: '#F5F3FF',
    borderColor: '#818CF8',
    borderWidth: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userUsername: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 400,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  createButtonContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  createButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
