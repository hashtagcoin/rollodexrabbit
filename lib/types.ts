export type Post = {
  post_id: string;
  content: string;
  media_urls: string[];
  post_created_at: string;
  author_profile_id: string;
  author_full_name: string;
  author_avatar_url: string | null;
  likes_count: number;
  comments_count: number;
  current_user_has_liked?: boolean;
  current_user_has_bookmarked?: boolean; // Added for bookmark functionality
};

// Add other shared types here as needed in the future
