# Rollodexrabbit

## Technical Architecture & Codebase Overview

### Technology Stack & Architecture
- **Frontend:** React Native (Expo), TypeScript
- **Backend/Data:** Supabase (PostgreSQL, Auth, Storage)
- **Testing:** Jest, robust mocks and setup
- **Project Structure:** Modular, domain-driven, strong separation of concerns

### Directory & Module Overview
- `/app/`: Main screens, navigation, feature domains (auth, housing, chat, rewards, etc.)
- `/components/`: Shared UI components
- `/lib/`: Core business logic (accessibility, media, notifications, rewards, supabase integration)
- `/providers/`: Context providers (auth, accessibility)
- `/types/`: TypeScript type definitions
- `/docs/`: Documentation (schema, user guide)
- `/supabase/`: Migrations, backend config
- `/assets/`: Static assets and images

### Key Features
- Authentication, onboarding, NDIS plan linking
- Service discovery, booking, provider profiles
- Accessible housing search, virtual tours, applications
- Community groups, posts, chat
- Wallet integration for NDIS funds
- Gamification: points, badges, rewards
- In-app messaging, notifications
- Accessibility-first design

### Documentation
- `database-schema.md`: Query-backed, live schema reference
- `user-guide.md`: Comprehensive onboarding, features, accessibility, troubleshooting

### Summary
The codebase is a modern, scalable, accessibility-first platform for NDIS users, built for rapid feature development and robust user experience.

---

### Changelog (2025-04-18)
- **Deprecated Find Friends Screen Removed**: Fully cleared and deprecated `app/profile/friends/find.tsx`. All code, UI, and logic related to the old Find Friends screen have been removed.
- **Friends List UI Streamlined**: Navigation and UI now direct users to the main friends list, with no redundant screens or dead code.
- **Codebase Cleanup**: Confirmed that all lint and TypeScript errors related to the old screen are resolved. The codebase is now cleaner and easier to maintain.
