-- Create notifications system tables

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_notification_type CHECK (
        type IN (
            'badge_earned', 
            'points_earned', 
            'streak_milestone', 
            'booking_reminder', 
            'booking_confirmation',
            'group_invitation',
            'friend_request',
            'message',
            'system'
        )
    )
);

-- User push tokens table
CREATE TABLE IF NOT EXISTS user_push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    push_token TEXT NOT NULL,
    device_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, push_token)
);

-- Add is_notified column to user_badges table
ALTER TABLE user_badges 
ADD COLUMN IF NOT EXISTS is_notified BOOLEAN NOT NULL DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_push_token ON user_push_tokens(push_token);

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_body TEXT,
    p_type TEXT,
    p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        title,
        body,
        type,
        data,
        is_read,
        created_at
    )
    VALUES (
        p_user_id,
        p_title,
        p_body,
        p_type,
        p_data,
        FALSE,
        NOW()
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a badge earned notification
CREATE OR REPLACE FUNCTION create_badge_earned_notification(
    p_user_id UUID,
    p_badge_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_badge RECORD;
    v_notification_id UUID;
BEGIN
    -- Get badge details
    SELECT * INTO v_badge
    FROM badge_definitions
    WHERE id = p_badge_id;
    
    IF v_badge IS NULL THEN
        RAISE EXCEPTION 'Badge not found';
    END IF;
    
    -- Create notification
    v_notification_id := create_notification(
        p_user_id,
        'New Badge Earned!',
        'You''ve earned the "' || v_badge.name || '" badge. ' || v_badge.description,
        'badge_earned',
        jsonb_build_object(
            'badge_id', v_badge.id,
            'badge_name', v_badge.name,
            'badge_description', v_badge.description,
            'badge_icon', v_badge.icon_url,
            'points', v_badge.points
        )
    );
    
    -- Mark badge as notified
    UPDATE user_badges
    SET is_notified = TRUE
    WHERE user_id = p_user_id AND badge_id = p_badge_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a points earned notification
CREATE OR REPLACE FUNCTION create_points_earned_notification(
    p_user_id UUID,
    p_points INTEGER,
    p_reason TEXT
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    -- Create notification
    v_notification_id := create_notification(
        p_user_id,
        'Points Earned!',
        'You''ve earned ' || p_points || ' points for ' || p_reason || '.',
        'points_earned',
        jsonb_build_object(
            'points', p_points,
            'reason', p_reason
        )
    );
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a streak milestone notification
CREATE OR REPLACE FUNCTION create_streak_milestone_notification(
    p_user_id UUID,
    p_streak_type TEXT,
    p_days INTEGER
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
    v_streak_name TEXT;
BEGIN
    -- Format streak name
    v_streak_name := initcap(p_streak_type);
    
    -- Create notification
    v_notification_id := create_notification(
        p_user_id,
        p_days || '-Day ' || v_streak_name || ' Streak!',
        'Congratulations! You''ve maintained your ' || lower(v_streak_name) || ' streak for ' || p_days || ' days.',
        'streak_milestone',
        jsonb_build_object(
            'streak_type', p_streak_type,
            'days', p_days
        )
    );
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create notifications when badges are earned
CREATE OR REPLACE FUNCTION notify_badge_earned()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for the new badge
    PERFORM create_badge_earned_notification(NEW.user_id, NEW.badge_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on user_badges table
DROP TRIGGER IF EXISTS badge_earned_notification_trigger ON user_badges;
CREATE TRIGGER badge_earned_notification_trigger
AFTER INSERT ON user_badges
FOR EACH ROW
EXECUTE FUNCTION notify_badge_earned();

-- Trigger to automatically create notifications when points are awarded
CREATE OR REPLACE FUNCTION notify_points_earned()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification for positive point transactions
    IF NEW.amount > 0 THEN
        PERFORM create_points_earned_notification(
            NEW.user_id,
            NEW.amount,
            COALESCE(NEW.description, 'activity')
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on point_transactions table
DROP TRIGGER IF EXISTS points_earned_notification_trigger ON point_transactions;
CREATE TRIGGER points_earned_notification_trigger
AFTER INSERT ON point_transactions
FOR EACH ROW
EXECUTE FUNCTION notify_points_earned();

-- Trigger to automatically create notifications for streak milestones
CREATE OR REPLACE FUNCTION notify_streak_milestone()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification for significant milestones (7, 14, 30, 60, 90 days)
    IF (
        NEW.current_count IN (7, 14, 30, 60, 90) AND 
        (OLD.current_count IS NULL OR NEW.current_count > OLD.current_count)
    ) THEN
        PERFORM create_streak_milestone_notification(
            NEW.user_id,
            NEW.streak_type,
            NEW.current_count
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on user_streaks table
DROP TRIGGER IF EXISTS streak_milestone_notification_trigger ON user_streaks;
CREATE TRIGGER streak_milestone_notification_trigger
AFTER INSERT OR UPDATE ON user_streaks
FOR EACH ROW
EXECUTE FUNCTION notify_streak_milestone();
