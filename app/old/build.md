
# Rollodex – Full Step-by-Step Implementation Plan (For Bolt.new Build)

This plan is designed to help you build the Rollodex app screen-by-screen, table-by-table, using Bolt.new and Supabase. It guides you through:

- Screen creation with prompts for screenshots
- Schema definition and migration
- Dummy data generation where needed

---

## 📍 Stage 0: Set Up Environment

**Tasks:**
- Set up Supabase backend project
- Connect Bolt.new to Supabase
- Enable RLS and use UUIDs as PKs
- Create `auth.users` via Supabase Auth

---

## 📍 Stage 1: Onboarding & Login Flow

### 🔹 Screens:
1. Welcome Screen  
2. Login/Signup Options (Email, Mobile, NDIS, Google/Facebook)  
3. NDIS Sync screen

**Tasks:**
- Paste screenshot of login flow
- Build screen logic in Bolt.new
- Create Supabase `user_profiles` schema
- Implement dummy users (10 users)
- Ensure user gets redirected to dashboard on login

---

## 📍 Stage 2: Initial Setup & Preferences

### 🔹 Screens:
4. Profile Setup (Avatar, DOB, Disability, Support Level)  
5. Location Radius + Home Address  
6. Comfort Trait Selection (image tap UI)  
7. Service Category Preferences (Therapy, Transport, etc.)

**Tasks:**
- Paste screenshot for UI  
- Extend `user_profiles` table with preferences  
- Build dropdowns + image-grid inputs  
- Migrate schema  
- Populate with dummy user profiles (10 entries)

---

## 📍 Stage 3: Dashboard

### 🔹 Screens:
8. Dashboard – Welcome, Wallet Summary, Service Matches

**Tasks:**
- Paste screenshot of dashboard  
- Create dummy `wallets` table and schema  
- Generate wallet balances per NDIS category for users  
- Populate dummy `services` and show suggested matches  
- Connect wallet to booking logic later

---

## 📍 Stage 4: Service Discovery (Grid / List / Swipe)

### 🔹 Screens:
9. Browse Providers  
10. Swipe View (Tinder-style)  
11. Provider Profile Page

**Tasks:**
- Paste screenshots for each layout  
- Create `services` and `service_providers` schemas  
- Add `service_availability` table  
- Migrate schemas  
- Populate with 10+ dummy service providers + services  
- Link to dashboard and detail view

---

## 📍 Stage 5: Service Booking Flow

### 🔹 Screens:
12. Booking Form  
13. Booking Summary & NDIS Compliance Checkbox  
14. Confirmation Screen

**Tasks:**
- Paste design of booking screens  
- Build `service_bookings` schema  
- Auto-link booking to user, service, and date  
- Implement booking eligibility logic  
- Add dummy data: pre-booked appointments (5+)

---

## 📍 Stage 6: Wallet View

### 🔹 Screens:
15. Full Wallet Breakdown  
16. Claim Submission Page  
17. Wallet Settings / History

**Tasks:**
- Paste screenshots of wallet  
- Create `claims` table  
- Add dummy entries to simulate past claims (10+)  
- Show wallet % remaining by category

---

## 📍 Stage 7: Social & Feed

### 🔹 Screens:
18. Main Feed  
19. Post Details  
20. Post Creation

**Tasks:**
- Paste social feed UI  
- Create `posts`, `post_media`, `post_likes`, `post_reactions`, `comments` tables  
- Add 10+ dummy posts for community feel  
- Simulate friends interacting

---

## 📍 Stage 8: Groups & Subgroups

### 🔹 Screens:
21. Group Explorer  
22. Group Detail  
23. Subgroup: Trip/Event Planning

**Tasks:**
- Paste group and subgroup UIs  
- Create `groups`, `group_members`, `subgroups` tables  
- Populate 5 interest groups + 2 housing groups  
- Add dummy members and join requests

---

## 📍 Stage 9: Housing Explorer

### 🔹 Screens:
24. Housing Grid / List / Swipe  
25. Housing Detail (Airbnb-style)  
26. Housing Application Page

**Tasks:**
- Paste housing screen UIs  
- Create `housing_listings`, `housing_applications` tables  
- Add 10+ dummy housing entries  
- Simulate applications from dummy users

---

## 📍 Stage 10: Profile Section

### 🔹 Tabs:
27. Profile Home (Avatar, Info, Edit Profile)  
28. Posts Tab  
29. Groups Tab  
30. Appointments Tab  
31. Friends Tab

**Tasks:**
- Paste profile section screenshots  
- Use data from other modules: posts, groups, service_bookings  
- Enable "Edit" and "Connect with Friends"

---

## 📍 Stage 11: Agreements, Consent & Legal

### 🔹 Screens:
32. Service Agreement Viewer  
33. Consent Management Hub  
34. Booking Compliance Screen (Pre-check)

**Tasks:**
- Paste legal/consent screen UIs  
- Create `service_agreements` table  
- Add dummy PDF link to simulate file storage  
- Enable download and e-sign logic

---

## 📍 Stage 12: Rewards & Gamification

### 🔹 Screens:
35. Rewards Dashboard  
36. Badges Earned  
37. Claim Reward Modal

**Tasks:**
- Paste rewards screen designs  
- Create `rewards` table  
- Populate 5 types: Streaks, Referrals, Profile Completions  
- Allow dummy claim button

---

## 📍 Stage 13: Notifications

### 🔹 Screens:
38. Notifications Feed  
39. Settings / Mark as Read

**Tasks:**
- Paste notification panel UI  
- Create `notifications` table  
- Add sample alert types: Booking Approved, New Like, Claim Update

---

## 📍 Stage 14: Admin / Provider View (Optional for V1)

### 🔹 Screens:
40. Provider Dashboard  
41. Add New Service  
42. View Bookings

**Tasks:**
- Paste provider admin panel UI  
- Use existing tables with provider_id filters  
- Build basic CRUD for testing

---

## ✳️ Final Tasks

**Tasks:**
- Enable Supabase Row Level Security  
- Set foreign key relationships  
- Review & test auth rules per table  
- QA pass on navigation flow  
- Launch private alpha

---

Let me know if you want this in a downloadable `.md`, `.docx`, or Notion format.
I can also generate seed files and Supabase migrations per screen if you'd like.  
