# Rollodex Codebase Documentation

## Project Structure

The Rollodex codebase follows a feature-based organization with shared components and utilities. This document outlines the structure and purpose of each directory and key files.

## Root Directories

```
rollodex/
├── app/               # Main application screens and routes (Expo Router)
├── assets/            # Static assets (images, fonts)
├── components/        # Shared components used across the app
├── db/                # Database schema documentation and SQL queries
├── docs/              # Project documentation
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and services
├── providers/         # React context providers
├── supabase/          # Supabase migrations and configurations
└── types/             # TypeScript type definitions
```

## App Directory (Screens and Routing)

The `app` directory follows Expo Router's file-system based routing:

```

### Community Module Codebase Diagram

Below is a diagram showing the key files in `app/(tabs)/community/` and their relationships, including navigation (router links), imports, and shared component usage. This helps developers understand how screens connect, where navigation occurs, and what shared logic or UI is reused.

```mermaid
flowchart TD
  A[community/index.tsx\nCommunityFeed] -->|router.push| B[community/post.tsx\nPostDetails]
  A -->|router.push| C[community/create.tsx\nCreatePost]
  A -->|router.push| D[community/find-friends.tsx\nFindFriendsScreen]
  A -->|router.push| E[community/groups/index.tsx\nGroupsScreen]
  E -->|router.push| F[community/groups/create.tsx\nCreateGroup]
  E -->|router.push| G[community/groups/[id].tsx\nGroupDetails]
  
  subgraph Shared
    H[components/AppHeader.tsx]
    I[lib/supabase.ts]
    J[expo-router]
    K[lucide-react-native]
  end

  A -- imports --> H
  B -- imports --> H
  C -- imports --> H
  D -- imports --> H
  E -- imports --> H
  F -- imports --> H
  G -- imports --> H

  A -- imports --> I
  B -- imports --> I
  C -- imports --> I
  D -- imports --> I
  E -- imports --> I
  F -- imports --> I
  G -- imports --> I

  A -- imports --> J
  B -- imports --> J
  C -- imports --> J
  D -- imports --> J
  E -- imports --> J
  F -- imports --> J
  G -- imports --> J

  A -- imports --> K
  B -- imports --> K
  C -- imports --> K
  D -- imports --> K
  E -- imports --> K
  F -- imports --> K
  G -- imports --> K
```

**How to read this diagram:**
- **Solid arrows** (`-->`) show navigation (e.g., `router.push`) or explicit imports between files.
- **Shared** block lists core components and libraries used across all screens.
- Each box represents a file or component, with its main exported component in italics.
- This diagram is kept up to date as the codebase evolves. For changes, update this section.

app/
├── (agreements)/      # Service agreement screens
├── (auth)/            # Authentication screens
├── (tabs)/            # Main tab navigation screens
│   ├── community/     # Community features (groups, events)
│   ├── discover/      # Discovery screens with multiple view modes
│   ├── favorites/     # Saved and favorite items
│   ├── housing/       # Housing listings and co-living features
│   ├── profile/       # User profile screens
│   ├── provider/      # Service provider screens
│   ├── rewards/       # Rewards and achievements
│   └── wallet/        # NDIS wallet and financial management
├── chat/              # Chat and messaging screens
├── profile/           # Profile settings screens
└── _layout.tsx        # Root layout with providers
```

### Key Routes and Screen Structure

- **Root Layout** (`app/_layout.tsx`): Sets up providers and navigation structure
- **Tab Layout** (`app/(tabs)/_layout.tsx`): Configures the bottom tab navigation
- **Index Screen** (`app/index.tsx`): Entry point / onboarding screen
- **Not Found** (`app/+not-found.tsx`): 404 error screen

## Components Directory

Shared components used throughout the application:

```
components/
├── AppHeader.tsx         # Top navigation header
├── ErrorBoundary.tsx     # Error handling wrapper
├── NotificationBell.tsx  # Notification indicator
└── SecureAvatarUpload.tsx # Image upload component
```

## Library and Utilities

Services and utility functions in the `lib` directory:

