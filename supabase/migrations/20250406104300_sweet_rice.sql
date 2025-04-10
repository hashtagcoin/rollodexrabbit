/*
  # Sample Data Migration
  
  This migration creates sample data for the Rollodex application including:
  1. Sample users with different roles and preferences
  2. Provider profiles with services
  3. Bookings, claims, and wallet data
  4. Community content like posts, groups, and rewards
  
  The migration is designed to be idempotent - it will only create data that doesn't already exist.
*/

-- Create sample posts for social feed
WITH existing_users AS (
  SELECT id FROM auth.users LIMIT 10
)
INSERT INTO posts (
  user_id,
  caption,
  media_urls,
  created_at
)
SELECT
  u.id,
  CASE 
    WHEN floor(random() * 5 + 1) = 1 THEN 'Had a great session with my physiotherapist today! Making progress! #NDISjourney'
    WHEN floor(random() * 5 + 1) = 2 THEN 'Enjoying the accessibility features at this new cafe. So refreshing to see inclusive design! #accessibility'
    WHEN floor(random() * 5 + 1) = 3 THEN 'Started a new skill development program this week. Excited about the opportunities ahead! #personalgrowth'
    WHEN floor(random() * 5 + 1) = 4 THEN 'Beautiful day for outdoor therapy. Nature is the best medicine. #wellbeing'
    ELSE 'Grateful for the support network I''ve built through this platform. You all make a difference! #community'
  END,
  CASE 
    WHEN floor(random() * 2) = 0 THEN ARRAY['https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1974&auto=format&fit=crop']
    ELSE NULL
  END,
  now() - (random() * interval '60 days')
FROM existing_users u, generate_series(1, 3) -- 3 posts per user
WHERE EXISTS (
  SELECT 1 FROM user_profiles WHERE user_profiles.id = u.id
) 
AND NOT EXISTS (
  SELECT 1 FROM posts WHERE posts.user_id = u.id
)
LIMIT 30;

-- Create sample groups
INSERT INTO groups (
  name,
  owner_id,
  type,
  description
)
WITH existing_users AS (
  SELECT id FROM user_profiles LIMIT 5
)
SELECT
  (ARRAY[
    'Accessible Travel Enthusiasts', 
    'Sydney Disability Support Network', 
    'Tech & Accessibility Meetup', 
    'Inclusive Art Collective',
    'Adaptive Sports Club',
    'SDA Housing Connect Melbourne',
    'Brisbane Accessible Living Group'
  ])[gs],
  (SELECT id FROM existing_users ORDER BY random() LIMIT 1),
  CASE 
    WHEN gs > 5 THEN 'housing'
    ELSE 'interest'
  END,
  CASE 
    WHEN gs = 1 THEN 'A group for sharing accessible travel tips, destinations, and experiences.'
    WHEN gs = 2 THEN 'Local support network for people with disabilities in Sydney.'
    WHEN gs = 3 THEN 'Discussing technological solutions and digital accessibility.'
    WHEN gs = 4 THEN 'A community for artists with disabilities to share work and collaborate.'
    WHEN gs = 5 THEN 'For sports enthusiasts interested in adaptive sports activities.'
    WHEN gs = 6 THEN 'Connect with others seeking or offering SDA housing in Melbourne.'
    ELSE 'Brisbane-based group focused on accessible housing and independent living.'
  END
FROM generate_series(1, 7) gs
WHERE NOT EXISTS (
  SELECT 1 FROM groups WHERE name = (ARRAY[
    'Accessible Travel Enthusiasts', 
    'Sydney Disability Support Network', 
    'Tech & Accessibility Meetup', 
    'Inclusive Art Collective',
    'Adaptive Sports Club',
    'SDA Housing Connect Melbourne',
    'Brisbane Accessible Living Group'
  ])[gs]
);

-- Add members to groups
WITH group_data AS (
  SELECT id FROM groups
),
user_data AS (
  SELECT id FROM user_profiles LIMIT 10
)
INSERT INTO group_members (
  group_id,
  user_id,
  role
)
SELECT
  g.id,
  u.id,
  CASE 
    WHEN random() < 0.2 THEN 'admin'
    ELSE 'member'
  END
