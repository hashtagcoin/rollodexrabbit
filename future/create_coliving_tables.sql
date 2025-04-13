-- SQL Script to create and configure co-living group tables
-- Created: April 13, 2025

-- Check if housing_groups table exists and create if it doesn't
CREATE TABLE IF NOT EXISTS housing_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  listing_id UUID REFERENCES housing_listings(id),
  max_members INTEGER NOT NULL DEFAULT 4,
  creator_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  move_in_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Add foreign key constraint if not already exists (wrapped in PL/pgSQL to avoid errors)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'housing_groups_creator_id_fkey'
  ) THEN
    ALTER TABLE housing_groups 
    ADD CONSTRAINT housing_groups_creator_id_fkey 
    FOREIGN KEY (creator_id) REFERENCES auth.users(id);
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Foreign key constraint already exists or cannot be added: %', SQLERRM;
END $$;

-- Check if housing_group_members table exists and create if it doesn't
CREATE TABLE IF NOT EXISTS housing_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES housing_groups(id) ON DELETE CASCADE,
  user_id UUID,
  join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  bio TEXT,
  support_level VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (support_level IN ('none', 'light', 'moderate', 'high')),
  gender_preference VARCHAR(20) DEFAULT 'Any',
  move_in_timeline VARCHAR(50),
  is_admin BOOLEAN DEFAULT FALSE
);

-- Add foreign key constraint if not already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'housing_group_members_user_id_fkey'
  ) THEN
    ALTER TABLE housing_group_members 
    ADD CONSTRAINT housing_group_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Foreign key constraint already exists or cannot be added: %', SQLERRM;
END $$;

-- Check if housing_group_invites table exists and create if it doesn't
CREATE TABLE IF NOT EXISTS housing_group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES housing_groups(id) ON DELETE CASCADE,
  invite_link TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  is_used BOOLEAN DEFAULT FALSE
);

-- Add foreign key constraint if not already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'housing_group_invites_created_by_fkey'
  ) THEN
    ALTER TABLE housing_group_invites 
    ADD CONSTRAINT housing_group_invites_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Foreign key constraint already exists or cannot be added: %', SQLERRM;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_housing_groups_listing_id ON housing_groups(listing_id);
CREATE INDEX IF NOT EXISTS idx_housing_group_members_group_id ON housing_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_housing_group_members_user_id ON housing_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_housing_group_invites_group_id ON housing_group_invites(group_id);

-- Create a view for easier querying of housing groups with member counts
CREATE OR REPLACE VIEW housing_groups_with_members AS
SELECT 
  g.id,
  g.name,
  g.description,
  g.listing_id,
  g.max_members,
  g.creator_id,
  g.created_at,
  g.move_in_date,
  g.is_active,
  COUNT(CASE WHEN m.status = 'approved' THEN 1 ELSE NULL END) AS current_members,
  l.title AS listing_title,
  l.weekly_rent AS listing_rent,
  l.suburb AS listing_suburb
FROM 
  housing_groups g
LEFT JOIN 
  housing_group_members m ON g.id = m.group_id
LEFT JOIN
  housing_listings l ON g.listing_id = l.id
GROUP BY
  g.id, l.id;

-- Create or replace function to create a co-living group
CREATE OR REPLACE FUNCTION create_co_living_group(
  p_name VARCHAR(255),
  p_description TEXT,
  p_listing_id UUID,
  p_max_members INTEGER,
  p_creator_id UUID,
  p_move_in_date TIMESTAMP WITH TIME ZONE,
  p_bio TEXT,
  p_support_level VARCHAR(20),
  p_gender_preference VARCHAR(20),
  p_move_in_timeline VARCHAR(50),
  p_invite_link TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_group_id UUID;
BEGIN
  -- Insert the group
  INSERT INTO housing_groups (
    name, 
    description, 
    listing_id, 
    max_members, 
    creator_id, 
    move_in_date,
    is_active
  ) VALUES (
    p_name,
    p_description,
    p_listing_id,
    p_max_members,
    p_creator_id,
    p_move_in_date,
    TRUE
  ) RETURNING id INTO v_group_id;
  
  -- Add the creator as the first member and admin
  INSERT INTO housing_group_members (
    group_id,
    user_id,
    status,
    bio,
    support_level,
    gender_preference,
    move_in_timeline,
    is_admin
  ) VALUES (
    v_group_id,
    p_creator_id,
    'approved',
    p_bio,
    p_support_level,
    p_gender_preference,
    p_move_in_timeline,
    TRUE
  );
  
  -- If an invite link is provided, create an invite
  IF p_invite_link IS NOT NULL THEN
    INSERT INTO housing_group_invites (
      group_id,
      invite_link,
      created_by
    ) VALUES (
      v_group_id,
      p_invite_link,
      p_creator_id
    );
  END IF;
  
  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data (if we're in development)
DO $$
DECLARE
  v_count INTEGER;
  v_listing_id UUID;
  v_user_id UUID;
BEGIN
  -- Check if we have any groups already
  SELECT COUNT(*) INTO v_count FROM housing_groups;
  
  -- Only add sample data if we have no groups and if we have listings
  IF v_count = 0 THEN
    -- Get a random listing ID
    SELECT id INTO v_listing_id FROM housing_listings LIMIT 1;
    
    -- Get a user ID
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    -- If we have data to work with, create a sample group
    IF v_listing_id IS NOT NULL AND v_user_id IS NOT NULL THEN
      -- Create a sample co-living group
      PERFORM create_co_living_group(
        'Sample Co-Living Group',
        'This is a sample co-living group for the Rollodex app',
        v_listing_id,
        4,
        v_user_id,
        NOW() + INTERVAL '30 days',
        'I like quiet spaces and am very tidy',
        'moderate',
        'Any',
        'In 1-3 months',
        NULL
      );
    END IF;
  END IF;
END $$;
