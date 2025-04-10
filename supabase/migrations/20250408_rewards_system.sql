-- Create rewards system tables and functions

-- Badge definitions table
CREATE TABLE IF NOT EXISTS badge_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT,
    category TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    is_notified BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(user_id, badge_id)
);

-- User streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    streak_type TEXT NOT NULL,
    current_count INTEGER NOT NULL DEFAULT 0,
    longest_count INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, streak_type)
);

-- User points table
CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0,
    available_points INTEGER NOT NULL DEFAULT 0,
    lifetime_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Points transactions table
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    target INTEGER NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_type)
);

-- Ensure notifications table has the is_read column if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
            ALTER TABLE notifications ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE;
        END IF;
    END IF;
END $$;

-- Update notifications table constraint to include reward system notification types
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'valid_notification_type' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE notifications DROP CONSTRAINT valid_notification_type;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT valid_notification_type 
        CHECK (
            type IN (
                -- Existing types
                'group',
                'system',
                'like',
                'message',
                'booking',
                'comment',
                
                -- New types for rewards system
                'badge_earned', 
                'points_earned', 
                'streak_milestone', 
                'booking_reminder', 
                'booking_confirmation',
                'group_invitation',
                'friend_request'
            )
        );
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(
    p_user_id UUID,
    p_streak_type TEXT
)
RETURNS VOID AS $$
DECLARE
    v_streak_record RECORD;
    v_days_since_last INTEGER;
BEGIN
    -- Get current streak record
    SELECT * INTO v_streak_record
    FROM user_streaks
    WHERE user_id = p_user_id AND streak_type = p_streak_type;
    
    -- If no streak record exists, create one
    IF v_streak_record IS NULL THEN
        INSERT INTO user_streaks (user_id, streak_type, current_count, longest_count, last_activity_date)
        VALUES (p_user_id, p_streak_type, 1, 1, CURRENT_DATE);
        RETURN;
    END IF;
    
    -- Calculate days since last activity
    v_days_since_last := CURRENT_DATE - v_streak_record.last_activity_date;
    
    -- Update streak based on days since last activity
    IF v_days_since_last = 0 THEN
        -- Already updated today, do nothing
        RETURN;
    ELSIF v_days_since_last = 1 THEN
        -- Consecutive day, increment streak
        UPDATE user_streaks
        SET 
            current_count = current_count + 1,
            longest_count = GREATEST(longest_count, current_count + 1),
            last_activity_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE user_id = p_user_id AND streak_type = p_streak_type;
    ELSE
        -- Streak broken, reset to 1
        UPDATE user_streaks
        SET 
            current_count = 1,
            last_activity_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE user_id = p_user_id AND streak_type = p_streak_type;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award points to a user
