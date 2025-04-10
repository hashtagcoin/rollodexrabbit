# Database Tables and Columns

This file contains a comprehensive list of all tables in the Rollodex database with their complete column definitions. 

## Key Information:
- **table_name**: The name of the database table
- **column_name**: The name of the column within the table
- **data_type**: Data type of the column (uuid, text, integer, timestamp, etc.)
- **is_nullable**: Whether the column can contain NULL values (YES/NO)
- **column_default**: Default value for the column, if any
- **character_maximum_length**: Max length for character data types
- **numeric_precision/scale**: Precision and scale for numeric data types
- **ordinal_position**: Position of the column in the table definition

## Tables Relevant to Friend and Chat Features:
- **friendships**: Stores relationships between users
- **chat_conversations**: Stores chat conversation metadata
- **chat_messages**: Stores individual chat messages
- **chat_participants**: Links users to conversations they're part of
- **user_profiles**: Contains user profile information

Use this file to understand the exact structure of each table when implementing database queries and models.

[
  {
    "table_name": "badge_definitions",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 1
  },
  {
    "table_name": "badge_definitions",
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 2
  },
  {
    "table_name": "badge_definitions",
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 3
  },
  {
    "table_name": "badge_definitions",
    "column_name": "icon_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 4
  },
  {
    "table_name": "badge_definitions",
    "column_name": "category",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 5
  },
  {
    "table_name": "badge_definitions",
    "column_name": "points",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "0",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "ordinal_position": 6
  },
  {
    "table_name": "badge_definitions",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 7
  },
  {
    "table_name": "badge_definitions",
    "column_name": "requirements",
    "data_type": "jsonb",
    "is_nullable": "NO",
    "column_default": "'{}'::jsonb",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 8
  },
  {
    "table_name": "badge_definitions",
    "column_name": "is_active",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "true",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 9
  },
  {
    "table_name": "badges",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 1
  },
  {
    "table_name": "badges",
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 2
  },
  {
    "table_name": "badges",
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 3
  },
  {
    "table_name": "badges",
    "column_name": "icon_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 4
  },
  {
    "table_name": "badges",
    "column_name": "category",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 5
  },
  {
    "table_name": "badges",
    "column_name": "points",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "0",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "ordinal_position": 6
  },
  {
    "table_name": "badges",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 7
  },
  {
    "table_name": "chat_conversations",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 1
  },
  {
    "table_name": "chat_conversations",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 2
  },
  {
    "table_name": "chat_conversations",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 3
  },
  {
    "table_name": "chat_messages",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 1
  },
  {
    "table_name": "chat_messages",
    "column_name": "conversation_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 2
  },
  {
    "table_name": "chat_messages",
    "column_name": "sender_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 3
  },
  {
    "table_name": "chat_messages",
    "column_name": "content",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 4
  },
  {
    "table_name": "chat_messages",
    "column_name": "media_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 5
  },
  {
    "table_name": "chat_messages",
    "column_name": "read",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 6
  },
  {
    "table_name": "chat_messages",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 7
  },
  {
    "table_name": "chat_messages",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 8
  },
  {
    "table_name": "chat_participants",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 1
  },
  {
    "table_name": "chat_participants",
    "column_name": "conversation_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 2
  },
  {
    "table_name": "chat_participants",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 3
  },
  {
    "table_name": "chat_participants",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 4
  },
  {
    "table_name": "claims",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 1
  },
  {
    "table_name": "claims",
    "column_name": "booking_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 2
  },
  {
    "table_name": "claims",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 3
  },
  {
    "table_name": "claims",
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 4
  },
  {
    "table_name": "claims",
    "column_name": "amount",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 5
  },
  {
    "table_name": "claims",
    "column_name": "expiry_date",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 6
  },
  {
    "table_name": "claims",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 7
  },
  {
    "table_name": "comments",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 1
  },
  {
    "table_name": "comments",
    "column_name": "post_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 2
  },
  {
    "table_name": "comments",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 3
  },
  {
    "table_name": "comments",
    "column_name": "content",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 4
  },
  {
    "table_name": "comments",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 5
  },
  {
    "table_name": "friendships",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 1
  },
  {
    "table_name": "friendships",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 2
  },
  {
    "table_name": "friendships",
    "column_name": "friend_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 3
  },
  {
    "table_name": "friendships",
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 4
  },
  {
    "table_name": "friendships",
    "column_name": "category",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'friend'::text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 5
  },
  {
    "table_name": "friendships",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 6
  },
  {
    "table_name": "friendships",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 7
  },
  {
    "table_name": "group_event_participants",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 1
  },
  {
    "table_name": "group_event_participants",
    "column_name": "event_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 2
  },
  {
    "table_name": "group_event_participants",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 3
  },
  {
    "table_name": "group_event_participants",
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'going'::text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 4
  },
  {
    "table_name": "group_event_participants",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 5
  },
  {
    "table_name": "group_events",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 1
  },
  {
    "table_name": "group_events",
    "column_name": "group_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 2
  },
  {
    "table_name": "group_events",
    "column_name": "subgroup_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 3
  },
  {
    "table_name": "group_events",
    "column_name": "title",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 4
  },
  {
    "table_name": "group_events",
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 5
  },
  {
    "table_name": "group_events",
    "column_name": "start_time",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 6
  },
  {
    "table_name": "group_events",
    "column_name": "end_time",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 7
  },
  {
    "table_name": "group_events",
    "column_name": "location",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 8
  },
  {
    "table_name": "group_events",
    "column_name": "max_participants",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "ordinal_position": 9
  },
  {
    "table_name": "group_events",
    "column_name": "created_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 10
  },
  {
    "table_name": "group_events",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 11
  },
  {
    "table_name": "group_events",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 12
  },
  {
    "table_name": "group_invites",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 1
  },
  {
    "table_name": "group_invites",
    "column_name": "group_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 2
  },
  {
    "table_name": "group_invites",
    "column_name": "inviter_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 3
  },
  {
    "table_name": "group_invites",
    "column_name": "invitee_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 4
  },
  {
    "table_name": "group_invites",
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'pending'::text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 5
  },
  {
    "table_name": "group_invites",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 6
  },
  {
    "table_name": "group_invites",
    "column_name": "expires_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "(now() + '7 days'::interval)",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 7
  },
  {
    "table_name": "group_members",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 1
  },
  {
    "table_name": "group_members",
    "column_name": "group_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 2
  },
  {
    "table_name": "group_members",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 3
  },
  {
    "table_name": "group_members",
    "column_name": "role",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 4
  },
  {
    "table_name": "group_members",
    "column_name": "joined_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 5
  },
  {
    "table_name": "group_post_comments",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 1
  },
  {
    "table_name": "group_post_comments",
    "column_name": "post_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 2
  },
  {
    "table_name": "group_post_comments",
    "column_name": "author_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 3
  },
  {
    "table_name": "group_post_comments",
    "column_name": "content",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 4
  },
  {
    "table_name": "group_post_comments",
    "column_name": "parent_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 5
  },
  {
    "table_name": "group_post_comments",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 6
  },
  {
    "table_name": "group_post_comments",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 7
  },
  {
    "table_name": "group_post_reactions",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 1
  },
  {
    "table_name": "group_post_reactions",
    "column_name": "post_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 2
  },
  {
    "table_name": "group_post_reactions",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 3
  },
  {
    "table_name": "group_post_reactions",
    "column_name": "reaction_type",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 4
  },
  {
    "table_name": "group_post_reactions",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 5
  },
  {
    "table_name": "group_posts",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 1
  },
  {
    "table_name": "group_posts",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 2
  },
  {
    "table_name": "group_posts",
    "column_name": "group_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 3
  },
  {
    "table_name": "group_posts",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 4
  },
  {
    "table_name": "group_posts",
    "column_name": "content",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 5
  },
  {
    "table_name": "group_posts",
    "column_name": "media_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 6
  },
  {
    "table_name": "group_posts",
    "column_name": "media_type",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 7
  },
  {
    "table_name": "groups",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 1
  },
  {
    "table_name": "groups",
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "ordinal_position": 2
  }
]