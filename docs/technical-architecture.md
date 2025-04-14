# Rollodex Technical Architecture

> **Important Note**: This document should be read from top to bottom, as development occurred in this chronological order. If you encounter conflicting information, the later (lower) implementation details supersede earlier ones. The most recent implementations and architectural decisions are the ones that should be followed.

## System Overview

Rollodex is built using a modern tech stack designed for scalability, accessibility, and developer productivity. This document outlines the architecture and key components of the system.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Application                      │
│                                                             │
│  ┌─────────────┐    ┌────────────┐    ┌──────────────────┐  │
│  │ React Native │    │ Expo Router│    │ UI Components    │  │
│  │ Components   │◄───┤ Navigation │◄───┤ (AppHeader, etc) │  │
│  └─────────────┘    └────────────┘    └──────────────────┘  │
│          ▲                                      ▲           │
│          │                                      │           │
│          ▼                                      │           │
│  ┌────────────────────┐              ┌─────────────────┐   │
│  │ Business Logic     │              │ State Management │   │
│  │ (Screens, Services)│◄─────────────┤ (React Hooks)    │   │
│  └────────────────────┘              └─────────────────┘   │
│          │                                      ▲           │
└──────────┼──────────────────────────────────────┼───────────┘
           │                                      │
           ▼                                      │
┌──────────────────────┐                ┌────────────────────┐
│ Supabase Client      │                │ Authentication      │
│ (API & Data Access)  │◄───────────────┤ (User Sessions)     │
└──────────────────────┘                └────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│                      Supabase Backend                         │
│                                                              │
│  ┌─────────────┐    ┌────────────┐    ┌──────────────────┐   │
│  │ Authentication│   │ PostgreSQL │    │ Storage (Files,  │   │
│  │ (JWT, OAuth)  │   │ Database   │    │ Images, Docs)    │   │
│  └─────────────┘    └────────────┘    └──────────────────┘   │
│                            │                    │            │
│                            ▼                    ▼            │
│                    ┌────────────────┐  ┌────────────────┐   │
│                    │ Row Level      │  │ Signed URLs &   │   │
│                    │ Security (RLS) │  │ Access Control  │   │
│                    └────────────────┘  └────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Core Components

### Frontend Architecture

#### Application Framework
- **React Native**: Core framework for building cross-platform mobile applications
- **Expo**: Development toolchain and runtime for simplified React Native development
- **TypeScript**: Type-safe language for robust code

#### Navigation
- **Expo Router**: File-based routing system for navigation between screens
- **Screen Layout**: Consistent screen structure with AppHeader component

#### UI Components
- **Custom Components**: Reusable UI elements like AppHeader, NotificationBell
- **Lucide Icons**: Vector icons used throughout the application
- **Accessibility Components**: High-contrast toggles, screen reader support

#### State Management
- **React Hooks**: useState, useEffect, useContext for state management
- **Context API**: Shared state for authentication and theme settings

#### Media & Animations

#### Image Handling System
- **ImagePicker Integration**: Modern implementation with both camera and gallery support
- **Media Storage**: Supabase storage buckets with proper security policies (`avatars`, `group-avatars`, `group-posts`)
- **Upload Pipeline**: Base64 encoding for reliable cross-platform file uploads
- **Error Handling**: Comprehensive error handling with user-friendly alerts
- **Permission Management**: Proper camera and media library permission requests

#### Animation System
- **React Native Animated API**: Core animation system for fluid UI interactions
- **PanResponder Gestures**: Advanced gesture handling for swipe interactions
- **Optimized Performance**: Native driver usage for hardware-accelerated animations
- **Animation Composition**: Parallel animations for complex, coordinated movements
- **Progressive Feedback**: Visual indicators that respond to gesture intensity
- **Animation Cleanup**: Proper state management to prevent memory leaks

### Backend Architecture

#### Supabase Services
- **Authentication**: User registration, login, and session management
- **Database**: PostgreSQL database with tables for all application data
- **Storage**: File storage for images, documents, and media
- **Functions**: Serverless functions for complex operations

#### Database Design
- **Schema**: Normalized database schema following relational principles
- **RLS Policies**: Row Level Security policies for secure data access
- **Migrations**: SQL migrations for schema version control

#### Security Measures
- **JWT Authentication**: Secure authentication tokens
- **Row Level Security**: Table-level access control policies
- **Signed URLs**: Secure access to stored files
- **Input Validation**: Client and server-side validation

## Data Flow

### Authentication Flow
1. User enters credentials or uses OAuth provider
2. Supabase Auth validates credentials and issues JWT
3. JWT stored securely in device storage
4. Subsequent requests include JWT for authentication
5. Token refresh handled automatically

