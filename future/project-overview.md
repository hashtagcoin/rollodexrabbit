# Rollodex Project Overview

> **Important Note**: This document should be read from top to bottom, as development occurred in this chronological order. If you encounter conflicting information, the later (lower) implementation details supersede earlier ones. The features and components described most recently reflect the current state of the project.

## Introduction

Rollodex is a mobile-first, visually-driven social and services platform tailored to the needs of NDIS participants. It enables users to discover, book, and review services and accessible housing, while engaging in community groups and earning rewards. Inspired by Instagram and Airbnb, Rollodex is built for accessibility, NDIS compliance, and user empowerment.

## Core Features

### User Experience
- **Accessible Design**: High-contrast mode, screen reader compatibility, voice navigation
- **Intuitive Navigation**: Consistent AppHeader across screens with proper back button functionality
- **Multi-view Options**: Grid, List, and Swipe views for content discovery

### Service Discovery & Booking
- **NDIS Service Discovery**: Browse and filter services by category, location, and availability
- **Booking Management**: Schedule appointments with automatic wallet verification
- **Service Agreements**: Digital signing and storage of NDIS service agreements

### Housing & Accommodation
- **Accessible Housing**: Search for SDA-certified and accessible housing
- **Virtual Tours**: View property details and take virtual tours
- **Application Process**: Apply for housing with required documentation

### Wallet & Financial Management
- **NDIS Funds Tracking**: Monitor available funds by category
- **Claims Management**: Track and submit claims for services
- **Transaction History**: View history of bookings, payments, and claims

### Social & Community
- **Groups & Subgroups**: Join interest groups and create subgroups for events
- **Posts & Media**: Share posts with media, tags, and reactions
- **Friendships**: Connect with other users and share experiences

### Rewards & Gamification
- **Badges & Achievements**: Earn badges for activities and milestones
- **Streaks**: Maintain login and booking streaks for rewards
- **Redeemable Points**: Convert achievements into wallet credits or perks

## User Roles

### Participant
- Primary users seeking services, housing, and social connections
- Access to wallet, bookings, groups, and rewards features

### Provider
- Business users offering services or housing listings
- Access to booking management, service creation, and business profile

### Admin
- System administrators managing verification, flags, approvals
- Access to content moderation and user management

### Plan Manager / Support Coordinator
- Optional delegates for user access
- Limited permissions to assist with specific tasks

## Technical Architecture

### Frontend
- React Native with Expo
- TypeScript for type safety and code quality
- Expo Router for navigation

### Backend
- Supabase for authentication, database, and storage
- PostgreSQL database with Row Level Security
- Serverless functions for complex operations

### Data Storage
- User data in Supabase tables
- Media files in Supabase Storage
- Secure document storage with access controls

## Design Principles

1. **Accessibility First**: All features designed with accessibility in mind
2. **User Empowerment**: Users control their data and experiences
3. **Visual Engagement**: Image-rich interfaces for intuitive interaction
4. **Consistent Navigation**: Predictable navigation patterns throughout
5. **Error Resilience**: Robust error handling and recovery mechanisms

## Current Status (April 2025)

- Core features implemented including service discovery, booking, wallet management
- Recent fixes to booking functionality and navigation consistency
- Ongoing enhancements to UI/UX based on user feedback
- Database schema optimizations for performance and security

## Roadmap

1. **Enhancement Phase**: Improve existing features and fix identified issues
2. **Expansion Phase**: Add advanced social features and AI recommendations
3. **Integration Phase**: Connect with external NDIS systems and payment gateways

## Getting Started

For developers joining the project, please review:
- [Developer Guide](./developer-guide.md) for code standards and practices
- [Database Schema](./database-schema.md) for data structure information
- [User Guide](./user-guide.md) for feature documentation
