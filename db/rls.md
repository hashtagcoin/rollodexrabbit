# Row Level Security (RLS) Policies

This file lists all Row Level Security (RLS) policies defined in the Rollodex database. RLS policies control which rows in a table a user can access or modify, enforcing security at the database level rather than in application code.

## Key Information:
- **schema_name**: The schema where the table resides (public)
- **table_name**: The name of the table with the policy
- **policy_name**: The descriptive name of the policy
- **command_type**: The operation type (SELECT, INSERT, UPDATE, DELETE, ALL)
- **using_expression**: The condition that determines which rows are visible (for SELECT/UPDATE/DELETE)
- **check_expression**: The condition that determines which rows can be inserted/updated (for INSERT/UPDATE)
- **policy_type**: Whether the policy is PERMISSIVE or RESTRICTIVE
- **roles**: Specific roles the policy applies to (if empty, applies to all roles)

## Important Note for Chat Features:
The RLS policies for `chat_participants` appear to be missing from this export. According to the summary document, these policies need to be fixed to resolve an infinite recursion issue. When implementing the chat system, you'll need to:

1. Create proper non-recursive RLS policies for the `chat_participants` table
2. Ensure users can only see conversations they're participants in
3. Prevent unauthorized access to chat messages

When implementing these policies, avoid circular references that can cause the reported infinite recursion problem.

