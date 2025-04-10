# Database Indexes

This file lists all indexes defined in the Rollodex database. Indexes improve query performance by creating efficient lookup structures for columns that are frequently searched, sorted, or joined.

## Key Information:
- **tablename**: The name of the table containing the index
- **indexname**: The name of the index
- **indexdef**: The SQL definition of the index, including:
  - Type (UNIQUE INDEX or INDEX)
  - Table name
  - Index method (BTREE, GIN, etc.)
  - Columns included in the index

## Important Indexes for Friends and Chat Features:
- Primary key indexes (e.g., `chat_conversations_pkey`, `friendships_pkey`)
- Foreign key indexes (e.g., indexes on conversation_id, user_id columns)
- Performance indexes for frequently queried columns (created_at, conversation_id)

Proper indexing is crucial for efficient queries, especially when retrieving chat messages, friend lists, or filtering conversations by user.

[
  {
    "tablename": "badge_definitions",
    "indexname": "badge_definitions_pkey",
    "indexdef": "CREATE UNIQUE INDEX badge_definitions_pkey ON public.badge_definitions USING btree (id)"
  },
  {
    "tablename": "badges",
    "indexname": "badges_pkey",
    "indexdef": "CREATE UNIQUE INDEX badges_pkey ON public.badges USING btree (id)"
  },
  {
    "tablename": "chat_conversations",
    "indexname": "chat_conversations_pkey",
    "indexdef": "CREATE UNIQUE INDEX chat_conversations_pkey ON public.chat_conversations USING btree (id)"
  },
  {
    "tablename": "chat_messages",
    "indexname": "chat_messages_pkey",
    "indexdef": "CREATE UNIQUE INDEX chat_messages_pkey ON public.chat_messages USING btree (id)"
  },
  {
    "tablename": "chat_participants",
    "indexname": "chat_participants_conversation_id_user_id_key",
    "indexdef": "CREATE UNIQUE INDEX chat_participants_conversation_id_user_id_key ON public.chat_participants USING btree (conversation_id, user_id)"
  },
  {
    "tablename": "chat_participants",
    "indexname": "chat_participants_pkey",
    "indexdef": "CREATE UNIQUE INDEX chat_participants_pkey ON public.chat_participants USING btree (id)"
  },
  {
    "tablename": "claims",
    "indexname": "claims_pkey",
    "indexdef": "CREATE UNIQUE INDEX claims_pkey ON public.claims USING btree (id)"
  },
  {
    "tablename": "comments",
    "indexname": "comments_pkey",
    "indexdef": "CREATE UNIQUE INDEX comments_pkey ON public.comments USING btree (id)"
  },
  {
    "tablename": "friendships",
    "indexname": "friendships_pkey",
    "indexdef": "CREATE UNIQUE INDEX friendships_pkey ON public.friendships USING btree (id)"
  },
  {
    "tablename": "friendships",
    "indexname": "friendships_user_id_friend_id_key",
    "indexdef": "CREATE UNIQUE INDEX friendships_user_id_friend_id_key ON public.friendships USING btree (user_id, friend_id)"
  },
  {
    "tablename": "group_event_participants",
    "indexname": "group_event_participants_event_id_user_id_key",
    "indexdef": "CREATE UNIQUE INDEX group_event_participants_event_id_user_id_key ON public.group_event_participants USING btree (event_id, user_id)"
  },
  {
    "tablename": "group_event_participants",
    "indexname": "group_event_participants_pkey",
    "indexdef": "CREATE UNIQUE INDEX group_event_participants_pkey ON public.group_event_participants USING btree (id)"
  },
  {
    "tablename": "group_events",
    "indexname": "group_events_pkey",
    "indexdef": "CREATE UNIQUE INDEX group_events_pkey ON public.group_events USING btree (id)"
  },
  {
    "tablename": "group_events",
    "indexname": "idx_group_events_group_id",
    "indexdef": "CREATE INDEX idx_group_events_group_id ON public.group_events USING btree (group_id)"
  },
  {
    "tablename": "group_events",
    "indexname": "idx_group_events_start_time",
    "indexdef": "CREATE INDEX idx_group_events_start_time ON public.group_events USING btree (start_time)"
  },
  {
    "tablename": "group_invites",
    "indexname": "group_invites_group_id_invitee_id_key",
    "indexdef": "CREATE UNIQUE INDEX group_invites_group_id_invitee_id_key ON public.group_invites USING btree (group_id, invitee_id)"
  },
  {
    "tablename": "group_invites",
    "indexname": "group_invites_pkey",
    "indexdef": "CREATE UNIQUE INDEX group_invites_pkey ON public.group_invites USING btree (id)"
  },
  {
    "tablename": "group_members",
    "indexname": "group_members_group_id_user_id_key",
    "indexdef": "CREATE UNIQUE INDEX group_members_group_id_user_id_key ON public.group_members USING btree (group_id, user_id)"
  },
  {
    "tablename": "group_members",
    "indexname": "group_members_pkey",
    "indexdef": "CREATE UNIQUE INDEX group_members_pkey ON public.group_members USING btree (id)"
  },
  {
    "tablename": "group_members",
    "indexname": "idx_group_members_user_role",
    "indexdef": "CREATE INDEX idx_group_members_user_role ON public.group_members USING btree (user_id, role)"
  },
  {
    "tablename": "group_post_comments",
    "indexname": "group_post_comments_pkey",
    "indexdef": "CREATE UNIQUE INDEX group_post_comments_pkey ON public.group_post_comments USING btree (id)"
  },
  {
    "tablename": "group_post_reactions",
    "indexname": "group_post_reactions_pkey",
    "indexdef": "CREATE UNIQUE INDEX group_post_reactions_pkey ON public.group_post_reactions USING btree (id)"
  },
  {
    "tablename": "group_post_reactions",
    "indexname": "group_post_reactions_post_id_user_id_reaction_type_key",
    "indexdef": "CREATE UNIQUE INDEX group_post_reactions_post_id_user_id_reaction_type_key ON public.group_post_reactions USING btree (post_id, user_id, reaction_type)"
  },
  {
    "tablename": "group_posts",
    "indexname": "group_posts_pkey",
    "indexdef": "CREATE UNIQUE INDEX group_posts_pkey ON public.group_posts USING btree (id)"
  },
  {
    "tablename": "group_posts",
    "indexname": "idx_group_posts_created_at",
    "indexdef": "CREATE INDEX idx_group_posts_created_at ON public.group_posts USING btree (created_at)"
  },
  {
    "tablename": "groups",
    "indexname": "groups_pkey",
    "indexdef": "CREATE UNIQUE INDEX groups_pkey ON public.groups USING btree (id)"
  },
  {
    "tablename": "housing_applications",
    "indexname": "housing_applications_listing_id_idx",
    "indexdef": "CREATE INDEX housing_applications_listing_id_idx ON public.housing_applications USING btree (listing_id)"
  },
  {
    "tablename": "housing_applications",
    "indexname": "housing_applications_pkey",
    "indexdef": "CREATE UNIQUE INDEX housing_applications_pkey ON public.housing_applications USING btree (id)"
  },
  {
    "tablename": "housing_applications",
    "indexname": "housing_applications_status_idx",
    "indexdef": "CREATE INDEX housing_applications_status_idx ON public.housing_applications USING btree (status)"
  },
  {
    "tablename": "housing_applications",
    "indexname": "housing_applications_user_id_idx",
    "indexdef": "CREATE INDEX housing_applications_user_id_idx ON public.housing_applications USING btree (user_id)"
  },
  {
    "tablename": "housing_listings",
    "indexname": "housing_listings_coordinates_idx",
    "indexdef": "CREATE INDEX housing_listings_coordinates_idx ON public.housing_listings USING gist (coordinates)"
  },
  {
    "tablename": "housing_listings",
    "indexname": "housing_listings_pkey",
    "indexdef": "CREATE UNIQUE INDEX housing_listings_pkey ON public.housing_listings USING btree (id)"
  },
  {
    "tablename": "housing_listings",
    "indexname": "housing_listings_sda_category_idx",
    "indexdef": "CREATE INDEX housing_listings_sda_category_idx ON public.housing_listings USING btree (sda_category)"
  },
  {
    "tablename": "housing_listings",
    "indexname": "housing_listings_suburb_idx",
    "indexdef": "CREATE INDEX housing_listings_suburb_idx ON public.housing_listings USING btree (suburb)"
  },
  {
    "tablename": "notifications",
    "indexname": "notifications_created_at_idx",
    "indexdef": "CREATE INDEX notifications_created_at_idx ON public.notifications USING btree (created_at DESC)"
  },
  {
    "tablename": "notifications",
    "indexname": "notifications_pkey",
    "indexdef": "CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id)"
  },
  {
    "tablename": "notifications",
    "indexname": "notifications_seen_idx",
    "indexdef": "CREATE INDEX notifications_seen_idx ON public.notifications USING btree (seen)"
  },
  {
    "tablename": "notifications",
    "indexname": "notifications_user_id_idx",
    "indexdef": "CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id)"
  },
  {
    "tablename": "point_transactions",
    "indexname": "idx_point_transactions_user_id",
    "indexdef": "CREATE INDEX idx_point_transactions_user_id ON public.point_transactions USING btree (user_id)"
  },
  {
    "tablename": "point_transactions",
    "indexname": "point_transactions_pkey",
    "indexdef": "CREATE UNIQUE INDEX point_transactions_pkey ON public.point_transactions USING btree (id)"
  },
  {
    "tablename": "post_likes",
    "indexname": "post_likes_pkey",
    "indexdef": "CREATE UNIQUE INDEX post_likes_pkey ON public.post_likes USING btree (id)"
  },
  {
    "tablename": "post_likes",
    "indexname": "post_likes_post_id_user_id_key",
    "indexdef": "CREATE UNIQUE INDEX post_likes_post_id_user_id_key ON public.post_likes USING btree (post_id, user_id)"
  },
  {
    "tablename": "post_reactions",
    "indexname": "post_reactions_pkey",
    "indexdef": "CREATE UNIQUE INDEX post_reactions_pkey ON public.post_reactions USING btree (id)"
  },
  {
    "tablename": "post_reactions",
    "indexname": "post_reactions_post_id_user_id_reaction_type_key",
    "indexdef": "CREATE UNIQUE INDEX post_reactions_post_id_user_id_reaction_type_key ON public.post_reactions USING btree (post_id, user_id, reaction_type)"
  },
  {
    "tablename": "posts",
    "indexname": "posts_pkey",
    "indexdef": "CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree (id)"
  },
  {
    "tablename": "rewards",
    "indexname": "rewards_pkey",
    "indexdef": "CREATE UNIQUE INDEX rewards_pkey ON public.rewards USING btree (id)"
  },
  {
    "tablename": "rewards",
    "indexname": "rewards_user_id_idx",
    "indexdef": "CREATE INDEX rewards_user_id_idx ON public.rewards USING btree (user_id)"
  },
  {
    "tablename": "service_bookings",
    "indexname": "service_bookings_pkey",
    "indexdef": "CREATE UNIQUE INDEX service_bookings_pkey ON public.service_bookings USING btree (id)"
  },
  {
    "tablename": "service_bookings",
    "indexname": "service_bookings_scheduled_at_idx",
    "indexdef": "CREATE INDEX service_bookings_scheduled_at_idx ON public.service_bookings USING btree (scheduled_at)"
  },
  {
    "tablename": "service_bookings",
    "indexname": "service_bookings_status_idx",
    "indexdef": "CREATE INDEX service_bookings_status_idx ON public.service_bookings USING btree (status)"
  },
  {
    "tablename": "service_bookings",
    "indexname": "service_bookings_user_id_idx",
    "indexdef": "CREATE INDEX service_bookings_user_id_idx ON public.service_bookings USING btree (user_id)"
  },
  {
    "tablename": "service_providers",
    "indexname": "service_providers_pkey",
    "indexdef": "CREATE UNIQUE INDEX service_providers_pkey ON public.service_providers USING btree (id)"
  },
  {
    "tablename": "services",
    "indexname": "services_pkey",
    "indexdef": "CREATE UNIQUE INDEX services_pkey ON public.services USING btree (id)"
  },
  {
    "tablename": "services",
    "indexname": "services_provider_id_idx",
    "indexdef": "CREATE INDEX services_provider_id_idx ON public.services USING btree (provider_id)"
  },
  {
    "tablename": "spatial_ref_sys",
    "indexname": "spatial_ref_sys_pkey",
    "indexdef": "CREATE UNIQUE INDEX spatial_ref_sys_pkey ON public.spatial_ref_sys USING btree (srid)"
  },
  {
    "tablename": "subgroups",
    "indexname": "subgroups_pkey",
    "indexdef": "CREATE UNIQUE INDEX subgroups_pkey ON public.subgroups USING btree (id)"
  },
  {
    "tablename": "user_achievements",
    "indexname": "idx_user_achievements_user_id",
    "indexdef": "CREATE INDEX idx_user_achievements_user_id ON public.user_achievements USING btree (user_id)"
  },
  {
    "tablename": "user_achievements",
    "indexname": "user_achievements_pkey",
    "indexdef": "CREATE UNIQUE INDEX user_achievements_pkey ON public.user_achievements USING btree (id)"
  },
  {
    "tablename": "user_achievements",
    "indexname": "user_achievements_user_id_achievement_type_key",
    "indexdef": "CREATE UNIQUE INDEX user_achievements_user_id_achievement_type_key ON public.user_achievements USING btree (user_id, achievement_type)"
  },
  {
    "tablename": "user_badges",
    "indexname": "idx_user_badges_user_id",
    "indexdef": "CREATE INDEX idx_user_badges_user_id ON public.user_badges USING btree (user_id)"
  },
  {
    "tablename": "user_badges",
    "indexname": "user_badges_pkey",
    "indexdef": "CREATE UNIQUE INDEX user_badges_pkey ON public.user_badges USING btree (id)"
  },
  {
    "tablename": "user_badges",
    "indexname": "user_badges_user_id_badge_id_key",
    "indexdef": "CREATE UNIQUE INDEX user_badges_user_id_badge_id_key ON public.user_badges USING btree (user_id, badge_id)"
  },
  {
    "tablename": "user_points",
    "indexname": "user_points_pkey",
    "indexdef": "CREATE UNIQUE INDEX user_points_pkey ON public.user_points USING btree (id)"
  },
  {
    "tablename": "user_points",
    "indexname": "user_points_user_id_key",
    "indexdef": "CREATE UNIQUE INDEX user_points_user_id_key ON public.user_points USING btree (user_id)"
  },
  {
    "tablename": "user_profiles",
    "indexname": "user_profiles_ndis_number_key",
    "indexdef": "CREATE UNIQUE INDEX user_profiles_ndis_number_key ON public.user_profiles USING btree (ndis_number)"
  },
  {
    "tablename": "user_profiles",
    "indexname": "user_profiles_pkey",
    "indexdef": "CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id)"
  },
  {
    "tablename": "user_profiles",
    "indexname": "user_profiles_username_key",
    "indexdef": "CREATE UNIQUE INDEX user_profiles_username_key ON public.user_profiles USING btree (username)"
  },
  {
    "tablename": "user_streaks",
    "indexname": "idx_user_streaks_user_id",
    "indexdef": "CREATE INDEX idx_user_streaks_user_id ON public.user_streaks USING btree (user_id)"
  },
  {
    "tablename": "user_streaks",
    "indexname": "user_streaks_pkey",
    "indexdef": "CREATE UNIQUE INDEX user_streaks_pkey ON public.user_streaks USING btree (id)"
  },
  {
    "tablename": "user_streaks",
    "indexname": "user_streaks_user_id_streak_type_key",
    "indexdef": "CREATE UNIQUE INDEX user_streaks_user_id_streak_type_key ON public.user_streaks USING btree (user_id, streak_type)"
  },
  {
    "tablename": "wallets",
    "indexname": "wallets_pkey",
    "indexdef": "CREATE UNIQUE INDEX wallets_pkey ON public.wallets USING btree (id)"
  }
]