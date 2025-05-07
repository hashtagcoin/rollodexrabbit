import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

interface SupabaseMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

const NewChatScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const userId = user?.id;

  const friendName = typeof params.friendName === 'string' ? params.friendName : (Array.isArray(params.friendName) ? params.friendName[0] : 'Chat');
  const friendId = typeof params.friendId === 'string' ? params.friendId : (Array.isArray(params.friendId) ? params.friendId[0] : undefined);

  const [messages, setMessages] = useState<SupabaseMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !friendId) {
      if (!userId) console.error('ChatScreen: userId is missing');
      if (!friendId) console.error('ChatScreen: friendId is missing');
      setError('User or friend information is missing.');
      setLoading(false);
      return;
    }
    if (userId === friendId) {
      setError('Cannot chat with yourself.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const findOrCreateConversation = async () => {
      try {
        const { data: existingConvos, error: existingConvoError } = await supabase.rpc('get_or_create_conversation', {
          p_user_id1: userId,
          p_user_id2: friendId
        });

        if (existingConvoError) throw existingConvoError;

        if (existingConvos && existingConvos.length > 0 && existingConvos[0].conversation_id) {
          setConversationId(existingConvos[0].conversation_id);
        } else {
          console.warn('RPC get_or_create_conversation did not return a conversation ID. Attempting manual creation (less ideal).');
          const { data: newConvData, error: newConvError } = await supabase
            .from('chat_conversations')
            .insert({ is_group_chat: false })
            .select('id')
            .single();
          if (newConvError || !newConvData) throw newConvError || new Error('Failed to create conversation shell');
          
          const newCID = newConvData.id;
          const { error: participantError } = await supabase.from('chat_participants').insert([
            { conversation_id: newCID, user_id: userId },
            { conversation_id: newCID, user_id: friendId },
          ]);
          if (participantError) throw participantError;
          setConversationId(newCID);
        }
      } catch (e: any) {
        console.error('Error finding/creating conversation:', e);
        setError(`Failed to initialize chat: ${e.message}`);
      }
      setLoading(false);
    };

    findOrCreateConversation();
  }, [userId, friendId]);

  useEffect(() => {
    if (!conversationId) {
      if (!loading && !error) { 
        setMessages([]);
      }
      return;
    }

    setLoading(true); 
    const fetchMessages = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('chat_messages')
          .select('*') 
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;
        setMessages(data || []);
      } catch (e: any) {
        console.error('Error fetching messages:', e);
        setError(`Failed to fetch messages: ${e.message}`);
      }
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new as SupabaseMessage]);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to chat messages for conversation:', conversationId);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Subscription error:', status, err);
          setError('Real-time connection issue. Please try refreshing.');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);


  const handleSendMessage = useCallback(async () => {
    if (inputText.trim().length === 0 || !conversationId || !userId) {
      return;
    }
    setSending(true);
    const currentSentText = inputText.trim();
    setInputText(''); 

    try {
      const { error: insertError } = await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: currentSentText,
      });
      if (insertError) throw insertError;
    } catch (e: any) {
      console.error('Error sending message:', e);
      setError(`Failed to send: ${e.message}`);
      setInputText(currentSentText); 
    }
    setSending(false);
  }, [inputText, conversationId, userId]);

  useEffect(() => {
    if (messages.length > 0) {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  if (!userId || !friendId) {
     return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredMessageContainer}>
          <Text style={styles.emptyChatMessage}>Missing user or friend information.</Text>
          <Button title="Go Back" onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/community')} />
        </View>
      </SafeAreaView>
    );
  }
  
  if (loading && messages.length === 0) { 
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredMessageContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 10, color: '#888' }}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
         <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/community')} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'< Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{friendName}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centeredMessageContainer}>
          <Text style={{ color: 'red', marginBottom:10 }}>Error: {error}</Text>
          <Button title="Try Again" onPress={() => {
            setError(null);
            setLoading(true);
            setConversationId(null); 
          }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} 
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/community')} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'< Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{friendName}</Text>
          <View style={styles.headerSpacer} />{/* Spacer to balance title */}
        </View>
        
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.sender_id === userId ? styles.userMessage : styles.otherMessage,
              ]}
            >
              <Text style={msg.sender_id === userId ? styles.userMessageText : styles.otherMessageText}>
                {msg.content} 
              </Text>
            </View>
          ))}
           {messages.length === 0 && !loading && (
            <View style={styles.emptyChatContainer}>
              <Text style={styles.emptyChatMessage}>
                No messages yet. Say hi!
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={false} 
            editable={!sending && !loading} 
          />
          <Button title={sending ? "Sending..." : "Send"} onPress={handleSendMessage} disabled={inputText.trim().length === 0 || sending || loading} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F8F8', 
  },
  backButton: {
    padding: 5, 
    minWidth: 60, 
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF', 
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600', 
    textAlign: 'center',
  },
  headerSpacer: {
    minWidth: 60, 
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
  },
  messagesContentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20, 
    marginVertical: 5,
    maxWidth: '75%', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  userMessage: {
    backgroundColor: '#007AFF', 
    alignSelf: 'flex-end',
    marginLeft: 'auto', 
  },
  otherMessage: {
    backgroundColor: '#E5E5EA', 
    alignSelf: 'flex-start',
    marginRight: 'auto', 
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  otherMessageText: {
    color: '#000000',
    fontSize: 16,
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50, 
  },
  emptyChatMessage: {
    fontSize: 16,
    color: '#8E8E93', 
    textAlign: 'center',
  },
  centeredMessageContainer: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center', 
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F8F8F8', 
  },
  input: {
    flex: 1,
    minHeight: 40, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1,
    borderColor: '#D0D0D0', 
    borderRadius: 20, 
    paddingHorizontal: 15,
    paddingVertical: 10, 
    fontSize: 16,
    marginRight: 10,
  },
});

export default NewChatScreen;