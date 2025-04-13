# Rollodex Database Schema Documentation

## Table Structures and Relationships

### Key Tables

#### service_bookings
```sql
CREATE TABLE service_bookings (
  id uuid NOT NULL,
  user_id uuid NULL,
  service_id uuid NULL,
  scheduled_at timestamp with time zone NOT NULL,
  total_price numeric NOT NULL,
  ndis_covered_amount numeric NOT NULL,
  gap_payment numeric NOT NULL,
  notes text NULL,
  status text NOT NULL,
  created_at timestamp with time zone NULL
);
```

**Note:** This table does NOT have a `category` column. The category information is associated with the service itself and stored in the claims table.

#### claims
```sql
INSERT INTO claims (
  booking_id,
  user_id,
  status,
  amount,
  expiry_date
)
```

**Note:** This table does NOT have a `category` column either. Category information is used in wallet balances but not stored directly in the claims table.

#### housing_groups
```sql
CREATE TABLE housing_groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  listing_id uuid REFERENCES housing_listings(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES auth.users(id),
  max_members int NOT NULL CHECK (max_members > 0),
  current_members int DEFAULT 0,
  move_in_date date,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### housing_group_members
```sql
CREATE TABLE housing_group_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid REFERENCES housing_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  join_date timestamp with time zone DEFAULT now(),
  bio text,
  support_level text CHECK (support_level IN ('none', 'light', 'moderate', 'high')),
  is_admin boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(group_id, user_id)
);
```

#### housing_groups_with_members (View)
```sql
CREATE OR REPLACE VIEW housing_groups_with_members AS
SELECT 
  g.id,
  g.name,
  g.listing_id,
  g.creator_id,
  g.max_members,
  g.current_members,
  g.move_in_date,
  g.description,
  g.is_active,
  g.created_at,
  g.updated_at,
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'id', m.id, 
        'user_id', m.user_id, 
        'status', m.status, 
        'join_date', m.join_date, 
        'bio', m.bio, 
        'support_level', m.support_level, 
        'is_admin', m.is_admin, 
        'full_name', u.full_name, 
        'avatar_url', u.avatar_url, 
        'age_range', '25-34'
      )
    )
    FROM housing_group_members m
    LEFT JOIN user_profiles u ON m.user_id = u.id
    WHERE m.group_id = g.id AND m.status = 'approved'
    ), '[]'::json) AS members
FROM housing_groups g;
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
