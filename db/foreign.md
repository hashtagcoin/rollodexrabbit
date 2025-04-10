# Foreign Keys

This file lists all foreign key relationships in the Rollodex database. Foreign keys establish relationships between tables by referencing the primary key of another table, maintaining referential integrity.

## Key Information:
- **table_schema**: The schema where the table resides (public)
- **table_with_foreign_key**: The table containing the foreign key
- **foreign_key_column**: The column that acts as a foreign key
- **referenced_table**: The table being referenced
- **referenced_column**: The column being referenced (typically the primary key)
- **constraint_name**: The name of the foreign key constraint

## Important Relationships for Friends and Chat:
- **chat_messages.conversation_id**: References chat_conversations.id
- **chat_participants.conversation_id**: References chat_conversations.id
- **chat_messages.sender_id**: References user_profiles.id (if present)
- **friendships.user_id_1/user_id_2**: References user_profiles.id

These relationships are critical for implementing the friend list and chat functionality as they define how entities relate to each other in the database.

[
  {
    "table_schema": "public",
    "table_with_foreign_key": "chat_messages",
    "foreign_key_column": "conversation_id",
    "referenced_table": "chat_conversations",
    "referenced_column": "id",
    "constraint_name": "chat_messages_conversation_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "chat_participants",
    "foreign_key_column": "conversation_id",
    "referenced_table": "chat_conversations",
    "referenced_column": "id",
    "constraint_name": "chat_participants_conversation_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "claims",
    "foreign_key_column": "booking_id",
    "referenced_table": "service_bookings",
    "referenced_column": "id",
    "constraint_name": "claims_booking_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "comments",
    "foreign_key_column": "post_id",
    "referenced_table": "posts",
    "referenced_column": "id",
    "constraint_name": "comments_post_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "group_event_participants",
    "foreign_key_column": "event_id",
    "referenced_table": "group_events",
    "referenced_column": "id",
    "constraint_name": "group_event_participants_event_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "group_event_participants",
    "foreign_key_column": "user_id",
    "referenced_table": "user_profiles",
    "referenced_column": "id",
    "constraint_name": "group_event_participants_user_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "group_events",
    "foreign_key_column": "created_by",
    "referenced_table": "user_profiles",
    "referenced_column": "id",
    "constraint_name": "group_events_created_by_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "group_events",
    "foreign_key_column": "group_id",
    "referenced_table": "groups",
    "referenced_column": "id",
    "constraint_name": "group_events_group_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "group_events",
    "foreign_key_column": "subgroup_id",
    "referenced_table": "subgroups",
    "referenced_column": "id",
    "constraint_name": "group_events_subgroup_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "group_invites",
    "foreign_key_column": "invitee_id",
    "referenced_table": "user_profiles",
    "referenced_column": "id",
    "constraint_name": "group_invites_invitee_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "group_invites",
    "foreign_key_column": "inviter_id",
    "referenced_table": "user_profiles",
    "referenced_column": "id",
    "constraint_name": "group_invites_inviter_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "group_invites",
    "foreign_key_column": "group_id",
    "referenced_table": "groups",
    "referenced_column": "id",
    "constraint_name": "group_invites_group_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "group_members",
    "foreign_key_column": "group_id",
    "referenced_table": "groups",
    "referenced_column": "id",
    "constraint_name": "group_members_group_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "group_members",
    "foreign_key_column": "user_id",
    "referenced_table": "user_profiles",
    "referenced_column": "id",
    "constraint_name": "group_members_user_id_fkey1"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "group_post_comments",
    "foreign_key_column": "author_id",
    "referenced_table": "user_profiles",
    "referenced_column": "id",
    "constraint_name": "group_post_comments_author_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "group_post_comments",
    "foreign_key_column": "post_id",
    "referenced_table": "group_posts",
    "referenced_column": "id",
    "constraint_name": "group_post_comments_post_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "group_post_comments",
    "foreign_key_column": "parent_id",
    "referenced_table": "group_post_comments",
    "referenced_column": "id",
    "constraint_name": "group_post_comments_parent_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "group_post_reactions",
    "foreign_key_column": "user_id",
    "referenced_table": "user_profiles",
    "referenced_column": "id",
    "constraint_name": "group_post_reactions_user_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "group_post_reactions",
    "foreign_key_column": "post_id",
    "referenced_table": "group_posts",
    "referenced_column": "id",
    "constraint_name": "group_post_reactions_post_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "group_posts",
    "foreign_key_column": "user_id",
    "referenced_table": "user_profiles",
    "referenced_column": "id",
    "constraint_name": "group_posts_user_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "group_posts",
    "foreign_key_column": "group_id",
    "referenced_table": "groups",
    "referenced_column": "id",
    "constraint_name": "group_posts_group_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "groups",
    "foreign_key_column": "owner_id",
    "referenced_table": "user_profiles",
    "referenced_column": "id",
    "constraint_name": "groups_owner_id_fkey1"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "housing_applications",
    "foreign_key_column": "listing_id",
    "referenced_table": "housing_listings",
    "referenced_column": "id",
    "constraint_name": "housing_applications_listing_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "housing_listings",
    "foreign_key_column": "provider_id",
    "referenced_table": "service_providers",
    "referenced_column": "id",
    "constraint_name": "housing_listings_provider_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "post_likes",
    "foreign_key_column": "post_id",
    "referenced_table": "posts",
    "referenced_column": "id",
    "constraint_name": "post_likes_post_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "post_reactions",
    "foreign_key_column": "post_id",
    "referenced_table": "posts",
    "referenced_column": "id",
    "constraint_name": "post_reactions_post_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "service_bookings",
    "foreign_key_column": "service_id",
    "referenced_table": "services",
    "referenced_column": "id",
    "constraint_name": "service_bookings_service_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "services",
    "foreign_key_column": "provider_id",
    "referenced_table": "service_providers",
    "referenced_column": "id",
    "constraint_name": "services_provider_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "subgroups",
    "foreign_key_column": "created_by",
    "referenced_table": "user_profiles",
    "referenced_column": "id",
    "constraint_name": "subgroups_created_by_fkey1"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "subgroups",
    "foreign_key_column": "group_id",
    "referenced_table": "groups",
    "referenced_column": "id",
    "constraint_name": "subgroups_group_id_fkey"
  },
  {
    "table_schema": "public",
    "table_with_foreign_key": "user_badges",
    "foreign_key_column": "badge_id",
    "referenced_table": "badge_definitions",
    "referenced_column": "id",
    "constraint_name": "user_badges_badge_id_fkey"
  }
]