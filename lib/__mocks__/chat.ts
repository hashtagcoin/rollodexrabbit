/**
 * Mock data for chat functionality
 * Used as fallback when database operations fail
 */

export interface ChatConversation {
  id: string;
  created_at: string;
  last_message?: string;
  last_message_at?: string;
}

export interface ChatParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  user_name?: string;
  user_avatar?: string | null;
  is_current_user?: boolean;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string | null;
  is_current_user?: boolean;
}

export interface ConversationDetails {
  id: string;
  created_at: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
}

// Sample user IDs for mock data
const CURRENT_USER_ID = 'current-user-id'; // Will be replaced with actual user ID
const OTHER_USER_IDS = [
  'user-1',
  'user-2',
  'user-3',
  'user-4',
  'user-5'
];

// Mock conversations data
export const mockConversations: ChatConversation[] = [
  {
    id: 'conversation-1',
    created_at: '2025-03-10T14:30:00Z',
    last_message: 'Let me know if you have any questions!',
    last_message_at: '2025-04-08T09:45:00Z'
  },
  {
    id: 'conversation-2',
    created_at: '2025-03-15T08:30:00Z',
    last_message: 'Looking forward to our session tomorrow',
    last_message_at: '2025-04-07T16:20:00Z'
  },
  {
    id: 'conversation-3',
    created_at: '2025-02-20T11:15:00Z',
    last_message: 'Thanks for your help!',
    last_message_at: '2025-04-05T10:10:00Z'
  },
  {
    id: 'conversation-4',
    created_at: '2025-04-01T09:00:00Z',
    last_message: 'The new schedule looks good',
    last_message_at: '2025-04-03T14:30:00Z'
  },
  {
    id: 'conversation-5',
    created_at: '2025-03-25T15:45:00Z',
    last_message: 'See you at the event!',
    last_message_at: '2025-04-02T18:15:00Z'
  }
];

// Mock participants data
export const mockParticipants: Record<string, ChatParticipant[]> = {
  'conversation-1': [
    {
      id: 'participant-1-1',
      conversation_id: 'conversation-1',
      user_id: CURRENT_USER_ID,
      joined_at: '2025-03-10T14:30:00Z',
      user_name: 'Current User',
      user_avatar: null,
      is_current_user: true
    },
    {
      id: 'participant-1-2',
      conversation_id: 'conversation-1',
      user_id: 'user-1',
      joined_at: '2025-03-10T14:30:00Z',
      user_name: 'Sarah Johnson',
      user_avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      is_current_user: false
    }
  ],
  'conversation-2': [
    {
      id: 'participant-2-1',
      conversation_id: 'conversation-2',
      user_id: CURRENT_USER_ID,
      joined_at: '2025-03-15T08:30:00Z',
      user_name: 'Current User',
      user_avatar: null,
      is_current_user: true
    },
    {
      id: 'participant-2-2',
      conversation_id: 'conversation-2',
      user_id: 'user-2',
      joined_at: '2025-03-15T08:30:00Z',
      user_name: 'Dr. Michael Chen',
      user_avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
      is_current_user: false
    }
  ],
  'conversation-3': [
    {
      id: 'participant-3-1',
      conversation_id: 'conversation-3',
      user_id: CURRENT_USER_ID,
      joined_at: '2025-02-20T11:15:00Z',
      user_name: 'Current User',
      user_avatar: null,
      is_current_user: true
    },
    {
      id: 'participant-3-2',
      conversation_id: 'conversation-3',
      user_id: 'user-3',
      joined_at: '2025-02-20T11:15:00Z',
      user_name: 'Emma Rodriguez',
      user_avatar: 'https://randomuser.me/api/portraits/women/67.jpg',
      is_current_user: false
    }
  ],
  'conversation-4': [
    {
      id: 'participant-4-1',
      conversation_id: 'conversation-4',
      user_id: CURRENT_USER_ID,
      joined_at: '2025-04-01T09:00:00Z',
      user_name: 'Current User',
      user_avatar: null,
      is_current_user: true
    },
    {
      id: 'participant-4-2',
      conversation_id: 'conversation-4',
      user_id: 'user-4',
      joined_at: '2025-04-01T09:00:00Z',
      user_name: 'James Wilson',
      user_avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
      is_current_user: false
    }
  ],
  'conversation-5': [
    {
      id: 'participant-5-1',
      conversation_id: 'conversation-5',
      user_id: CURRENT_USER_ID,
      joined_at: '2025-03-25T15:45:00Z',
      user_name: 'Current User',
      user_avatar: null,
      is_current_user: true
    },
    {
      id: 'participant-5-2',
      conversation_id: 'conversation-5',
      user_id: 'user-5',
      joined_at: '2025-03-25T15:45:00Z',
      user_name: 'Olivia Brown',
      user_avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
      is_current_user: false
    }
  ]
};