```
lib/
├── accessibilityContext.tsx  # Accessibility settings provider
├── base64Utils.ts           # Base64 encoding/decoding utilities
├── errorUtils.ts            # Error handling utilities
├── mediaService.ts          # Media upload and management
├── navigationHelpers.ts     # Navigation utilities
├── notificationService.ts   # Notification handling
├── rewardsService.ts        # Rewards and achievements system
└── supabase.ts              # Supabase client configuration
```

## Providers Directory

Context providers for global state management:

```
providers/
├── AuthProvider.tsx      # Authentication state management
└── [Additional providers]
```

## Database and Supabase

```
supabase/
└── migrations/           # Database migration scripts
    ├── 20250406102920_spring_beacon.sql
    ├── 20250408_notifications_system.sql
    ├── 20250408_rewards_system.sql
    └── [Additional migrations]
```

## Key Components Deep Dive

### SwipeCard Component

The SwipeCard component provides Tinder-like swiping functionality for service and housing listings. Recently refactored to use pure React Native animations instead of web-based libraries.

Key features:
- Uses React Native's PanResponder for gesture handling
- Implements smooth animations with the Animated API
- Supports like/dislike indicators during swipes
- Shows a Group Match badge for housing listings associated with groups

### Rewards System

The rewards system tracks user achievements, streaks, and points through the RewardsService. Key functionality includes:

- Badge awarding for user accomplishments
- Streak tracking for regular app usage
- Points system for activity rewards
- Achievement progress tracking

## Code Patterns and Best Practices

### Error Handling Pattern

The codebase follows a consistent error handling pattern:

```typescript
try {
  // Operation that might throw
} catch (e: unknown) {
  // Type catch variables as 'unknown' and check type before accessing properties
  setError(e instanceof Error ? e.message : 'An unknown error occurred');
}
```

### Database Error Handling

Error handling with Supabase operations:

```typescript
try {
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
  setData(data || []);
} catch (e: unknown) {
  console.error('Error:', e instanceof Error ? e.message : 'Unknown error');
  setData(fallbackData); // Use mock data for a better user experience
}
```

### Component Structure Pattern

Components follow a consistent structure:

```typescript
interface ComponentProps {
  // Props definition
}

export default function Component({ prop1, prop2 }: ComponentProps) {
  // State and hooks

  // Effect hooks

  // Helper functions

  // Render
  return (
    // JSX
  );
}

const styles = StyleSheet.create({
  // Styles
});
```

## Database Schema

The application uses a PostgreSQL database with multiple tables:

### Core Tables

- **user_profiles**: User information and settings
- **service_providers**: Service provider information
- **services**: Available services
- **service_bookings**: Service appointment bookings
- **claims**: NDIS claims for services

### Housing Module Tables

- **housing_listings**: Available housing properties
- **housing_groups**: Co-living groups for housing
- **housing_group_members**: Members of housing groups
- **housing_group_invites**: Invitations to housing groups

### Rewards System Tables

- **badges**: Available achievement badges
- **user_badges**: Badges earned by users
- **user_streaks**: User activity streaks
- **user_points**: User point balances
- **point_transactions**: History of point awards/deductions

### Social Module Tables

- **friendships**: Connections between users
- **chat_participants**: Chat room participants
- **chat_messages**: Individual chat messages

## Recent Implementations and Fixes

### Media Upload System

- Cross-platform image uploading with base64 encoding
- Support for both camera and gallery sources
- Proper permission handling
- Dedicated storage buckets for different types of media

### SwipeCard Animation System

- Fixed implementation for proper card swiping
- Smooth transitions between cards
- Proper z-index management
- Like/dislike indicators during swipes

### Database Fixes

- Fixed missing views for profiles with friendships
- Resolved recursive policy issues in chat permissions
- Improved error handling throughout the database operations

## Testing and Mocks

The `__mocks__` directory contains mock data and functions for testing:

```
__mocks__/
├── mockBookings.ts
├── mockGroups.ts
└── [Additional mocks]
```

## Future Development Areas

### Housing Module Enhancements

- Accessibility features for housing listings
- Multiple images for property listings
- Virtual tours functionality
- Advanced search with filters

### Events System

- Event creation and management
- Calendar integration
- RSVP functionality
- Notifications for upcoming events

### Provider Experience Improvements

- Analytics dashboard
- Business intelligence features
- Scheduling tools
- Document management system