[
  {
    "schema_name": "public",
    "table_name": "badges",
    "policy_name": "badges_read_policy",
    "command_type": "SELECT",
    "using_expression": "(auth.role() = 'authenticated'::text)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "chat_conversations",
    "policy_name": "Users can create conversations",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "true",
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "chat_conversations",
    "policy_name": "Users can view conversations they're part of",
    "command_type": "SELECT",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM chat_participants\n  WHERE ((chat_participants.conversation_id = chat_conversations.id) AND (chat_participants.user_id = auth.uid()))))",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "chat_messages",
    "policy_name": "Users can access messages in their conversations",
    "command_type": "ALL",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM chat_participants cp\n  WHERE ((cp.conversation_id = chat_messages.conversation_id) AND (cp.user_id = auth.uid()))))",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "chat_messages",
    "policy_name": "Users can send messages to conversations they're part of",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "((auth.uid() = sender_id) AND (EXISTS ( SELECT 1\n   FROM chat_participants\n  WHERE ((chat_participants.conversation_id = chat_messages.conversation_id) AND (chat_participants.user_id = auth.uid())))))",
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "chat_messages",
    "policy_name": "Users can update their own messages",
    "command_type": "UPDATE",
    "using_expression": "(auth.uid() = sender_id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "chat_messages",
    "policy_name": "Users can view messages in their conversations",
    "command_type": "SELECT",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM chat_participants\n  WHERE ((chat_participants.conversation_id = chat_messages.conversation_id) AND (chat_participants.user_id = auth.uid()))))",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "chat_participants",
    "policy_name": "Simple access policy",
    "command_type": "ALL",
    "using_expression": "true",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "claims",
    "policy_name": "Users can create their own claims",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "(auth.uid() = user_id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "claims",
    "policy_name": "Users can view their own claims",
    "command_type": "SELECT",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "comments",
    "policy_name": "Users can create their own comments",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "(auth.uid() = user_id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "comments",
    "policy_name": "Users can delete their own comments",
    "command_type": "DELETE",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "comments",
    "policy_name": "Users can read all comments",
    "command_type": "SELECT",
    "using_expression": "true",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "comments",
    "policy_name": "Users can update their own comments",
    "command_type": "UPDATE",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": "(auth.uid() = user_id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "friendships",
    "policy_name": "Users can create their own friendship requests",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "(auth.uid() = user_id)",
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "friendships",
    "policy_name": "Users can delete their own friendships",
    "command_type": "DELETE",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "friendships",
    "policy_name": "Users can update their own friendships",
    "command_type": "UPDATE",
    "using_expression": "((auth.uid() = user_id) OR (auth.uid() = friend_id))",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "friendships",
    "policy_name": "Users can view their own friendships",
    "command_type": "SELECT",
    "using_expression": "((auth.uid() = user_id) OR (auth.uid() = friend_id))",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "group_events",
    "policy_name": "Users can view public group events",
    "command_type": "SELECT",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM groups\n  WHERE ((groups.id = group_events.group_id) AND ((groups.is_public = true) OR (EXISTS ( SELECT 1\n           FROM group_members\n          WHERE ((group_members.group_id = groups.id) AND (group_members.user_id = auth.uid()))))))))",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "group_members",
    "policy_name": "Users can join groups",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "(auth.uid() = user_id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "group_members",
    "policy_name": "Users can view group members",
    "command_type": "SELECT",
    "using_expression": "true",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "group_posts",
    "policy_name": "Allow author or admin delete access",
    "command_type": "DELETE",
    "using_expression": "((user_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM group_members\n  WHERE ((group_members.group_id = group_posts.group_id) AND (group_members.user_id = auth.uid()) AND (group_members.role = 'admin'::text)))))",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "group_posts",
    "policy_name": "Allow member insert access",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "(EXISTS ( SELECT 1\n   FROM group_members\n  WHERE ((group_members.group_id = group_posts.group_id) AND (group_members.user_id = auth.uid()))))",
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "group_posts",
    "policy_name": "Allow member read access",
    "command_type": "SELECT",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM group_members\n  WHERE ((group_members.group_id = group_posts.group_id) AND (group_members.user_id = auth.uid()))))",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "groups",
    "policy_name": "Allow admin update access",
    "command_type": "UPDATE",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM group_members\n  WHERE ((group_members.group_id = groups.id) AND (group_members.user_id = auth.uid()) AND (group_members.role = 'admin'::text))))",
    "check_expression": "(EXISTS ( SELECT 1\n   FROM group_members\n  WHERE ((group_members.group_id = groups.id) AND (group_members.user_id = auth.uid()) AND (group_members.role = 'admin'::text))))",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "groups",
    "policy_name": "Allow public and member read access",
    "command_type": "SELECT",
    "using_expression": "((is_public = true) OR (EXISTS ( SELECT 1\n   FROM group_members\n  WHERE ((group_members.group_id = groups.id) AND (group_members.user_id = auth.uid())))))",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "groups",
    "policy_name": "Group owners can delete their groups",
    "command_type": "DELETE",
    "using_expression": "(auth.uid() = owner_id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "groups",
    "policy_name": "Group owners can update their groups",
    "command_type": "UPDATE",
    "using_expression": "(auth.uid() = owner_id)",
    "check_expression": "(auth.uid() = owner_id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "groups",
    "policy_name": "Users can create groups",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "(auth.uid() = owner_id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "groups",
    "policy_name": "Users can view all groups",
    "command_type": "SELECT",
    "using_expression": "true",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "housing_applications",
    "policy_name": "Providers can view applications for their listings",
    "command_type": "SELECT",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM housing_listings\n  WHERE ((housing_listings.id = housing_applications.listing_id) AND (housing_listings.provider_id = auth.uid()))))",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "housing_applications",
    "policy_name": "Users can create applications",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "(auth.uid() = user_id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "housing_applications",
    "policy_name": "Users can update their own applications",
    "command_type": "UPDATE",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": "(auth.uid() = user_id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "housing_applications",
    "policy_name": "Users can view their own applications",
    "command_type": "SELECT",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "housing_listings",
    "policy_name": "Anyone can view available listings",
    "command_type": "SELECT",
    "using_expression": "true",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "housing_listings",
    "policy_name": "Providers can manage their own listings",
    "command_type": "ALL",
    "using_expression": "(auth.uid() = provider_id)",
    "check_expression": "(auth.uid() = provider_id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "notifications",
    "policy_name": "Users can update their own notifications",
    "command_type": "UPDATE",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": "(auth.uid() = user_id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "notifications",
    "policy_name": "Users can view their own notifications",
    "command_type": "SELECT",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "post_likes",
    "policy_name": "Users can create their own likes",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "(auth.uid() = user_id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "post_likes",
    "policy_name": "Users can delete their own likes",
    "command_type": "DELETE",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "post_likes",
    "policy_name": "Users can read all likes",
    "command_type": "SELECT",
    "using_expression": "true",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "post_reactions",
    "policy_name": "Users can create their own reactions",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "(auth.uid() = user_id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "post_reactions",
    "policy_name": "Users can delete their own reactions",
    "command_type": "DELETE",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "post_reactions",
    "policy_name": "Users can read all reactions",
    "command_type": "SELECT",
    "using_expression": "true",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "posts",
    "policy_name": "Users can create their own posts",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "(auth.uid() = user_id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "posts",
    "policy_name": "Users can delete their own posts",
    "command_type": "DELETE",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "posts",
    "policy_name": "Users can read all posts",
    "command_type": "SELECT",
    "using_expression": "true",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "posts",
    "policy_name": "Users can update their own posts",
    "command_type": "UPDATE",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": "(auth.uid() = user_id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "rewards",
    "policy_name": "Users can view their own rewards",
    "command_type": "SELECT",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "service_bookings",
    "policy_name": "Users can create their own bookings",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "(auth.uid() = user_id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "service_bookings",
    "policy_name": "Users can view their own bookings",
    "command_type": "SELECT",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "service_providers",
    "policy_name": "Service providers are publicly visible",
    "command_type": "SELECT",
    "using_expression": "true",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "service_providers",
    "policy_name": "Service providers are viewable by all users",
    "command_type": "SELECT",
    "using_expression": "true",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "service_providers",
    "policy_name": "Users can create their own provider profile",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "(auth.uid() = id)",
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "service_providers",
    "policy_name": "Users can update their own provider profile",
    "command_type": "UPDATE",
    "using_expression": "(auth.uid() = id)",
    "check_expression": "(auth.uid() = id)",
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "services",
    "policy_name": "Services are viewable by all users",
    "command_type": "SELECT",
    "using_expression": "true",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "subgroups",
    "policy_name": "Group members can create subgroups",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "(auth.uid() IN ( SELECT group_members.user_id\n   FROM group_members\n  WHERE (group_members.group_id = subgroups.group_id)))",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "subgroups",
    "policy_name": "Subgroup creators and group admins can delete subgroups",
    "command_type": "DELETE",
    "using_expression": "((auth.uid() = created_by) OR (auth.uid() IN ( SELECT group_members.user_id\n   FROM group_members\n  WHERE ((group_members.group_id = subgroups.group_id) AND (group_members.role = 'admin'::text)))))",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "subgroups",
    "policy_name": "Subgroup creators can manage their subgroups",
    "command_type": "UPDATE",
    "using_expression": "(auth.uid() = created_by)",
    "check_expression": "(auth.uid() = created_by)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "subgroups",
    "policy_name": "Users can view subgroups",
    "command_type": "SELECT",
    "using_expression": "true",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "user_badges",
    "policy_name": "user_badges_insert_policy",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "(auth.uid() = user_id)",
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "user_badges",
    "policy_name": "user_badges_read_policy",
    "command_type": "SELECT",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "user_badges",
    "policy_name": "user_badges_update_policy",
    "command_type": "UPDATE",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "user_profiles",
    "policy_name": "Allow authenticated read access",
    "command_type": "SELECT",
    "using_expression": "true",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "user_profiles",
    "policy_name": "New users can create their profile",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "(auth.uid() = id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "user_profiles",
    "policy_name": "Service role can manage all profiles",
    "command_type": "ALL",
    "using_expression": "true",
    "check_expression": "true",
    "policy_type": "PERMISSIVE",
    "roles": "service_role"
  },
  {
    "schema_name": "public",
    "table_name": "user_profiles",
    "policy_name": "Users can read own profile",
    "command_type": "SELECT",
    "using_expression": "(auth.uid() = id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "user_profiles",
    "policy_name": "Users can select their own profile",
    "command_type": "SELECT",
    "using_expression": "(auth.uid() = id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "user_profiles",
    "policy_name": "Users can update own profile",
    "command_type": "UPDATE",
    "using_expression": "(auth.uid() = id)",
    "check_expression": "(auth.uid() = id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "user_profiles",
    "policy_name": "Users can update their own profile",
    "command_type": "UPDATE",
    "using_expression": "(auth.uid() = id)",
    "check_expression": "(auth.uid() = id)",
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "user_profiles",
    "policy_name": "Users can view their own profile",
    "command_type": "SELECT",
    "using_expression": "(auth.uid() = id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": "authenticated"
  },
  {
    "schema_name": "public",
    "table_name": "user_streaks",
    "policy_name": "user_streaks_read_policy",
    "command_type": "SELECT",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "user_streaks",
    "policy_name": "user_streaks_update_policy",
    "command_type": "UPDATE",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "wallets",
    "policy_name": "Users can create their own wallet",
    "command_type": "INSERT",
    "using_expression": null,
    "check_expression": "(auth.uid() = user_id)",
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "wallets",
    "policy_name": "Users can update their own wallet",
    "command_type": "UPDATE",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": "(auth.uid() = user_id)",
    "policy_type": "PERMISSIVE",
    "roles": ""
  },
  {
    "schema_name": "public",
    "table_name": "wallets",
    "policy_name": "Users can view their own wallet",
    "command_type": "SELECT",
    "using_expression": "(auth.uid() = user_id)",
    "check_expression": null,
    "policy_type": "PERMISSIVE",
    "roles": ""
  }
]