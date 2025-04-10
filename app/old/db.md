Rollodex DB Schema (Root)
sql
Copy
Edit
├── 🧑 User & Auth
│   └── user_profiles

├── 🧰 Services & Providers
│   ├── service_providers
│   ├── services
│   └── service_availability

├── 📆 Bookings & Agreements
│   ├── service_bookings
│   ├── claims
│   └── service_agreements

├── 💰 Wallet
│   └── wallets

├── 🏠 Housing
│   ├── housing_listings
│   └── housing_applications

├── 📸 Social System
│   ├── posts
│   ├── post_likes
│   ├── post_reactions
│   └── comments

├── 👥 Groups & Subgroups
│   ├── groups
│   ├── group_members
│   └── subgroups

├── 🔔 Notifications
│   └── notifications

├── 🏅 Rewards & Badges
│   └── rewards

└── ✅ Friendships
    └── friendships



Rollodex – Detailed Database Design Documentation
1. Design Principles
All tables use UUIDs for primary keys

Foreign keys enforce relationships with ON DELETE CASCADE

ENUMs used for fields like support_level, status, etc.

Indexed fields: user_id, group_id, post_id, created_at

JSONB used for user preferences and metadata

All files/media stored via Supabase Storage + signed URLs

RLS (Row-Level Security) enforced on all user-specific tables

2. Core Tables
🧑 User & Identity
auth.users (managed by Supabase)

user_profiles – name, avatar, DOB, support level, preferences

🧰 Services & Providers
service_providers – ABN, credentials, verified

services – listings tied to provider

service_availability – time slots

service_bookings – links users to service

service_agreements – e-signed PDFs

💰 Wallet & Claims
wallets – total balance + category breakdown

claims – claim against booking, expiry & status

🏠 Housing
housing_listings – SDA, features, virtual tours

housing_applications – submitted by user

🧑‍🤝‍🧑 Social / Community
posts, post_media, post_likes, post_reactions, comments

friendships – manage connections

👥 Groups
groups, group_members, subgroups (e.g. “Japan Trip”)

🏆 Rewards & Notifications
rewards – badges, referrals, streaks

notifications – alerts with type and seen flag

3. Key Relationships (Foreign Keys)
user_profiles.id → auth.users.id

service_providers.id → auth.users.id

services.provider_id → service_providers.id

service_bookings.user_id & service_id

claims.booking_id → service_bookings.id

posts.user_id, post_likes.user_id, etc.

housing_applications.user_id & listing_id

*groups.owner_id → user_profiles.id (links to auth.users.id)*
group_members.user_id, group_id
*group_members.group_id → groups.id*
*group_members.user_id → user_profiles.id (links to auth.users.id)*
*subgroups.group_id → groups.id*
*subgroups.created_by → user_profiles.id (links to auth.users.id)*

notifications.user_id, rewards.user_id

All FK constraints include ON DELETE CASCADE for integrity.

*Note on Supabase Joins:* Queries joining related tables (e.g., groups with user_profiles for owner, group_members with user_profiles for members) may return the related data as a nested array (`[{...}]`) even for single relationships. Frontend code must handle this structure (e.g., using `related_data?.[0]?.property`).

*Note on Member Count:* Group member counts are typically derived dynamically, either via a `COUNT(*)` aggregation in a Supabase query joining `groups` and `group_members`, or potentially using a dedicated database view or function.

4. ENUMs & Controlled Values
support_level: light, moderate, high, flexible

service format: online, in-person, hybrid

booking status: pending, confirmed, completed, cancelled

claim status: pending, approved, expired, rejected

friendship status: pending, accepted, blocked

5. Media Upload Strategy
Buckets: /avatars, /posts, /services, /housing, /documents

Virus scanning via Supabase Edge Function (e.g., VirusTotal)

Signed URLs for access control

Uploads tied to user ownership

CDN for public posts

6. Security with RLS
Enabled on all user-owned tables

Example policy:

sql
Copy
Edit
CREATE POLICY "User can access own bookings"
ON service_bookings
FOR SELECT USING (auth.uid() = user_id);
Admin bypass handled with is_admin field

7. Future-Proof Extensions
audit_logs table for admin actions

search_index for global fuzzy search

Messaging: threads, messages

Provider API keys (tokenized access)

Referral analytics

*Database Views/Functions: Consider views for optimized reads like group lists with member counts.*

Rollodex – Database Schemas by Section
🧑 1. USER & AUTH
Table: user_profiles
Field	Type	Description
id	uuid (PK)	Linked to auth.users.id
full_name	text	User's full name
avatar_url	text	URL to profile image
date_of_birth	date	Optional
gender	text	Optional field
primary_disability	text	Textual or dropdown
support_level	text	ENUM: light, moderate, high, flexible
mobility_aids	text[]	List of aids (wheelchair, cane, etc)
dietary_requirements	text[]	Optional
preferences	jsonb	For AI matching and filters
accessibility_preferences	jsonb	High-contrast, voice-mode, etc
created_at	timestamp	Defaults to now()

