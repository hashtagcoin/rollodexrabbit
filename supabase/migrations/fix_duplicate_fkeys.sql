-- Fix duplicate foreign keys
ALTER TABLE IF EXISTS groups DROP CONSTRAINT IF EXISTS groups_owner_id_fkey2;
ALTER TABLE IF EXISTS subgroups DROP CONSTRAINT IF EXISTS subgroups_created_by_fkey2;
ALTER TABLE IF EXISTS group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey2;

-- Standardize constraint naming convention
COMMENT ON CONSTRAINT groups_owner_id_fkey1 ON groups IS 'Foreign key relationship between groups and user_profiles';
COMMENT ON CONSTRAINT subgroups_created_by_fkey1 ON subgroups IS 'Foreign key relationship between subgroups and user_profiles';
COMMENT ON CONSTRAINT group_members_user_id_fkey1 ON group_members IS 'Foreign key relationship between group_members and user_profiles';

-- Fix column name mismatches in group_post_reactions table
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'group_post_reactions' AND column_name = 'type'
    ) THEN
        ALTER TABLE group_post_reactions RENAME COLUMN type TO reaction_type;
    END IF;
END $$;

-- Fix column name mismatches in group_event_participants table
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'group_event_participants' AND column_name = 'rsvp_status'
    ) THEN
        ALTER TABLE group_event_participants RENAME COLUMN rsvp_status TO status;
    END IF;
END $$;

-- Ensure proper JSON handling for location column in group_events
ALTER TABLE IF EXISTS group_events 
    ALTER COLUMN location TYPE JSONB USING location::JSONB;

-- Add missing indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_events_group_id ON group_events(group_id);
CREATE INDEX IF NOT EXISTS idx_group_post_reactions_post_id ON group_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_group_post_comments_post_id ON group_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_group_event_participants_event_id ON group_event_participants(event_id);

-- Ensure NOT NULL constraints on critical columns
ALTER TABLE IF EXISTS group_posts 
    ALTER COLUMN group_id SET NOT NULL,
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE IF EXISTS group_events 
    ALTER COLUMN group_id SET NOT NULL,
    ALTER COLUMN created_by SET NOT NULL;

ALTER TABLE IF EXISTS group_post_reactions 
    ALTER COLUMN post_id SET NOT NULL,
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN reaction_type SET NOT NULL;

ALTER TABLE IF EXISTS group_post_comments 
    ALTER COLUMN post_id SET NOT NULL,
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN content SET NOT NULL;

ALTER TABLE IF EXISTS group_event_participants 
    ALTER COLUMN event_id SET NOT NULL,
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN status SET NOT NULL;
