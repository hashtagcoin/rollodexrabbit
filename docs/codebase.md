# Rollodex Codebase Overview

This document provides a high-level overview of the Rollodex React Native application's codebase structure.

## Root Directory Structure

*   **Configuration Files:**
    *   `app.json`: Expo configuration (metadata, build settings, plugins).
    *   `package.json`: NPM package manifest (dependencies, scripts).
    *   `babel.config.js`: Babel configuration (JavaScript transpilation).
    *   `metro.config.js`: Metro bundler configuration.
    *   `tsconfig.json`: TypeScript configuration.
    *   `.env`: Environment variables (API keys, etc. - **Not committed**).
    *   `.gitignore`: Specifies files/folders ignored by Git.
    *   `*.config.js`, `*.setup.js`: Jest testing framework configuration.
*   **Core Source Code Directories:**
    *   `app/`: Screens & Navigation (using Expo Router).
    *   `components/`: Reusable UI components.
    *   `lib/`: Shared libraries, utilities, Supabase client setup.
    *   `providers/`: React Context providers (e.g., AuthProvider).
    *   `hooks/`: Custom React Hooks for reusable logic.
    *   `types/`: Shared TypeScript interfaces and type definitions.
    *   `assets/`: Static assets (images, fonts).
*   **Backend Related:**
    *   `supabase/`: Supabase local development files (migrations, functions).
*   **Documentation:**
    *   `docs/`: Contains PRD, technical architecture, database schema, etc.
    *   `README.md`: Project setup and overview.
*   **Other:**
    *   `node_modules/`: Project dependencies (managed by npm/yarn - **Not committed**).
    *   `__mocks__/`: Mocks for testing.

## `app/` Directory (Screens & Navigation - Expo Router)

This directory defines the application's screens and navigation flow.

*   **Root Layout & Catch-all:**
    *   `_layout.tsx`: Root layout for the entire app (wraps everything, sets up base navigation/providers).
    *   `+not-found.tsx`: Screen displayed for invalid routes (404).
    *   `index.tsx`: Initial entry screen after layout (often redirects to main tabs or handles onboarding).
*   **Route Groups (Organized by Feature/Flow):**
    *   `(tabs)/`: Defines the main bottom tab navigation (see details below).
    *   `(agreements)/`: Screens related to service agreements.
    *   `(auth)/`: Screens for login, signup, password reset.
*   **Feature-Specific Screens/Sections (outside tabs):**
    *   `chat/`: Chat list and individual chat screens.
    *   `community/`: General community features (distinct from tabbed groups?).
    *   `housing/`: Potential duplicate or specific non-tabbed housing flow (needs review).
    *   `ndis-plan.tsx`: Screen for viewing/managing NDIS plan details.
    *   `notifications.tsx`: Screen displaying user notifications.
    *   `profile/`: Screens for viewing/editing user profiles (possibly duplicates tabbed profile).
    *   `rewards/`: Screens for the rewards/gamification system.
    *   `users/`: Screens for viewing *other* users' profiles (e.g., `users/[userId].tsx`).
*   `old/`: Deprecated code.

## `app/(tabs)/` Directory (Main Tab Navigation)

This directory defines the screens accessible via the main bottom tab bar.

*   `_layout.tsx`: **Crucial File**. Configures the `Tabs` navigator, defining tab icons, labels, order, and linking screens to tabs.
*   `index.tsx`: **Default Tab Screen?** Role needs confirmation via `_layout.tsx`. Might be the initial landing tab's content or a redirect.
*   **Tab Sections (each typically contains `_layout.tsx`, `index.tsx`, `[id].tsx`, etc.):**
    *   `community/`: Community group listing, details, management.
    *   `discover/`: Service/provider listing, details, search, filters.
    *   `favorites/`: List of user's favorited items.
    *   `housing/`: Housing listing, details, applications, housing group management (`group/[id].tsx`).
    *   `profile/`: Logged-in user's profile view, edit, settings, activity.
    *   `provider/`: Viewing provider profiles and their services.
    *   `rewards/`: Viewing earned rewards, badges, claiming.
    *   `wallet/`: NDIS wallet balance, categories, claims history.
