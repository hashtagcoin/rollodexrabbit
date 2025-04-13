-- Create events table for community events
ALTER TABLE groups ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS event_location TEXT;

-- Check what type is used for the type column and handle accordingly
DO $$ 
DECLARE
    column_type TEXT;
BEGIN
    -- Get the data type of the type column
    SELECT data_type INTO column_type 
    FROM information_schema.columns 
    WHERE table_name = 'groups' AND column_name = 'type';
    
    -- If the column is an enum type
    IF column_type = 'USER-DEFINED' THEN
        -- Get the actual enum type name
        SELECT t.typname INTO column_type
        FROM pg_type t
        JOIN pg_attribute a ON a.atttypid = t.oid
        JOIN pg_class c ON c.oid = a.attrelid
        WHERE c.relname = 'groups' AND a.attname = 'type';
        
        -- Try to add the value to the enum
        EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''event''', column_type);
    ELSE
        -- If it's just a text/varchar column, no need to modify any enum
        RAISE NOTICE 'The type column is not an enum (it is %), no enum modification needed', column_type;
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table groups does not exist yet';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error checking type column: %', SQLERRM;
END $$;

-- Insert sample event groups using user IDs from userids.csv
DO $$
DECLARE
    event1_id UUID := gen_random_uuid();
    event2_id UUID := gen_random_uuid();
    event3_id UUID := gen_random_uuid();
    event4_id UUID := gen_random_uuid();
BEGIN
    -- Store these UUIDs for reference
    RAISE NOTICE 'Created event UUIDs: 
        Event 1 (Community Cookout): %
        Event 2 (Movie Night): %
        Event 3 (Financial Workshop): %
        Event 4 (Beach Cleanup): %', 
        event1_id, event2_id, event3_id, event4_id;
        
    -- Insert the events with proper UUID format
    INSERT INTO groups (id, name, type, description, created_at, avatar_url, is_public, owner_id, event_date, event_location)
    VALUES 
        (event1_id, 'Community Cookout', 'event', 'Join us for a community cookout with games and fun activities!', NOW(), 'https://images.unsplash.com/photo-1470753937643-efeb931202a9?q=80&w=2080', true, 'e68f752a-2d85-4dfb-9743-cbf3fb6bf8e8', NOW() + INTERVAL '2 weeks', 'City Park'),
        (event2_id, 'Movie Night', 'event', 'Outdoor movie night featuring family-friendly films and popcorn.', NOW(), 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=2080', true, 'd5e1fa56-80b7-4e51-9012-3baac98f2b9e', NOW() + INTERVAL '1 week', 'Community Center'),
        (event3_id, 'Financial Workshop', 'event', 'Learn about budgeting, saving, and investing for your future.', NOW(), 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2080', true, '7a9ed413-a880-43d1-aeb0-33805d00a3c8', NOW() + INTERVAL '3 days', 'Online Zoom Meeting'),
        (event4_id, 'Beach Cleanup', 'event', 'Help us clean up our local beach and protect marine life.', NOW(), 'https://images.unsplash.com/photo-1591621916796-84c3b6c9a7ac?q=80&w=2080', true, '1da7cc7f-5902-4a98-9cfd-de21eded30ed', NOW() + INTERVAL '10 days', 'Sunshine Beach')
    ON CONFLICT (id) DO NOTHING;

    -- Add members to event groups if group_members table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_members') THEN
        -- Community Cookout members
        INSERT INTO group_members (id, group_id, user_id, status, is_admin, joined_at)
        VALUES
            (gen_random_uuid(), event1_id, 'e68f752a-2d85-4dfb-9743-cbf3fb6bf8e8', 'approved', true, NOW()),
            (gen_random_uuid(), event1_id, 'd5e1fa56-80b7-4e51-9012-3baac98f2b9e', 'approved', false, NOW()),
            (gen_random_uuid(), event1_id, 'fc178f8d-6b47-40be-beaf-462e1c7f31a3', 'approved', false, NOW())
        ON CONFLICT DO NOTHING;
            
        -- Movie Night members
        INSERT INTO group_members (id, group_id, user_id, status, is_admin, joined_at)
        VALUES
            (gen_random_uuid(), event2_id, 'd5e1fa56-80b7-4e51-9012-3baac98f2b9e', 'approved', true, NOW()),
            (gen_random_uuid(), event2_id, '9e4fffdc-6dbc-40b0-8601-abcfdd9c4af4', 'approved', false, NOW()),
            (gen_random_uuid(), event2_id, 'e8831354-32bf-4c79-b978-366244f2ce7a', 'approved', false, NOW())
        ON CONFLICT DO NOTHING;
            
        -- Financial Workshop members
        INSERT INTO group_members (id, group_id, user_id, status, is_admin, joined_at)
        VALUES
            (gen_random_uuid(), event3_id, '7a9ed413-a880-43d1-aeb0-33805d00a3c8', 'approved', true, NOW()),
            (gen_random_uuid(), event3_id, 'dc1a222e-449b-4d46-85d4-f85d84ad5a63', 'approved', false, NOW())
        ON CONFLICT DO NOTHING;
            
        -- Beach Cleanup members
        INSERT INTO group_members (id, group_id, user_id, status, is_admin, joined_at)
        VALUES
            (gen_random_uuid(), event4_id, '1da7cc7f-5902-4a98-9cfd-de21eded30ed', 'approved', true, NOW()),
            (gen_random_uuid(), event4_id, '50f9fb24-3371-41c8-ad45-40bde022824d', 'approved', false, NOW()),
            (gen_random_uuid(), event4_id, 'fc178f8d-6b47-40be-beaf-462e1c7f31a3', 'approved', false, NOW())
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Successfully added members to event groups';
    ELSE
        RAISE NOTICE 'group_members table does not exist, skipping member insertions';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;
