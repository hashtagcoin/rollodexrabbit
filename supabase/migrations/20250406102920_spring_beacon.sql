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
  SELECT id FROM user_profiles LIMIT 5
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
LIMIT 15; -- Add up to 15 group memberships

-- Create sample rewards for users
WITH existing_users AS (
  SELECT id FROM user_profiles LIMIT 5
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
LIMIT 15;

-- Create sample notifications for each user
WITH existing_users AS (
  SELECT id FROM user_profiles LIMIT 5
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
LIMIT 25;

-- Create wallet records for participants
WITH existing_users AS (
  SELECT id FROM user_profiles WHERE role = 'participant' LIMIT 5
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
FROM existing_users u
WHERE NOT EXISTS (
  SELECT 1 FROM wallets WHERE wallets.user_id = u.id
);

-- Create provider profiles for users marked as providers
WITH existing_providers AS (
  SELECT id, full_name, username, avatar_url 
  FROM user_profiles 
  WHERE role = 'provider'
  LIMIT 3
)
INSERT INTO service_providers (
  id,
  business_name,
  abn,
  credentials,
  verified,
  service_categories,
  service_formats,
  service_area,
  business_description,
  logo_url
)
SELECT
  p.id,
  p.full_name || '''s Services',
  (10000000000 + floor(random() * 89999999999))::text,
  ARRAY['NDIS Registration', 'Professional Certification'],
  true,
  ARRAY['Therapy', 'Support Work', 'Skills Development'],
  ARRAY['In Person', 'Online', 'Home Visits'],
  (5 + floor(random() * 20))::text,
  'Professional support services tailored to the unique needs of NDIS participants. We focus on providing high-quality, person-centered care.',
  p.avatar_url
FROM existing_providers p
WHERE NOT EXISTS (
  SELECT 1 FROM service_providers WHERE service_providers.id = p.id
);

-- Create mock services for providers
WITH providers AS (
  SELECT id, business_name FROM service_providers LIMIT 3
)
INSERT INTO services (
  provider_id,
  title,
  description,
  category,
  format,
  price,
  available
)
SELECT
  p.id,
  (ARRAY['Physiotherapy Session', 'Occupational Therapy', 'Life Skills Training'])[floor(random() * 3 + 1)],
  'Professional service provided by ' || p.business_name || '. Tailored to meet individual NDIS participant needs and goals.',
  (ARRAY['Therapy', 'Support Work', 'Skills Development'])[floor(random() * 3 + 1)],
  (ARRAY['in_person', 'online', 'home_visits'])[floor(random() * 3 + 1)],
  (80 + floor(random() * 100))::numeric,
  true
FROM providers p, generate_series(1, 2)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE services.provider_id = p.id
)
LIMIT 6;

-- Create sample service bookings
WITH participants AS (
  SELECT id FROM user_profiles WHERE role = 'participant' LIMIT 3
),
available_services AS (
  SELECT id, provider_id, price FROM services LIMIT 6
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
LIMIT 9;

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
LIMIT 5;