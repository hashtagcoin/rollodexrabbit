# Rollodex Development Guide

## Application Overview

Rollodex is a social and service booking application designed to help users:
- Connect with service providers
- Book appointments
- Track rewards and achievements
- Manage profiles with avatars and images

## Recent Implementations

### 1. Rewards System

The rewards system rewards users for different actions and achievements in the app.

#### Database Schema

The rewards system uses the following tables:
- `badge_definitions`: Stores available badges and their requirements
- `user_badges`: Tracks which badges each user has earned
- `user_streaks`: Tracks user activity streaks (login, posting, etc.)
- `user_points`: Stores user point balances
- `point_transactions`: Records history of point awards and deductions
- `user_achievements`: Tracks progress towards different achievements

#### Migration Files

- **[20250408_rewards_system.sql](../supabase/migrations/20250408_rewards_system.sql)**: Creates all tables, functions, and triggers for the rewards system
- **[20250408_notifications_system.sql](../supabase/migrations/20250408_notifications_system.sql)**: Adds notification support for rewards events

#### Key Functions

- `update_user_streak(p_user_id, p_streak_type)`: Updates a user's streak count
- `award_points(p_user_id, p_amount, p_transaction_type, p_description, p_reference_id)`: Awards points to a user
- `check_and_award_badges(p_user_id)`: Checks if a user has earned new badges
- `update_achievement_progress(p_user_id, p_achievement_type, p_progress_increment, p_target)`: Updates progress towards an achievement

#### Frontend Components

- **[RewardsService](../lib/rewardsService.ts)**: Service for interacting with the rewards system from frontend components
- **[Profile Screen](../app/(tabs)/profile/index.tsx)**: Displays user rewards, badges, and points
- **[Rewards Screen](../app/(tabs)/rewards/index.tsx)**: Dedicated screen for viewing rewards progress

### 2. Media Upload System

The media upload system handles user-generated content like profile photos and group images.

#### Storage Configuration

- **[20250408_storage_policies.sql](../supabase/migrations/20250408_storage_policies.sql)**: Sets up storage buckets and security policies
- Storage buckets: avatars, group-avatars, group-posts, housing-listings, service-providers, ndis-documents

#### Media Upload Solution

We implemented a base64 approach for reliable cross-platform image uploads:

1. **[base64Utils.ts](../lib/base64Utils.ts)**: Utilities for decoding base64 data for Supabase storage
2. **Image Upload Components**:
   - **[Profile Edit](../app/(tabs)/profile/edit.tsx)**: Handles avatar uploads
   - **[Group Creation](../app/(tabs)/community/groups/create.tsx)**: Handles group avatar and cover image uploads

#### Best Practices

- Request base64 data directly from ImagePicker
- Use proper content-type based on file extension
- Follow TypeScript error handling best practices
- Implement detailed logging for troubleshooting

```typescript
try {
  // Upload code
} catch (e: unknown) {
  // Proper error typing and checking
  setError(e instanceof Error ? e.message : 'An unknown error occurred');
}
```

### 3. Properly Typed Error Handling

Throughout the codebase, we follow this pattern for handling errors:

```typescript
try {
  // Operation that might throw
} catch (e: unknown) {
  // Type catch variables as 'unknown' and check type before accessing properties
  setError(e instanceof Error ? e.message : 'An unknown error occurred');
}
```

This pattern:
- Prevents TypeScript errors
- Provides better error messages to users
- Follows TypeScript best practices

## Development Environment Setup

### Prerequisites

- Node.js v18+
- npm or yarn
- Supabase CLI for local development

### Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables (see `.env.example`)
4. Start the development server:
   ```
   npm start
   ```

### Supabase Migrations

To run migrations on your Supabase instance:

1. Connect to your Supabase instance
2. Navigate to the SQL Editor
3. Run the migration files in order:
   - 20250408_rewards_system.sql
   - 20250408_notifications_system.sql
   - 20250408_storage_policies.sql

## Troubleshooting

### Common Issues

#### Image Upload Problems

If images aren't displaying:
1. Check browser console for upload errors
2. Verify storage bucket permissions in Supabase
3. Check storage policies in SQL Editor

#### Rewards System Issues

If rewards aren't being tracked:
1. Verify all tables exist in the database
2. Check for console errors when actions are performed
3. Use fallback UI when data is missing

## Future Enhancements

Planned improvements for the Rollodex app:

1. **Enhanced Notification System**:
   - Push notifications for rewards
   - Streaks expiration warnings

2. **Advanced Rewards Analytics**:
   - Charts and visualizations for user progress
   - Comparative statistics with other users

3. **Image Optimization**:
   - Implement server-side resizing
   - Progressive loading for better performance
