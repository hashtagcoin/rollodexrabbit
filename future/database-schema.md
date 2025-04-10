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