FROM 
  group_data g,
  user_data u
WHERE NOT EXISTS (
  SELECT 1 FROM group_members 
  WHERE group_members.group_id = g.id 
  AND group_members.user_id = u.id
)
LIMIT 30; -- Add up to 30 group memberships

-- Create sample rewards for users
WITH existing_users AS (
  SELECT id FROM user_profiles LIMIT 10
)
INSERT INTO rewards (
  user_id,
  type,
  label,
  status,
  metadata,
  created_at
)
SELECT
  u.id,
  CASE 
    WHEN floor(random() * 3 + 1) = 1 THEN 'badge'
    WHEN floor(random() * 3 + 1) = 2 THEN 'streak'
    ELSE 'referral'
  END,
  CASE 
    WHEN floor(random() * 3 + 1) = 1 THEN (ARRAY['Profile Champion', 'Booking Master', 'Community Connector', 'First Steps', 'Feedback Guru'])[floor(random() * 5 + 1)]
    WHEN floor(random() * 3 + 1) = 2 THEN (ARRAY['5 Day Streak', '10 Day Streak', '30 Day Streak'])[floor(random() * 3 + 1)]
    ELSE 'Successful Referral'
  END,
  'earned',
  jsonb_build_object(
    'points', (50 + floor(random() * 200))::int,
    'description', 'Achievement unlocked for platform engagement and participation',
    'icon', (ARRAY['award', 'zap', 'user-plus', 'calendar-check', 'message-square'])[floor(random() * 5 + 1)]
  ),
  now() - (random() * interval '90 days')
FROM existing_users u, generate_series(1, 3) -- 3 rewards per user
WHERE NOT EXISTS (
  SELECT 1 FROM rewards WHERE rewards.user_id = u.id
)
LIMIT 30;

-- Create sample notifications for each user
WITH existing_users AS (
  SELECT id FROM user_profiles LIMIT 10
)
INSERT INTO notifications (
  user_id,
  type,
  content,
  seen,
  created_at
)
SELECT
  u.id,
  (ARRAY['booking', 'message', 'system'])[floor(random() * 3 + 1)],
  CASE 
    WHEN floor(random() * 3 + 1) = 1 THEN 'Your booking has been confirmed for next week.'
    WHEN floor(random() * 3 + 1) = 2 THEN 'You have a new message from your service provider.'
    ELSE 'Please update your profile information to enhance your experience.'
  END,
  floor(random() * 2) = 0,
  now() - (random() * interval '30 days')
FROM existing_users u, generate_series(1, 5) -- 5 notifications per user
WHERE NOT EXISTS (
  SELECT 1 FROM notifications WHERE notifications.user_id = u.id
)
LIMIT 50;

-- Create wallet records for participants if they don't exist
WITH existing_participants AS (
  SELECT id FROM user_profiles WHERE role = 'participant' LIMIT 10
)
INSERT INTO wallets (
  user_id,
  total_balance,
  category_breakdown
) 
SELECT 
  u.id,
  15000 - (random() * 5000)::numeric,
  jsonb_build_object(
    'core_support', (8000 - (random() * 2000))::numeric,
    'capacity_building', (5000 - (random() * 1500))::numeric,
    'capital_support', (2000 - (random() * 1000))::numeric
  )
FROM existing_participants u
WHERE NOT EXISTS (
  SELECT 1 FROM wallets WHERE wallets.user_id = u.id
);

-- Create sample service bookings if they don't exist
WITH participants AS (
  SELECT id FROM user_profiles WHERE role = 'participant' LIMIT 5
),
available_services AS (
  SELECT id, provider_id, price FROM services LIMIT 10
)
INSERT INTO service_bookings (
  user_id,
  service_id,
  scheduled_at,
  total_price,
  ndis_covered_amount,
  gap_payment,
  notes,
  status
)
SELECT
  p.id,
  s.id,
  now() + (random() * interval '30 days'),
  s.price,
  s.price * 0.8,
  s.price * 0.2,
  'Please note I need wheelchair access',
  (ARRAY['pending', 'confirmed', 'completed'])[floor(random() * 3 + 1)]
FROM 
  participants p,
  available_services s