👥 7. GROUPS & SUBGROUPS
Table: groups
Field	Type	Description
id	uuid (PK)	Unique group ID
name	text	Group name
type	text	ENUM: interest, housing
description	text	Group purpose
owner_id	uuid	FK -> user_profiles.id (Group creator/admin)
created_at	timestamp	

Table: group_members
Field	Type	Description
id	uuid (PK)	Unique membership ID
group_id	uuid	FK -> groups.id
user_id	uuid	FK -> user_profiles.id
role	text	ENUM: admin, member
joined_at	timestamp	

Table: subgroups
Field	Type	Description
id	uuid (PK)	Unique subgroup ID
group_id	uuid	FK -> groups.id (Parent group)
name	text	Subgroup name
description	text	Subgroup purpose
created_by	uuid	FK -> user_profiles.id (Subgroup creator)
created_at	timestamp	

🔔 8. NOTIFICATIONS
Table: notifications
Field	Type	Description
id	uuid	PK
user_id	uuid	FK -> auth.users.id
type	text	Alert type (e.g., "booking_update", "referral")
content	text	Alert content
seen	boolean	Seen flag
created_at	timestamp	

🏅 9. REWARDS & BADGES
rewards
id: uuid

user_id: uuid

type: text (ENUM: "referral", "badge", "streak")

label: text

status: text (ENUM: "earned", "claimed")

metadata: jsonb

created_at: timestamp

✅ 10. FRIENDSHIPS
friendships
id: uuid

requester_id: uuid

recipient_id: uuid

status: text (ENUM: "pending", "accepted", "blocked")

created_at: timestamp

Rollodex – Full Database Schema Documentation
📌 Contents
User & Auth

Services & Providers

Bookings, Claims & Agreements

Wallet

Housing

Social System

Groups & Subgroups

Notifications

Rewards & Badges

Friendships

1. USER & AUTH – user_profiles
id: uuid (PK) – Linked to auth.users.id

full_name: text

avatar_url: text

date_of_birth: date

gender: text

primary_disability: text

support_level: text (ENUM: light, moderate, high, flexible)

mobility_aids: text[]

dietary_requirements: text[]

preferences: jsonb

accessibility_preferences: jsonb

created_at: timestamp

2. SERVICES & PROVIDERS
service_providers
id: uuid (PK) – FK to auth.users.id

business_name: text

abn: text

credentials: text[]

verified: boolean

created_at: timestamp

services
id: uuid

provider_id: uuid (FK → service_providers)

title: text

description: text

category: text

format: text (ENUM: online, in-person, hybrid)

gender_preference: text

vehicle_type: text

support_focus: text

media_urls: text[]

price: numeric

available: boolean

created_at: timestamp

service_availability
id: uuid

service_id: uuid

weekday: text

time_slots: text[]

3. BOOKINGS, CLAIMS, AGREEMENTS
service_bookings
id: uuid

user_id: uuid

service_id: uuid

scheduled_at: timestamp

total_price: numeric

ndis_covered_amount: numeric

gap_payment: numeric

status: text (ENUM)

created_at: timestamp

claims
id: uuid

booking_id: uuid

user_id: uuid

status: text (ENUM: pending, approved, expired, rejected)

amount: numeric

expiry_date: date

created_at: timestamp

service_agreements
id: uuid

booking_id: uuid

participant_id: uuid

provider_id: uuid

agreement_text: text

signature_url: text

signed_at: timestamp

valid_until: date

4. WALLET
wallets
id: uuid

user_id: uuid

total_balance: numeric

category_breakdown: jsonb

updated_at: timestamp

5. HOUSING
housing_listings
id: uuid

provider_id: uuid

title: text

description: text

rent: numeric

sda_type: text

media_urls: text[]

location: geography

features: text[]

virtual_tour_url: text

available_from: date

housing_applications
id: uuid

user_id: uuid

listing_id: uuid

preferences: jsonb

status: text

6. SOCIAL SYSTEM
posts
id: uuid

user_id: uuid

caption: text

media_urls: text[]

tags: text[]

created_at: timestamp

post_likes
id: uuid

post_id: uuid

user_id: uuid

created_at: timestamp

post_reactions
id: uuid

post_id: uuid

user_id: uuid

reaction_type: text

created_at: timestamp

comments
id: uuid

post_id: uuid

user_id: uuid

content: text

created_at: timestamp

7. GROUPS & SUBGROUPS
groups
id: uuid

name: text

owner_id: uuid

type: text (ENUM: interest, housing)

description: text

created_at: timestamp

group_members
id: uuid

group_id: uuid

user_id: uuid

role: text (ENUM: admin, member)

joined_at: timestamp

subgroups
id: uuid

group_id: uuid

created_by: uuid

name: text

description: text

created_at: timestamp

8. NOTIFICATIONS
notifications
id: uuid

user_id: uuid

type: text

content: text

seen: boolean

created_at: timestamp

9. REWARDS & BADGES
rewards
id: uuid

user_id: uuid

type: text (badge, referral, streak)

label: text

status: text (earned, claimed)

metadata: jsonb

created_at: timestamp

10. FRIENDSHIPS
friendships
id: uuid

requester_id: uuid

recipient_id: uuid

status: text (ENUM: pending, accepted, blocked)

created_at: timestamp