CREATE OR REPLACE FUNCTION award_points(
    p_user_id UUID,
    p_amount INTEGER,
    p_transaction_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_points_record RECORD;
BEGIN
    -- Get current points record
    SELECT * INTO v_points_record
    FROM user_points
    WHERE user_id = p_user_id;
    
    -- If no points record exists, create one
    IF v_points_record IS NULL THEN
        INSERT INTO user_points (
            user_id, 
            total_points, 
            available_points, 
            lifetime_points
        )
        VALUES (
            p_user_id, 
            p_amount, 
            p_amount, 
            p_amount
        );
    ELSE
        -- Update existing points record
        UPDATE user_points
        SET 
            total_points = total_points + p_amount,
            available_points = available_points + p_amount,
            lifetime_points = lifetime_points + p_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
    
    -- Record the transaction
    INSERT INTO point_transactions (
        user_id,
        amount,
        transaction_type,
        description,
        reference_id
    )
    VALUES (
        p_user_id,
        p_amount,
        p_transaction_type,
        p_description,
        p_reference_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award badges based on achievements
CREATE OR REPLACE FUNCTION check_and_award_badges(
    p_user_id UUID
)
RETURNS TABLE(badge_id UUID, badge_name TEXT) AS $$
DECLARE
    v_badge RECORD;
    v_eligible BOOLEAN;
    v_achievement RECORD;
    v_requirement RECORD;
    v_awarded_badges UUID[] := ARRAY[]::UUID[];
BEGIN
    -- Loop through all active badges
    FOR v_badge IN 
        SELECT * FROM badge_definitions WHERE is_active = TRUE
    LOOP
        -- Skip if user already has this badge
        CONTINUE WHEN EXISTS (
            SELECT 1 FROM user_badges 
            WHERE user_id = p_user_id AND badge_id = v_badge.id
        );
        
        v_eligible := TRUE;
        
        -- Check each requirement in the badge
        FOR v_requirement IN 
            SELECT * FROM jsonb_each(v_badge.requirements)
        LOOP
            -- Check if user meets this requirement
            SELECT * INTO v_achievement
            FROM user_achievements
            WHERE user_id = p_user_id 
            AND achievement_type = v_requirement.key;
            
            -- If achievement doesn't exist or isn't completed, user is not eligible
            IF v_achievement IS NULL OR NOT v_achievement.completed THEN
                v_eligible := FALSE;
                EXIT; -- No need to check further requirements
            END IF;
        END LOOP;
        
        -- Award badge if eligible
        IF v_eligible THEN
            INSERT INTO user_badges (user_id, badge_id)
            VALUES (p_user_id, v_badge.id);
            
            -- Add to result set
            v_awarded_badges := array_append(v_awarded_badges, v_badge.id);
            
            -- Award points for the badge
            PERFORM award_points(
                p_user_id, 
                v_badge.points, 
                'BADGE_EARNED', 
                'Earned badge: ' || v_badge.name, 
                v_badge.id
            );
        END IF;
    END LOOP;
    
    -- Return awarded badges
    RETURN QUERY
    SELECT b.id, b.name
    FROM badge_definitions b
    WHERE b.id = ANY(v_awarded_badges);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update achievement progress
CREATE OR REPLACE FUNCTION update_achievement_progress(
    p_user_id UUID,
    p_achievement_type TEXT,
    p_progress_increment INTEGER DEFAULT 1,
    p_target INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_achievement RECORD;
    v_completed BOOLEAN := FALSE;
    v_target INTEGER;
BEGIN
    -- Get current achievement record
    SELECT * INTO v_achievement
    FROM user_achievements
    WHERE user_id = p_user_id AND achievement_type = p_achievement_type;
    
    -- Determine target value
    v_target := COALESCE(p_target, CASE WHEN v_achievement IS NULL THEN 1 ELSE v_achievement.target END);
    
    -- If no achievement record exists, create one
    IF v_achievement IS NULL THEN
        INSERT INTO user_achievements (
            user_id, 
            achievement_type, 
            progress, 
            target, 
            completed
        )
        VALUES (
            p_user_id, 
            p_achievement_type, 
            p_progress_increment, 
            v_target, 
            p_progress_increment >= v_target
        );
        
        v_completed := p_progress_increment >= v_target;
    ELSE
        -- Skip update if already completed
        IF v_achievement.completed THEN
            RETURN TRUE;
        END IF;
        
        -- Update existing achievement record
        UPDATE user_achievements
        SET 
            progress = progress + p_progress_increment,
            target = v_target,
            completed = (progress + p_progress_increment) >= v_target,
            updated_at = NOW()
        WHERE user_id = p_user_id AND achievement_type = p_achievement_type
        RETURNING completed INTO v_completed;
    END IF;
    
    -- Check and award badges if achievement completed
    IF v_completed THEN
        PERFORM check_and_award_badges(p_user_id);
    END IF;
    
    RETURN v_completed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default badge definitions
DO $$
BEGIN
    -- Insert badges individually to avoid syntax issues
    INSERT INTO badge_definitions (name, description, category, points, requirements)
    VALUES ('Welcome Aboard', 'Complete your profile setup', 'onboarding', 50, '{"profile_complete": true}'::jsonb)
    ON CONFLICT DO NOTHING;

    INSERT INTO badge_definitions (name, description, category, points, requirements)
    VALUES ('Social Butterfly', 'Join 3 different groups', 'social', 100, '{"groups_joined": true}'::jsonb)
    ON CONFLICT DO NOTHING;

    INSERT INTO badge_definitions (name, description, category, points, requirements)
    VALUES ('Booking Pro', 'Book 5 different services', 'services', 150, '{"services_booked": true}'::jsonb)
    ON CONFLICT DO NOTHING;

    INSERT INTO badge_definitions (name, description, category, points, requirements)
    VALUES ('Perfect Attendance', 'Maintain a 7-day login streak', 'engagement', 200, '{"login_streak": true}'::jsonb)
    ON CONFLICT DO NOTHING;

    INSERT INTO badge_definitions (name, description, category, points, requirements)
    VALUES ('Housing Hunter', 'View 10 different housing listings', 'housing', 75, '{"housing_views": true}'::jsonb)
    ON CONFLICT DO NOTHING;

    INSERT INTO badge_definitions (name, description, category, points, requirements)
    VALUES ('Community Builder', 'Create a group with 5+ members', 'social', 250, '{"group_created": true, "group_members": true}'::jsonb)
    ON CONFLICT DO NOTHING;

    INSERT INTO badge_definitions (name, description, category, points, requirements)
    VALUES ('NDIS Navigator', 'Successfully claim 3 services', 'ndis', 150, '{"claims_submitted": true}'::jsonb)
    ON CONFLICT DO NOTHING;

    INSERT INTO badge_definitions (name, description, category, points, requirements)
    VALUES ('Feedback Champion', 'Leave 5 reviews on services', 'engagement', 100, '{"reviews_submitted": true}'::jsonb)
    ON CONFLICT DO NOTHING;
END $$;

-- Create notification functions and triggers after ensuring all tables exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_badges') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'point_transactions') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_streaks') THEN

        -- Function to create a notification when a badge is earned
        CREATE OR REPLACE FUNCTION notify_badge_earned()
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO notifications (
                user_id,
                title,
                body,
                type,
                data
            )
            SELECT
                NEW.user_id,
                'New Badge Earned!',
                'You''ve earned the "' || bd.name || '" badge. ' || bd.description,
                'badge_earned',
                jsonb_build_object(
                    'badge_id', bd.id,
                    'badge_name', bd.name,
                    'badge_description', bd.description,
                    'badge_icon', bd.icon_url,
                    'points', bd.points
                )
            FROM badge_definitions bd
            WHERE bd.id = NEW.badge_id;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Create trigger for badge earned notifications
        DROP TRIGGER IF EXISTS badge_earned_notification_trigger ON user_badges;
        CREATE TRIGGER badge_earned_notification_trigger
        AFTER INSERT ON user_badges
        FOR EACH ROW
        EXECUTE FUNCTION notify_badge_earned();

        -- Function to create a notification for points earned
        CREATE OR REPLACE FUNCTION notify_points_earned()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Only create notification for positive point transactions
            IF NEW.amount > 0 THEN
                INSERT INTO notifications (
                    user_id,
                    title,
                    body,
                    type,
                    data
                ) VALUES (
                    NEW.user_id,
                    'Points Earned!',
                    'You''ve earned ' || NEW.amount || ' points for ' || COALESCE(NEW.description, 'your activity') || '.',
                    'points_earned',
                    jsonb_build_object(
                        'points', NEW.amount,
                        'reason', COALESCE(NEW.description, 'activity'),
                        'transaction_id', NEW.id
                    )
                );
            END IF;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Create trigger for points earned notifications
        DROP TRIGGER IF EXISTS points_earned_notification_trigger ON point_transactions;
        CREATE TRIGGER points_earned_notification_trigger
        AFTER INSERT ON point_transactions
        FOR EACH ROW
        EXECUTE FUNCTION notify_points_earned();

        -- Function to create a notification for streak milestones
        CREATE OR REPLACE FUNCTION notify_streak_milestone()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Only create notification for significant milestones (7, 14, 30, 60, 90 days)
            IF (
                NEW.current_count IN (7, 14, 30, 60, 90) AND 
                (OLD.current_count IS NULL OR NEW.current_count > OLD.current_count)
            ) THEN
                INSERT INTO notifications (
                    user_id,
                    title,
                    body,
                    type,
                    data
                ) VALUES (
                    NEW.user_id,
                    NEW.current_count || '-Day Streak!',
                    'Congratulations! You''ve maintained your ' || NEW.streak_type || ' streak for ' || NEW.current_count || ' days.',
                    'streak_milestone',
                    jsonb_build_object(
                        'streak_type', NEW.streak_type,
                        'days', NEW.current_count,
                        'streak_id', NEW.id
                    )
                );
            END IF;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Create trigger for streak milestone notifications
        DROP TRIGGER IF EXISTS streak_milestone_notification_trigger ON user_streaks;
        CREATE TRIGGER streak_milestone_notification_trigger
        AFTER INSERT OR UPDATE ON user_streaks
        FOR EACH ROW
        EXECUTE FUNCTION notify_streak_milestone();
    END IF;
END $$;
