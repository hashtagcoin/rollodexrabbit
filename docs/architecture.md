# Rollodex Application Architecture

## Overview

Rollodex is a mobile-first, visually-driven social and services platform tailored for NDIS participants. Built with React Native and Expo, the application enables users to discover, book, and review services and accessible housing while engaging in community groups and earning rewards.

## System Architecture

### Frontend Architecture

The application follows a modular architecture based on the Expo Router framework, which provides a file-system based routing approach.

#### Key Architectural Components

1. **Routing System**
   - Expo Router with file-system based navigation
   - Nested layouts (tabs, modals, stacks)
   - Dynamic routes for resource-specific screens

2. **Context Providers**
   - `AuthProvider`: Manages authentication state and user sessions
   - `AccessibilityProvider`: Manages accessibility settings and preferences

3. **Core Services**
   - `RewardsService`: Manages user achievements, badges, streaks, and points
   - `NotificationService`: Handles in-app and push notifications
   - `MediaService`: Handles media uploads and retrievals

4. **UI Component Hierarchy**
   - App-wide components (AppHeader, ErrorBoundary)
   - Screen-specific components
   - Shared UI elements (cards, buttons, inputs)

### Backend Architecture

The application uses Supabase as its backend platform, which provides a PostgreSQL database with Row Level Security.

#### Key Backend Components

1. **Authentication**
   - Supabase Auth for user authentication and session management
   - Row Level Security policies for data protection

2. **Database**
   - PostgreSQL with multiple related tables
   - Views for complex data retrieval
   - Functions and triggers for business logic

3. **Storage**
   - Supabase Storage for file storage
   - Separate buckets for different content types (avatars, housing images, etc.)

4. **Serverless Functions**
   - Database triggers and functions for automated processes
   - Security policies for data access control

## Data Flow Architecture

### Authentication Flow

1. User initiates login/signup
2. AuthProvider communicates with Supabase Auth
3. On successful authentication, session is stored and user is redirected
4. AuthProvider listens for auth state changes and updates the UI accordingly

### Service Discovery Flow

1. User navigates to Discover tab
2. App fetches services/housing listings from Supabase
3. UI presents data in various view modes (Grid, List, Swipe)
4. User interactions (swipes, likes) are tracked and processed

### Rewards System Flow

1. User performs actions (login, booking, etc.)
2. Actions are tracked via the RewardsService
3. Database functions update streaks, progress, and points
4. User is notified of new achievements and rewards

## Module Architecture

### Core Modules

1. **Authentication Module**
   - Login/Signup screens
   - Password reset
   - Session management

2. **Discover Module**
   - Service and housing discovery
   - Filtering and searching
   - Different view modes (Grid, List, Swipe)

3. **Housing Module**
   - Housing listings
   - Housing groups
   - Co-living applications

4. **Community Module**
   - Groups and subgroups
   - Events
   - Social interactions

5. **Wallet Module**
   - NDIS fund tracking
   - Transaction history
   - Claims management

6. **Rewards Module**
   - Achievements and badges
   - Points system
   - Redemption options

7. **Profile Module**
   - User profile management
   - Preferences and settings
   - Activity history

### Cross-cutting Concerns

1. **Accessibility**
   - High-contrast mode
   - Text scaling
   - Reduced motion

2. **Error Handling**
   - Typed error handling
   - Fallback mechanisms
   - User-friendly error messages

3. **State Management**
   - Context API for global state
   - Local state with useState
   - Asynchronous state with useEffect

## Technical Architecture

### Frontend Technologies

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **UI Components**: Custom components with React Native primitives
- **Animations**: React Native Animated API

### Backend Technologies

- **Platform**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Security**: Row Level Security (RLS)

### Development Tools

- **Package Manager**: npm
- **Testing**: Jest
- **Linting**: ESLint and Prettier
- **Version Control**: Git

## Deployment Architecture

- **Mobile**: Expo build system for iOS and Android
- **Database**: Supabase hosted PostgreSQL
- **Storage**: Supabase Storage buckets
- **CI/CD**: Not specified in the codebase

## Evolution and Future Architecture

The architecture is designed to evolve with the following considerations:

1. **Integration with External NDIS Systems**
   - Connection to NDIS payment gateways
   - Integration with official NDIS APIs

2. **Advanced AI Features**
   - Service recommendations based on user preferences
   - Accessibility assistance through AI
   - Automated content moderation

3. **Performance Optimization**
   - Database query optimization
   - React Native component rendering optimization
   - Image and asset loading improvements
