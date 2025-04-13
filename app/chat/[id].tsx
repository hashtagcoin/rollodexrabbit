import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useConversationDetails } from '../../hooks/useChat';
import { ChatMessage } from '../../lib/__mocks__/chat';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  Send,
  ArrowLeft,
  AlertCircle,
  Image as ImageIcon,
  X
} from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';

export default function ChatScreen() {
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  const listRef = useRef<FlatList>(null);
  const params = useLocalSearchParams();
  const conversationId = params.id as string;
  const router = useRouter();
  
  const {
    conversation,
    participants,
    messages,
    loading,
    error,
    refreshing,
    onRefresh,
    sendMessage,
    sendImage
  } = useConversationDetails(conversationId);

  // Get other participant info (assumes 2-person chat)
  const otherParticipant = participants.find(p => !p.is_current_user);
  const conversationName = otherParticipant?.user_name || 'Conversation';
  const conversationAvatar = otherParticipant?.user_avatar;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Handle send message
  const handleSendMessage = async () => {
    if ((!message.trim() && !imagePreview) || isSending) return;
    
    setIsSending(true);
    
    try {
      if (imagePreview) {
        // Extract mime type and send image
        const mimeType = imagePreview.split(';')[0].split(':')[1];
        const result = await sendImage(imagePreview, mimeType);
        
        if (result.error) {
          Alert.alert('Error', result.error);
        }
        
        setImagePreview(null);
      } else {
        // Send text message
        const result = await sendMessage(message);
        
        if (result.error) {
          Alert.alert('Error', result.error);
        }
      }
      
      setMessage('');
    } catch (e) {
      console.error('Error sending message:', e);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle image picker
  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to grant access to your photos to share images.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mimeType = asset.mimeType || 'image/jpeg';
          const base64Image = `data:${mimeType};base64,${asset.base64}`;
          setImagePreview(base64Image);
        }
      }
    } catch (e) {
      console.error('Error picking image:', e);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Cancel image preview
  const cancelImagePreview = () => {
    setImagePreview(null);
  };

  // Open image viewer
  const openImageViewer = (imageUrl: string) => {
    setViewingImage(imageUrl);
  };

  // Close image viewer
  const closeImageViewer = () => {
    setViewingImage(null);
  };

  // Format date for message timestamp
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render a day divider
  const renderDayDivider = (date: Date) => (
    <View style={styles.dayDivider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dayDividerText}>
        {date.toDateString() === new Date().toDateString()
          ? 'Today'
          : date.toLocaleDateString()}
      </Text>
      <View style={styles.dividerLine} />
    </View>
  );

  // Render a message item
  const renderMessageItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isCurrentUser = item.is_current_user;
    const showDayDivider = index === 0 || 
      new Date(item.created_at).toDateString() !== 
      new Date(messages[index - 1].created_at).toDateString();
    
    return (
      <>
        {showDayDivider && renderDayDivider(new Date(item.created_at))}
        
        <View style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
        ]}>
          {!isCurrentUser && (
            <View style={styles.avatarContainer}>
              {item.sender_avatar ? (
                <Image source={{ uri: item.sender_avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <User size={16} color="#ffffff" />
                </View>
              )}
            </View>
          )}
          
          <View style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
          ]}>
            {item.image_url ? (
              <TouchableOpacity onPress={() => openImageViewer(item.image_url!)}>
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : item.content ? (
              <Text style={[
                styles.messageText,
                isCurrentUser ? styles.currentUserText : styles.otherUserText
              ]}>
                {item.content}
              </Text>
            ) : null}
            
            <Text style={[
              styles.messageTime,
              isCurrentUser ? styles.currentUserTime : styles.otherUserTime
            ]}>
              {formatMessageTime(item.created_at)}
            </Text>
          </View>
        </View>
      </>
    );
  };

  // Render loading state
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text style={styles.loadingText}>Loading conversation...</Text>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <AlertCircle size={60} color="#EF4444" />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader 
        title={conversationName} 
        showBackButton={true} 
        onBackPress={() => router.push('/(tabs)/chat' as any)} 
      />
      
      <Stack.Screen
        options={{
          title: conversationName,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <ArrowLeft size={24} color="#000000" />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <View style={styles.headerTitle}>
              {conversationAvatar ? (
                <Image source={{ uri: conversationAvatar }} style={styles.headerAvatar} />
              ) : (
                <View style={styles.headerAvatarFallback}>
                  <User size={16} color="#ffffff" />
                </View>
              )}
              <Text style={styles.headerText} numberOfLines={1}>
                {conversationName}
              </Text>
            </View>
          ),
        }}
      />
      
      {loading && !refreshing ? (
        renderLoadingState()
      ) : error ? (
        renderErrorState()
      ) : (
        <View style={styles.chatContentContainer}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
          
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={100}
          >
            {imagePreview ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imagePreview }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.cancelImageButton}
                  onPress={cancelImagePreview}
                >
                  <X size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={handlePickImage}
              >
                <ImageIcon size={24} color="#6B7280" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={1000}
                editable={!imagePreview}
              />
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!message.trim() && !imagePreview) ? styles.sendButtonDisabled : {}
                ]}
                onPress={handleSendMessage}
                disabled={(!message.trim() && !imagePreview) || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Send size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Full-screen image viewer modal */}
      <Modal
        visible={!!viewingImage}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeImageViewer}
          >
            <X size={28} color="#ffffff" />
          </TouchableOpacity>
          
          {viewingImage && (
            <Image
              source={{ uri: viewingImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  chatContentContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  headerButton: {
    marginRight: 16,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  headerAvatarFallback: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    maxWidth: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4B5563',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
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
  messagesList: {
    padding: 16,
    paddingBottom: 24,
  },
  dayDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dayDividerText: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    marginRight: 'auto',
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  currentUserBubble: {
    backgroundColor: '#4F46E5',
  },
  otherUserBubble: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  currentUserText: {
    color: '#ffffff',
  },
  otherUserText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  currentUserTime: {
    color: '#E0E7FF',
  },
  otherUserTime: {
    color: '#9CA3AF',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 12,
  },
  imageButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    marginHorizontal: 8,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  imagePreviewContainer: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  imagePreview: {
    width: 150,
    height: 100,
    borderRadius: 8,
  },
  cancelImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