// Generate a series of mock messages for a conversation
const generateMockMessages = (conversationId: string, participants: ChatParticipant[]): ChatMessage[] => {
  const messages: ChatMessage[] = [];
  const messageCount = 10 + Math.floor(Math.random() * 20); // 10-30 messages
  const currentParticipant = participants.find(p => p.is_current_user);
  const otherParticipant = participants.find(p => !p.is_current_user);
  
  if (!currentParticipant || !otherParticipant) return messages;

  const baseDate = new Date('2025-03-01T00:00:00Z');
  
  for (let i = 0; i < messageCount; i++) {
    // Determine sender (slightly more messages from the other person)
    const isFromCurrentUser = Math.random() > 0.6;
    const sender = isFromCurrentUser ? currentParticipant : otherParticipant;
    
    // Create message timestamp (increasing chronologically)
    const msgDate = new Date(baseDate);
    msgDate.setHours(baseDate.getHours() + i * 2 + Math.floor(Math.random() * 3));
    
    // Randomly include an image in about 10% of messages
    const hasImage = Math.random() < 0.1;
    
    messages.push({
      id: `message-${conversationId}-${i}`,
      conversation_id: conversationId,
      sender_id: sender.user_id,
      content: hasImage ? null : getRandomMessage(isFromCurrentUser),
      image_url: hasImage ? getRandomImage() : null,
      created_at: msgDate.toISOString(),
      sender_name: sender.user_name,
      sender_avatar: sender.user_avatar,
      is_current_user: isFromCurrentUser
    });
  }
  
  // Sort by created_at
  return messages.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
};

// Generate random message content
const getRandomMessage = (isFromCurrentUser: boolean): string => {
  const currentUserMessages = [
    "Hi there! How are you doing today?",
    "Just checking in. How's everything going?",
    "Do you have time for a quick call later?",
    "I was wondering if you could help me with something.",
    "Thanks for your help yesterday!",
    "Looking forward to our session next week.",
    "Could you send me the details for the appointment?",
    "I'm available tomorrow afternoon if that works for you.",
    "Just confirming our meeting for Friday.",
    "I really appreciate your support!",
    "Have you had a chance to look at the information I sent?",
    "Let me know when is a good time to talk.",
    "How did your appointment go?",
    "Is there anything else I need to bring to the session?",
    "Hope you're having a great day!"
  ];
  
  const otherPersonMessages = [
    "I'm doing well, thanks for asking! How about you?",
    "Everything's going great, thanks for checking in.",
    "Yes, I'm free for a call after 3pm today.",
    "Of course, I'd be happy to help! What do you need?",
    "You're welcome! It was no problem at all.",
    "Me too! I have some new exercises we can try.",
    "I'll send those over right away.",
    "Tomorrow afternoon works perfectly. How about 2pm?",
    "Yes, Friday at 10am is confirmed. Looking forward to it!",
    "That's what I'm here for! Don't hesitate to reach out.",
    "Yes, I reviewed it yesterday. Looks good!",
    "I'm free most of tomorrow. Just let me know when.",
    "It went really well, thank you for asking!",
    "Just bring yourself and comfortable clothing.",
    "Having a great day so far, hope you are too!"
  ];
  
  const messages = isFromCurrentUser ? currentUserMessages : otherPersonMessages;
  return messages[Math.floor(Math.random() * messages.length)];
};

// Generate random image URL
const getRandomImage = (): string => {
  const imageIds = [
    '1000', '1001', '1002', '1003', '1004', 
    '1005', '1006', '1008', '1009', '101'
  ];
  const randomId = imageIds[Math.floor(Math.random() * imageIds.length)];
  return `https://picsum.photos/id/${randomId}/500/500`;
};

// Mock conversations with details (participants and messages)
export const mockConversationDetails: Record<string, ConversationDetails> = {};

// Initialize mock conversation details
mockConversations.forEach(conversation => {
  const participants = mockParticipants[conversation.id] || [];
  const messages = generateMockMessages(conversation.id, participants);
  
  mockConversationDetails[conversation.id] = {
    id: conversation.id,
    created_at: conversation.created_at,
    participants,
    messages
  };
  
  // Update last message info
  if (messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    conversation.last_message = lastMessage.content || 'Shared an image';
    conversation.last_message_at = lastMessage.created_at;
  }
});

// Function to update user ID in mock data
export const updateMockChatUserIds = (userId: string): void => {
  // Update participant user IDs
  Object.values(mockParticipants).forEach(participants => {
    participants.forEach(participant => {
      if (participant.is_current_user) {
        participant.user_id = userId;
      }
    });
  });
  
  // Update message sender IDs
  Object.values(mockConversationDetails).forEach(conversation => {
    conversation.messages.forEach(message => {
      if (message.is_current_user) {
        message.sender_id = userId;
      }
    });
  });
};
