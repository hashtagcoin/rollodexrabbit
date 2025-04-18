Rollodex – Final Comprehensive Product Requirements Document (PRD)
Table of Contents
App Summary

User Roles

Features by Module

Detailed User Journey

Database Architecture Overview

Auth, Access, and Security

Media Upload & Protection

Optional Features & Future Enhancements

1. App Summary
Rollodex is a mobile-first, visually-driven social and services platform tailored to the needs of NDIS participants. It enables users to discover, book, and review services and accessible housing, while engaging in community groups and earning rewards. Inspired by Instagram and Airbnb, Rollodex is built for accessibility, NDIS compliance, and user empowerment.

2. User Roles
Participant – Seeks services, housing, social connections

Provider – Offers services or housing listings, manages bookings

Admin – Manages verification, flags, approvals, and content moderation

Plan Manager / Support Coordinator – Optional delegate for user access

3. Features by Module
Onboarding
NDIS Portal login or manual document upload

Comfort trait selection (image-based)

Category and service format preferences

Dashboard
Personalized greeting with wallet balance

Booking quick access and recent activity

Featured services and recommendations

Provider Discovery
Grid, List, and Swipe (Tinder-style) views

Advanced filtering by category, availability, transport, gender

Favorite provider with right swipe

Housing Discovery
Grid, List, Swipe options for listings

Apply directly or join co-living groups

Accessible housing with SDA filters and virtual tours

Bookings & Agreements
Auto-detect wallet eligibility

Split payment: NDIS + gap payment

Service agreement e-signature with download

Wallet & Claims
Breakdown of NDIS categories and expiry tracking

Pending claim status and submission history

Auto-claim, partial payment logic

*NDIS Plan Management Screen: Allows viewing and potentially managing linked NDIS plan details.*

Groups & Subgroups
*Users can browse a list of existing groups (interest or housing), view group details including description, owner, and member list (with admin indicators).*
*Users can join existing groups.*
*Group detail screen displays associated subgroups.*
Join or create interest or housing groups

Subgroups for events or travel coordination

Member roles: admin, member
*Functionality exists to potentially create subgroups and manage group settings (admin-only), but requires further implementation.*

Social Feed & Posts
Upload posts with media, tags, and captions

Like, comment, and react with emojis

Public and friends-only post settings

Profile & Tabs
Tabs: Posts, Groups, Appointments, Friends

Edit preferences, avatar, and visibility

Claim badges and track user stats

Rewards & Gamification
Badges for bookings, streaks, referrals

Claim wallet credit from achievements

Display profile rewards and status

Notifications
In-app alerts for bookings, reactions, friend activity

Smart notifications: claim expiry, agreement updates

Accessibility
Voice navigation, screen reader compatibility

High-contrast mode, simplified text toggle

4. Detailed User Journey
Download → Welcome animation → Onboarding

Sync NDIS data or upload plan

Choose comfort traits and preferred services

Dashboard shows wallet, matches, and trending services

Browse services, swipe or favorite providers

Book a service or housing → Auto-check funding

Sign agreement → Track booking → Submit review

Join groups or create subgroups

Post on social feed, react, comment

Earn badges, streaks → Claim rewards

Manage profile and appointments

Stay informed via notifications

*Community Interaction: Browse groups -> View details -> Join group -> View members/subgroups.*

5. Database Architecture Overview
auth.users – Supabase-managed authentication

user_profiles – Demographics, accessibility, and preferences

services – Provider offerings with filtering options

service_bookings – Scheduled bookings with pricing

claims – Wallet reimbursement system

wallets – Balance by NDIS category

service_agreements – E-sign, PDF copy, expiry

posts, post_media, post_likes, post_reactions – Social system

comments – Commenting on posts

friendships – Add, accept, block users

groups, group_members, subgroups – Community module

rewards – Loyalty, achievements, claimable perks

notifications – Personalized alerts

housing_listings – Accessible rental listings

housing_applications – Tenancy expression of interest

6. Auth, Access, and Security
All tables use UUID and link to auth.users

user_profiles.id = auth.users.id for 1:1 sync

RLS enabled on bookings, posts, reviews, wallet, etc.

Admin-only access to sensitive verification features

Signed URLs for private files (e.g., NDIS documents)

ENUMs and input sanitisation in use for dropdown control

7. Media Upload & Protection
Supabase Buckets: /avatars, /posts, /housing, /documents

Edge Functions verify files (size/type)

Virus scanning (e.g., VirusTotal, ClamAV) pre-storage

Signed URLs for restricted access

Media uploads tied to user ownership

8. Optional Features & Future Enhancements
AI-powered suggestions for services/housing

Smart search with keyword + category blending

Co-living match scoring (profile-to-profile)

Google/Outlook calendar sync for bookings

Push notification support

Chat/messaging module with encrypted content

Public group previews + moderation flags
