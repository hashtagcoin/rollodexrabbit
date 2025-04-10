/**
 * Mock data for friends functionality
 * Used as fallback when database operations fail
 */

import { User } from '../../types/user';

export interface FriendWithProfile {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  category: string;
  created_at: string;
  friend_name: string;
  friend_avatar: string | null;
  friend_role: string | null;
  user_name: string;
  user_avatar: string | null;
}

// Mock friends data matching the friendships_with_profiles view
export const mockFriends: FriendWithProfile[] = [
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    user_id: 'current-user-id', // This will be replaced with the actual user ID when used
    friend_id: 'friend-1',
    status: 'accepted',
    category: 'friend',
    created_at: '2025-03-15T08:30:00Z',
    friend_name: 'Sarah Johnson',
    friend_avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    friend_role: 'participant',
    user_name: 'Current User',
    user_avatar: null
  },
  {
    id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    user_id: 'current-user-id',
    friend_id: 'friend-2',
    status: 'accepted',
    category: 'provider',
    created_at: '2025-03-18T10:15:00Z',
    friend_name: 'Dr. Michael Chen',
    friend_avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    friend_role: 'provider',
    user_name: 'Current User',
    user_avatar: null
  },
  {
    id: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    user_id: 'current-user-id',
    friend_id: 'friend-3',
    status: 'accepted',
    category: 'family',
    created_at: '2025-02-20T14:45:00Z',
    friend_name: 'Emma Rodriguez',
    friend_avatar: 'https://randomuser.me/api/portraits/women/67.jpg',
    friend_role: 'family',
    user_name: 'Current User',
    user_avatar: null
  },
  {
    id: '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s',
    user_id: 'current-user-id',
    friend_id: 'friend-4',
    status: 'pending',
    category: 'friend',
    created_at: '2025-04-05T09:20:00Z',
    friend_name: 'James Wilson',
    friend_avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
    friend_role: 'participant',
    user_name: 'Current User',
    user_avatar: null
  },
  {
    id: '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t',
    user_id: 'friend-5',
    friend_id: 'current-user-id',
    status: 'pending',
    category: 'friend',
    created_at: '2025-04-07T16:10:00Z',
    friend_name: 'Current User',
    friend_avatar: null,
    friend_role: 'participant',
    user_name: 'Olivia Brown',
    user_avatar: 'https://randomuser.me/api/portraits/women/33.jpg'
  }
];

// Mock function to search for users that can be added as friends
export const mockSearchUsers = (query: string): User[] => {
  const mockUsers: User[] = [
    {
      id: 'search-1',
      full_name: 'Alex Thompson',
      username: 'alexthompson',
      avatar_url: 'https://randomuser.me/api/portraits/men/72.jpg',
      role: 'participant'
    },
    {
      id: 'search-2',
      full_name: 'Lisa Park',
      username: 'lisapark',
      avatar_url: 'https://randomuser.me/api/portraits/women/28.jpg',
      role: 'participant'
    },
    {
      id: 'search-3',
      full_name: 'Robert Smith',
      username: 'robsmith',
      avatar_url: 'https://randomuser.me/api/portraits/men/45.jpg',
      role: 'provider'
    },
    {
      id: 'search-4',
      full_name: 'Jennifer Davis',
      username: 'jdavis',
      avatar_url: 'https://randomuser.me/api/portraits/women/15.jpg',
      role: 'participant'
    },
    {
      id: 'search-5',
      full_name: 'Carlos Mendez',
      username: 'carlosmendez',
      avatar_url: 'https://randomuser.me/api/portraits/men/57.jpg',
      role: 'provider'
    }
  ];

  if (!query) return mockUsers;
  
  return mockUsers.filter(user => 
    user.full_name.toLowerCase().includes(query.toLowerCase()) || 
    user.username.toLowerCase().includes(query.toLowerCase())
  );
};