WHERE NOT EXISTS (
  SELECT 1 FROM service_bookings 
  WHERE service_bookings.user_id = p.id 
  AND service_bookings.service_id = s.id
)
LIMIT 15;

-- Create sample claims for completed bookings
INSERT INTO claims (
  booking_id,
  user_id,
  status,
  amount,
  expiry_date
)
SELECT
  sb.id,
  sb.user_id,
  'pending',
  sb.ndis_covered_amount,
  now() + interval '90 days'
FROM service_bookings sb
WHERE sb.status = 'completed'
AND NOT EXISTS (
  SELECT 1 FROM claims WHERE claims.booking_id = sb.id
)
LIMIT 10;

-- Add comments to posts
WITH existing_posts AS (
  SELECT id FROM posts LIMIT 10
),
existing_users AS (
  SELECT id FROM user_profiles LIMIT 5
)
INSERT INTO comments (
  post_id,
  user_id,
  content,
  created_at
)
SELECT
  p.id,
  u.id,
  CASE 
    WHEN floor(random() * 5 + 1) = 1 THEN 'This is so inspiring! Keep up the great work!'
    WHEN floor(random() * 5 + 1) = 2 THEN 'Thanks for sharing your experience. Very helpful.'
    WHEN floor(random() * 5 + 1) = 3 THEN 'I had a similar experience. Would love to connect!'
    WHEN floor(random() * 5 + 1) = 4 THEN 'Great progress! You should be proud.'
    ELSE 'This community is amazing. So supportive!'
  END,
  now() - (random() * interval '30 days')
FROM 
  existing_posts p,
  existing_users u
WHERE NOT EXISTS (
  SELECT 1 FROM comments 
  WHERE comments.post_id = p.id 
  AND comments.user_id = u.id
)
LIMIT 20;

-- Add likes to posts
WITH existing_posts AS (
  SELECT id FROM posts LIMIT 10
),
existing_users AS (
  SELECT id FROM user_profiles LIMIT 10
)
INSERT INTO post_likes (
  post_id,
  user_id,
  created_at
)
SELECT
  p.id,
  u.id,
  now() - (random() * interval '30 days')
FROM 
  existing_posts p,
  existing_users u
WHERE NOT EXISTS (
  SELECT 1 FROM post_likes 
  WHERE post_likes.post_id = p.id 
  AND post_likes.user_id = u.id
)
LIMIT 30;

-- Create subgroups for existing groups
WITH existing_groups AS (
  SELECT id FROM groups LIMIT 3
),
existing_users AS (
  SELECT id FROM user_profiles LIMIT 5
)
INSERT INTO subgroups (
  group_id,
  created_by,
  name,
  description,
  created_at
)
SELECT
  g.id,
  u.id,
  CASE 
    WHEN floor(random() * 5 + 1) = 1 THEN 'Weekend Meetup'
    WHEN floor(random() * 5 + 1) = 2 THEN 'Study Group'
    WHEN floor(random() * 5 + 1) = 3 THEN 'Travel Planning'
    WHEN floor(random() * 5 + 1) = 4 THEN 'Skill Share'
    ELSE 'Support Circle'
  END,
  'A subgroup for members to connect on specific activities and interests.',
  now() - (random() * interval '90 days')
FROM 
  existing_groups g,
  existing_users u
WHERE NOT EXISTS (
  SELECT 1 FROM subgroups 
  WHERE subgroups.group_id = g.id 
  AND subgroups.created_by = u.id
)
LIMIT 5;

-- Add post reactions
WITH existing_posts AS (
  SELECT id FROM posts LIMIT 10
),
existing_users AS (
  SELECT id FROM user_profiles LIMIT 10
)
INSERT INTO post_reactions (
  post_id,
  user_id,
  reaction_type,
  created_at
)
SELECT
  p.id,
  u.id,
  (ARRAY['like', 'love', 'support', 'celebrate', 'insightful'])[floor(random() * 5 + 1)],
  now() - (random() * interval '30 days')
FROM 
  existing_posts p,
  existing_users u
WHERE NOT EXISTS (
  SELECT 1 FROM post_reactions 
  WHERE post_reactions.post_id = p.id 
  AND post_reactions.user_id = u.id
)
LIMIT 40;