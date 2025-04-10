# Database Triggers

This file contains the SQL query to retrieve all triggers defined in the Rollodex database. Triggers are database objects that automatically execute in response to specific events on a table (INSERT, UPDATE, DELETE).

## Query Purpose:
This query fetches trigger definitions from PostgreSQL's system catalogs, showing the trigger name, associated table, and the complete trigger definition.

## Query Information Returned:
- **trigger_name**: The name of the trigger
- **table_name**: The table the trigger is associated with
- **trigger_definition**: The complete SQL definition of the trigger, including:
  - Execution timing (BEFORE, AFTER, or INSTEAD OF)
  - Event(s) that activate the trigger (INSERT, UPDATE, DELETE)
  - Whether it fires once per statement or for each row
  - The function called by the trigger

## Relevance for Friends and Chat Features:
Database triggers can be useful for implementing:
- Automatic notification generation when a new chat message is received
- Friend request status tracking and updates
- Activity logging for analytics

Run this query in the Supabase SQL Editor to view all triggers in the database.

[
  {
    "trigger_name": "points_earned_notification_trigger",
    "table_name": "point_transactions",
    "trigger_definition": "CREATE TRIGGER points_earned_notification_trigger AFTER INSERT ON public.point_transactions FOR EACH ROW EXECUTE FUNCTION notify_points_earned()"
  },
  {
    "trigger_name": "trigger_booking_badge",
    "table_name": "service_bookings",
    "trigger_definition": "CREATE TRIGGER trigger_booking_badge AFTER INSERT ON public.service_bookings FOR EACH ROW EXECUTE FUNCTION award_booking_milestone_badge()"
  },
  {
    "trigger_name": "badge_earned_notification_trigger",
    "table_name": "user_badges",
    "trigger_definition": "CREATE TRIGGER badge_earned_notification_trigger AFTER INSERT ON public.user_badges FOR EACH ROW EXECUTE FUNCTION notify_badge_earned()"
  },
  {
    "trigger_name": "trigger_profile_badge",
    "table_name": "user_profiles",
    "trigger_definition": "CREATE TRIGGER trigger_profile_badge AFTER INSERT OR UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION award_profile_completion_badge()"
  },
  {
    "trigger_name": "streak_milestone_notification_trigger",
    "table_name": "user_streaks",
    "trigger_definition": "CREATE TRIGGER streak_milestone_notification_trigger AFTER INSERT OR UPDATE ON public.user_streaks FOR EACH ROW EXECUTE FUNCTION notify_streak_milestone()"
  },
  {
    "trigger_name": "trigger_streak_badge",
    "table_name": "user_streaks",
    "trigger_definition": "CREATE TRIGGER trigger_streak_badge AFTER INSERT OR UPDATE ON public.user_streaks FOR EACH ROW WHEN (((new.streak_type = 'login'::text) AND (new.current_count >= 7))) EXECUTE FUNCTION award_login_streak_badge()"
  }
]