### Booking Flow
1. User selects service and appointment time
2. Client validates input and calls book_service_fixed function
3. Function checks wallet balance for appropriate category
4. On success, creates booking record and updates wallet
5. Creates claim record for service
6. Returns booking confirmation to client

### Data Fetching Pattern
1. Component mounts and calls fetch function
2. Loading state displayed during fetch
3. Supabase client executes query with proper filters
4. Data returned and stored in component state
5. Component renders based on returned data
6. Error handling displays appropriate messages

## Database Schema

The database schema is divided into functional modules:

### User & Profile Module
- `auth.users`: Managed by Supabase Auth
- `user_profiles`: User details, preferences, and settings

### Services Module
- `services`: Service listings with details and pricing
- `service_providers`: Provider information and verification status
- `service_bookings`: Appointment bookings linking users and services

### Financial Module
- `wallets`: User wallet balances with category breakdown
- `claims`: Service claims with status and expiry tracking

### Housing Module
- `housing_listings`: Property listings with details and features
- `housing_applications`: User applications for properties

### Social Module
- `posts`: User-generated content and media
- `comments`: Comments on posts
- `groups`: Interest and location-based community groups

### Notifications Module
- `notifications`: User notifications with status tracking

### Rewards Module
- `rewards`: User achievements, badges, and points

## Critical Functions

### Stored Procedures

#### book_service_fixed
Handles the complete booking process including:
- Wallet balance verification
- Booking record creation
- Wallet balance update
- Claim record creation

### Key API Endpoints

| Endpoint | Purpose | Access Control |
|----------|---------|----------------|
| `/auth/*` | Authentication flows | Public/Authenticated |
| `/service/*` | Service CRUD operations | Public read, Provider write |
| `/booking/*` | Booking management | User own bookings, Provider own services |
| `/wallet/*` | Wallet operations | User own wallet |
| `/housing/*` | Housing listings | Public read, Provider write |
| `/social/*` | Posts and interactions | Various based on privacy |

## Security Architecture

### Authentication Security
- JWT-based authentication
- Refresh token rotation
- Secure credential storage
- OAuth integration for third-party authentication

### Data Security
- Row Level Security policies on all tables
- Parameterized queries to prevent SQL injection
- Input validation on all user inputs
- Rate limiting on sensitive endpoints

### File Security
- Signed URLs for file access
- Content type validation
- Size restrictions
- Virus scanning before storage

## Performance Considerations

### Database Optimizations
- Indexing on frequently queried columns
- Denormalization where appropriate for read performance
- Pagination for large result sets
- Query optimization with proper joins

### Application Performance
- Lazy loading for images and content
- Virtualized lists for large data sets
- Memoization of expensive computations
- Background fetching for anticipated data

## Deployment Architecture

### Development Environment
- Local Expo development server
- Local or development Supabase instance
- Hot reloading for rapid development

### Testing Environment
- Dedicated Supabase project for testing
- Expo preview builds
- Automated testing suite

### Production Environment
- Supabase production instance with backups
- Published app through App Store and Google Play
- Monitoring and error reporting

## Error Handling Strategy

### Client-Side Errors
- TypeScript for compile-time error prevention
- Consistent try/catch pattern around async operations
- Error boundary components for UI recovery
- Graceful fallbacks for missing data

### Server-Side Errors
- Structured error responses with codes and messages
- Logging and monitoring for server errors
- Transaction management for data consistency
- Fallback mechanisms for critical operations

## Monitoring and Logging

### Application Monitoring
- Error reporting through third-party service
- Usage analytics for feature adoption
- Performance monitoring for critical screens

### Server Monitoring
- Database performance metrics
- API endpoint response times
- Error rate monitoring
- Resource utilization tracking

## Future Architecture Considerations

### Scalability Improvements
- Caching layer for frequently accessed data
- Read replicas for database scaling
- Content delivery network for media
- Microservices for specific features

### Planned Technical Enhancements
- Offline support with local data synchronization
- Push notifications infrastructure
- Real-time updates using Supabase Realtime
- Enhanced analytics for user behavior

## Appendix: Tools and Libraries

### Development Tools
- Visual Studio Code / Android Studio / Xcode
- Supabase CLI for local development
- Expo CLI for React Native development
- Git for version control

### Key Libraries
- React Native for cross-platform mobile development
- Expo SDK for device capabilities
- Supabase JS client for backend communication
- TypeScript for type safety

### Testing Tools
- Jest for unit testing
- React Native Testing Library for component testing
- Detox for end-to-end testing
- Cypress for web testing (admin portal)
