# Primary Keys

This file lists all the primary key constraints defined in the Rollodex database. Primary keys uniquely identify records in a table and ensure data integrity.

## Key Information:
- **table_schema**: The schema where the table resides (public)
- **table_name**: The name of the database table
- **constraint_name**: The name of the primary key constraint
- **column_name**: The column(s) that make up the primary key

## Tables Relevant to Friends and Chat Features:
- **friendships**: Primary key is `id`
- **chat_conversations**: Primary key is `id` 
- **chat_messages**: Primary key is `id`
- **chat_participants**: Primary key is `id`

Use this information when implementing queries that require unique identification of records in these tables.

[
  {
    "table_schema": "public",
    "table_name": "badge_definitions",
    "constraint_name": "badge_definitions_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "badges",
    "constraint_name": "badges_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "chat_conversations",
    "constraint_name": "chat_conversations_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "chat_messages",
    "constraint_name": "chat_messages_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "chat_participants",
    "constraint_name": "chat_participants_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "claims",
    "constraint_name": "claims_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "comments",
    "constraint_name": "comments_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "friendships",
    "constraint_name": "friendships_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "group_event_participants",
    "constraint_name": "group_event_participants_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "group_events",
    "constraint_name": "group_events_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "group_invites",
    "constraint_name": "group_invites_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "group_members",
    "constraint_name": "group_members_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "group_post_comments",
    "constraint_name": "group_post_comments_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "group_post_reactions",
    "constraint_name": "group_post_reactions_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "group_posts",
    "constraint_name": "group_posts_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "groups",
    "constraint_name": "groups_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "housing_applications",
    "constraint_name": "housing_applications_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "housing_listings",
    "constraint_name": "housing_listings_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "notifications",
    "constraint_name": "notifications_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "point_transactions",
    "constraint_name": "point_transactions_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "post_likes",
    "constraint_name": "post_likes_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "post_reactions",
    "constraint_name": "post_reactions_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "posts",
    "constraint_name": "posts_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "rewards",
    "constraint_name": "rewards_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "service_bookings",
    "constraint_name": "service_bookings_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "service_providers",
    "constraint_name": "service_providers_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "services",
    "constraint_name": "services_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "spatial_ref_sys",
    "constraint_name": "spatial_ref_sys_pkey",
    "column_name": "srid"
  },
  {
    "table_schema": "public",
    "table_name": "subgroups",
    "constraint_name": "subgroups_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "user_achievements",
    "constraint_name": "user_achievements_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "user_badges",
    "constraint_name": "user_badges_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "user_points",
    "constraint_name": "user_points_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "user_profiles",
    "constraint_name": "user_profiles_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "user_streaks",
    "constraint_name": "user_streaks_pkey",
    "column_name": "id"
  },
  {
    "table_schema": "public",
    "table_name": "wallets",
    "constraint_name": "wallets_pkey",
    "column_name": "id"
  }
]