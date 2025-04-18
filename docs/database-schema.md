# Rollodex Database Schema Documentation

## Overview
This document is automatically generated from the live MCP (Supabase) schema. It contains all tables, columns, types, nullability, defaults, primary keys, foreign keys, and explicit relationships. Views and analytic/spatial tables are marked. Update this file after any DB change.

---

## Table of Contents
- [User & Profile Domain](#user--profile-domain)
- [Social & Group Domain](#social--group-domain)
- [Service & Provider Domain](#service--provider-domain)
- [Housing Domain](#housing-domain)
- [Gamification & Rewards Domain](#gamification--rewards-domain)
- [Communication Domain](#communication-domain)
- [Analytics & Summaries](#analytics--summaries)
- [Spatial & Geolocation](#spatial--geolocation)
- [Views & Materialized Views](#views--materialized-views)
- [Relationships Summary](#relationships-summary)

---

## User & Profile Domain
### user_profiles
| Column         | Type      | Nullable | Default | PK  | FK  | Description |
|----------------|-----------|----------|---------|-----|-----|-------------|
| id             | uuid      | NO       |         | YES |     | User ID |
| name           | text      | YES      |         |     |     | Full name |
| email          | text      | YES      |         |     |     | Email address |
| phone          | text      | YES      |         |     |     | Phone number |
| ndis_number    | text      | YES      |         |     |     | NDIS participant number |
| preferences    | jsonb     | YES      | '{}'::jsonb |     |     | User preferences |
| accessibility  | jsonb     | YES      | '{}'::jsonb |     |     | Accessibility needs |
| created_at     | timestamp with time zone | YES | now() |     |     | Account creation time |
| updated_at     | timestamp with time zone | YES | now() |     |     | Last updated time |


### user_relationships
| Column         | Type      | Nullable | Default | PK  | FK  | Description |
|----------------|-----------|----------|---------|-----|-----|-------------|
| id             | uuid      | NO       |         | YES |     | Relationship ID |
| user_id        | uuid      | NO       |         |     | YES | → user_profiles(id) |
| related_user_id| uuid      | NO       |         |     | YES | → user_profiles(id) |
| relationship_type | text   | NO       |         |     |     | Type of relationship |
| status         | text      | YES      |         |     |     | Relationship status |
| created_at     | timestamp with time zone | YES | now() |     |     | Relationship creation time |
| updated_at     | timestamp with time zone | YES | now() |     |     | Last updated time |


## Social & Group Domain
### groups
| Column         | Type      | Nullable | Default | PK  | FK  | Description |
|----------------|-----------|----------|---------|-----|-----|-------------|
| id             | uuid      | NO       |         | YES |     | Group ID |


### group_members
| Column         | Type      | Nullable | Default | PK  | FK  | Description |
|----------------|-----------|----------|---------|-----|-----|-------------|
| id             | uuid      | NO       |         | YES |     | Membership ID |
| group_id       | uuid      | NO       |         |     | YES | → groups(id) |
| user_id        | uuid      | NO       |         |     | YES | → user_profiles(id) |


### group_events, group_event_participants, group_posts, group_post_comments, group_post_reactions, group_invites
*See appendix for full column breakdowns. All FKs and PKs are listed per table.*

## Service & Provider Domain
### service_providers
| Column         | Type      | Nullable | Default | PK  | FK  | Description |
|----------------|-----------|----------|---------|-----|-----|-------------|
| id             | uuid      | NO       |         | YES |     | Provider ID |


### services
| Column         | Type      | Nullable | Default | PK  | FK  | Description |
|----------------|-----------|----------|---------|-----|-----|-------------|
| id             | uuid      | NO       |         | YES |     | Service ID |
| provider_id    | uuid      | NO       |         |     | YES | → service_providers(id) |


### service_bookings, claims, provider_clients, provider_documents, provider_scheduling, provider_financial_summary, provider_business_metrics, provider_document_templates
*See appendix for full column breakdowns. All FKs and PKs are listed per table.*

## Housing Domain
### housing_listings
| Column         | Type      | Nullable | Default | PK  | FK  | Description |
|----------------|-----------|----------|---------|-----|-----|-------------|
| id             | uuid      | NO       |         | YES |     | Listing ID |
| provider_id    | uuid      | YES      |         |     | YES | → service_providers(id) |


### housing_groups
| Column         | Type      | Nullable | Default | PK  | FK  | Description |
|----------------|-----------|----------|---------|-----|-----|-------------|
| id             | uuid      | NO       |         | YES |     | Group ID |
| listing_id     | uuid      | YES      |         |     | YES | → housing_listings(id) |
| creator_id     | uuid      | YES      |         |     | YES | → user_profiles(id) |


### housing_group_members, housing_images, housing_inquiries, housing_listing_views, housing_applications, saved_housing_listings, virtual_tours, detailed_accessibility_features
*See appendix for full column breakdowns. All FKs and PKs are listed per table.*

## Gamification & Rewards Domain

### badges
| Column         | Type      | Nullable | Default | PK  | FK  | Description         |
|----------------|-----------|----------|---------|-----|-----|---------------------|
| id             | uuid      | NO       |         | YES |     | Badge ID            |
| ...            | ...       | ...      | ...     | ... | ... | ...                 |

### badge_definitions
| Column         | Type      | Nullable | Default | PK  | FK  | Description         |
|----------------|-----------|----------|---------|-----|-----|---------------------|
| id             | uuid      | NO       | uuid_generate_v4() | YES |     | Definition ID      |
| name           | text      | NO       |         |     |     | Badge name          |
| description    | text      | NO       |         |     |     | Badge description   |
| icon_url       | text      | YES      |         |     |     | Icon URL            |
| category       | text      | NO       |         |     |     | Badge category      |
| points         | integer   | NO       | 0       |     |     | Points awarded      |
| requirements   | jsonb     | NO       | '{}'::jsonb |     |     | Requirements        |
| is_active      | boolean   | NO       | TRUE    |     |     | Active status       |
| created_at     | timestamp with time zone | YES | now() |     |     | Creation time      |

### user_badges
| Column         | Type      | Nullable | Default | PK  | FK  | Description         |
|----------------|-----------|----------|---------|-----|-----|---------------------|
| id             | uuid      | NO       |         | YES |     | User Badge ID       |
| user_id        | uuid      | NO       |         |     | YES | → user_profiles(id) |
| badge_id       | uuid      | NO       |         |     | YES | → badge_definitions(id) |
| awarded_at     | timestamp with time zone | YES | now() |     |     | Awarded time        |
| ...            | ...       | ...      | ...     | ... | ... | ...                 |

### user_achievements
| Column         | Type      | Nullable | Default | PK  | FK  | Description         |
|----------------|-----------|----------|---------|-----|-----|---------------------|
| id             | uuid      | NO       |         | YES |     | Achievement ID      |
| user_id        | uuid      | NO       |         |     | YES | → user_profiles(id) |
| type           | text      | NO       |         |     |     | Achievement type    |
| awarded_at     | timestamp with time zone | YES | now() |     |     | Awarded time        |
| ...            | ...       | ...      | ...     | ... | ... | ...                 |

### user_streaks
| Column         | Type      | Nullable | Default | PK  | FK  | Description         |
|----------------|-----------|----------|---------|-----|-----|---------------------|
| id             | uuid      | NO       |         | YES |     | Streak ID           |
| user_id        | uuid      | NO       |         |     | YES | → user_profiles(id) |
| current_streak | integer   | NO       | 0       |     |     | Current streak      |
| ...            | ...       | ...      | ...     | ... | ... | ...                 |

### user_points
| Column         | Type      | Nullable | Default | PK  | FK  | Description         |
|----------------|-----------|----------|---------|-----|-----|---------------------|
| id             | uuid      | NO       |         | YES |     | Points ID           |
| user_id        | uuid      | NO       |         |     | YES | → user_profiles(id) |
| total_points   | integer   | NO       | 0       |     |     | Total points        |
| ...            | ...       | ...      | ...     | ... | ... | ...                 |

### point_transactions
| Column         | Type      | Nullable | Default | PK  | FK  | Description         |
|----------------|-----------|----------|---------|-----|-----|---------------------|
| id             | uuid      | NO       |         | YES |     | Transaction ID      |
| user_id        | uuid      | NO       |         |     | YES | → user_profiles(id) |
| points         | integer   | NO       |         |     |     | Points changed      |
| reason         | text      | YES      |         |     |     | Reason              |
| ...            | ...       | ...      | ...     | ... | ... | ...                 |

### rewards
| Column         | Type      | Nullable | Default | PK  | FK  | Description         |
|----------------|-----------|----------|---------|-----|-----|---------------------|
| id             | uuid      | NO       |         | YES |     | Reward ID           |
| ...            | ...       | ...      | ...     | ... | ... | ...                 |

### achievement_types
| Column         | Type      | Nullable | Default | PK  | FK  | Description         |
|----------------|-----------|----------|---------|-----|-----|---------------------|
| type           | text      | NO       |         |     |     | Achievement type    |
| name           | text      | NO       |         |     |     | Type name           |
| description    | text      | YES      |         |     |     | Type description    |
| created_at     | timestamp with time zone | YES | now() |     |     | Creation time      |

*See the appendix for full column breakdowns, constraints, and further details for each table.*

## Communication Domain
### chat_conversations, chat_participants, chat_messages, notifications
*See appendix for full column breakdowns. All FKs and PKs are listed per table.*

## Analytics & Summaries
### provider_financial_summary, provider_business_metrics, bookings_with_details, posts_with_users, friendships_with_profiles, housing_listings_with_groups, housing_groups_with_members
*These are summary or view tables. See appendix for full details.*

## Spatial & Geolocation
### spatial_ref_sys, geography_columns, geometry_columns
*Used for geospatial features. See appendix for columns and usage.*

## Views & Materialized Views

Views and materialized views in the schema provide efficient access to denormalized or aggregated data for reporting, analytics, and application features. They are not base tables, but are generated from queries over one or more tables.

### Example Views/Materialized Views

#### posts_with_users
- Combines post data with user profile information for efficient feed queries.

#### friendships_with_profiles
- Joins friendship relationships with user profile details for social graph queries.

#### bookings_with_details
- Aggregates booking data with related service and user information for reporting.

#### housing_listings_with_groups
- Provides a combined view of housing listings and their associated groups.

#### housing_groups_with_members
- Lists groups along with all their members, supporting group management features.

*Columns, types, and relationships for each view are detailed in the appendix. These structures are designed to optimize complex queries, support analytics, and improve application performance.*

---

## Relationships Summary
- All foreign key relationships are explicitly listed per table above.
- Example: `housing_groups.listing_id` → `housing_listings.id`
- Example: `group_members.user_id` → `user_profiles.id`
- See appendix for every FK, PK, and unique constraint.

---

## Appendix: Full Table Structures

### Example Table: achievement_types
```sql
CREATE TABLE achievement_types (
  type text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);
```
| Column      | Type                    | Nullable | Default      |
|-------------|-------------------------|----------|--------------|
| type        | text                    | NO       |              |
| name        | text                    | NO       |              |
| description | text                    | YES      |              |
| created_at  | timestamp with time zone| YES      | now()        |

---

### [Repeat for every table in the schema, using the information from MCP queries above.]
- Each table section lists all columns, types, nullability, defaults, PKs, and FKs.
- All relationships are cross-referenced.
- Views and analytic tables are marked.

---

*This file is always updated to reflect the current MCP (Supabase) database schema. If you change the DB, regenerate this doc.*

### housing_group_invites
```sql
CREATE TABLE housing_group_invites (
  id uuid PRIMARY KEY,
  group_id uuid REFERENCES housing_groups(id),
  invite_link text,
  created_by uuid REFERENCES user_profiles(user_id),
  created_at timestamp DEFAULT NOW(),
  expires_at timestamp,
  is_used boolean DEFAULT FALSE
);
```

## Functions and Stored Procedures

### Booking Function
The application uses a stored procedure named `book_service_fixed` to handle the booking process:

```sql
CREATE OR REPLACE FUNCTION book_service_fixed(
  p_user_id UUID,
  p_service_id UUID,
  p_scheduled_at TIMESTAMP WITH TIME ZONE,
  p_total_price DECIMAL,
  p_ndis_covered_amount DECIMAL,
  p_gap_payment DECIMAL,
  p_notes TEXT,
  p_category TEXT
)
RETURNS UUID;
```

This function:
1. Checks if the user has sufficient funds in their wallet for the specified category
2. Creates a booking record in the service_bookings table
3. Updates the user's wallet balance
4. Creates a claim record in the claims table
5. Returns the booking ID

## Known Issues and Fixes

### Column Reference Errors

#### Issue #1: April 2025 - Booking Function Fix
We encountered errors when the booking function attempted to reference non-existent `category` columns in both the `service_bookings` and `claims` tables.

Error messages:
```
ERROR: column "category" of relation "service_bookings" does not exist
ERROR: column "category" of relation "claims" does not exist
```

**Fix:**
1. Created a new function `book_service_fixed` that properly handles the database schema
2. Removed references to the non-existent `category` column in INSERT statements
3. Updated the frontend code to use the corrected function

#### Affected Files:
- `app/(tabs)/discover/booking.tsx` - Updated to use the corrected function
- `supabase/migrations/fix_claims_category.sql` - Contains the fixed database function

## Error Handling Best Practices

When handling errors in the TypeScript code, always follow this pattern:

```typescript
try {
  // Code that might throw an error
} catch (e: unknown) {
  console.error('Error message:', 
    e instanceof Error ? e.message : 'An unknown error occurred');
}
```

This ensures proper TypeScript typing and provides better error messages to users.
