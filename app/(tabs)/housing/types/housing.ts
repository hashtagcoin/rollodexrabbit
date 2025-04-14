// Define type for support levels
export type SupportLevel = 'none' | 'light' | 'moderate' | 'high';

// Define types based on our housing detail page types
export type GroupMember = {
  id: string;
  user_id: string;
  group_id: string;
  join_date: string;
  status: string;
  bio: string;
  support_level: SupportLevel;
  is_admin: boolean;
  user_profile: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
};

export type HousingGroup = {
  id: string;
  name: string;
  description?: string;
  listing_id: string;
  max_members: number;
  current_members: number;
  creator_id: string;
  created_at: string;
  move_in_date?: string;
  is_active: boolean;
  members: GroupMember[];
};

// Add a dummy default export to satisfy Expo Router's requirements
const DummyComponent = () => null;
export default DummyComponent;
