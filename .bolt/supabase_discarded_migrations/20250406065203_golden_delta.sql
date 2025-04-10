/*
  # Create NDIS Participant Users

  This migration creates 20 diverse NDIS participants with detailed profiles including:
  - Various disabilities and support needs
  - Different age groups and backgrounds
  - Diverse comfort traits and preferences
  - Realistic NDIS numbers and verification status

  1. Users
    - 20 participants with unique email addresses
    - Mix of support needs and preferences
    - Realistic avatar URLs from Unsplash
    - Detailed bios and preferences

  2. Profiles
    - Comprehensive comfort traits
    - Service preferences
    - Accessibility needs
    - NDIS verification status
*/

-- Create NDIS participants
INSERT INTO auth.users (id, email)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'alex.wong@gmail.com'),
  ('22222222-2222-2222-2222-222222222222', 'maya.patel@outlook.com'),
  ('33333333-3333-3333-3333-333333333333', 'jordan.smith@gmail.com'),
  ('44444444-4444-4444-4444-444444444444', 'zara.ahmed@yahoo.com'),
  ('55555555-5555-5555-5555-555555555555', 'liam.nguyen@gmail.com'),
  ('66666666-6666-6666-6666-666666666666', 'sofia.garcia@outlook.com'),
  ('77777777-7777-7777-7777-777777777777', 'kai.wilson@gmail.com'),
  ('88888888-8888-8888-8888-888888888888', 'ruby.thompson@yahoo.com'),
  ('99999999-9999-9999-9999-999999999999', 'oscar.lee@gmail.com'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ava.miller@outlook.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'leo.chen@gmail.com'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'isla.kumar@yahoo.com'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'noah.santos@gmail.com'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'mia.brown@outlook.com'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'felix.taylor@gmail.com'),
  ('11112222-3333-4444-5555-666677778888', 'aria.jackson@yahoo.com'),
  ('22223333-4444-5555-6666-777788889999', 'lucas.white@gmail.com'),
  ('33334444-5555-6666-7777-888899990000', 'emma.davis@outlook.com'),
  ('44445555-6666-7777-8888-999900001111', 'oliver.martin@gmail.com'),
  ('55556666-7777-8888-9999-000011112222', 'chloe.anderson@yahoo.com');

-- Create participant profiles with diverse needs and preferences
INSERT INTO user_profiles (
  id,
  username,
  full_name,
  avatar_url,
  bio,
  role,
  ndis_number,
  ndis_verified,
  comfort_traits,
  preferred_categories,
  preferred_service_formats,
  accessibility_needs,
  created_at
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'alexw',
    'Alex Wong',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6',
    'Passionate about music and technology',
    'participant',
    '98765432101',
    true,
    ARRAY['Quiet Environment', 'Experience with Vision Impairment', 'Tech Savvy'],
    ARRAY['Music Therapy', 'Technology Support', 'Life Skills'],
    ARRAY['Online', 'Home Visits'],
    ARRAY['Screen Reader Compatible', 'Voice Control', 'High Contrast'],
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'mayap',
    'Maya Patel',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    'Exploring art and creative expression',
    'participant',
    '87654321098',
    true,
    ARRAY['Female Support Worker', 'Creative Environment', 'Small Groups'],
    ARRAY['Art Therapy', 'Social Skills', 'Community Access'],
    ARRAY['Group Sessions', 'Center Based'],
    ARRAY['Sensory Support', 'Communication Aids'],
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'jordans',
    'Jordan Smith',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    'Sports enthusiast focusing on physical recovery',
    'participant',
    '76543210987',
    true,
    ARRAY['Male Support Worker', 'Active Environment', 'Experience with Physical Disabilities'],
    ARRAY['Physiotherapy', 'Exercise Physiology', 'Hydrotherapy'],
    ARRAY['In Person', 'Center Based'],
    ARRAY['Mobility Equipment', 'Pool Access', 'Exercise Equipment'],
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'zaraa',
    'Zara Ahmed',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
    'Working on communication and independence',
    'participant',
    '65432109876',
    true,
    ARRAY['Female Support Worker', 'Quiet Environment', 'Cultural Sensitivity'],
    ARRAY['Speech Therapy', 'Occupational Therapy', 'Life Skills'],
    ARRAY['Online', 'Home Visits'],
    ARRAY['Communication Tools', 'Visual Aids'],
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'liamn',
    'Liam Nguyen',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    'Tech enthusiast learning independent living skills',
    'participant',
    '54321098765',
    true,
    ARRAY['Experience with Technology', 'Structured Environment', 'Clear Communication'],
    ARRAY['Life Skills', 'Technology Support', 'Social Skills'],
    ARRAY['Online', 'In Person'],
    ARRAY['Smart Home Technology', 'Organization Aids'],
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'sofiag',
    'Sofia Garcia',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    'Passionate about dance and movement therapy',
    'participant',
    '43210987654',
    true,
    ARRAY['Female Support Worker', 'Creative Environment', 'Music'],
    ARRAY['Dance Therapy', 'Physiotherapy', 'Social Activities'],
    ARRAY['Group Sessions', 'Center Based'],
    ARRAY['Mobility Support', 'Audio Equipment'],
    NOW()
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'kaiw',
    'Kai Wilson',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
    'Focusing on sensory integration and social skills',
    'participant',
    '32109876543',
    true,
    ARRAY['Quiet Environment', 'Experience with Autism', 'Routine Based'],
    ARRAY['Occupational Therapy', 'Sensory Integration', 'Social Skills'],
    ARRAY['Individual Sessions', 'Home Visits'],
    ARRAY['Sensory Equipment', 'Quiet Space'],
    NOW()
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    'rubyt',
    'Ruby Thompson',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
    'Learning independent living and social skills',
    'participant',
    '21098765432',
    true,
    ARRAY['Female Support Worker', 'Social Environment', 'Transport Provided'],
    ARRAY['Life Skills', 'Social Activities', 'Community Access'],
    ARRAY['Group Sessions', 'Community Based'],
    ARRAY['Transport Support', 'Social Support'],
    NOW()
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    'oscarl',
    'Oscar Lee',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    'Working on physical strength and mobility',
    'participant',
    '10987654321',
    true,
    ARRAY['Male Support Worker', 'Active Environment', 'Experience with Physical Disabilities'],
    ARRAY['Exercise Physiology', 'Physiotherapy', 'Hydrotherapy'],
    ARRAY['In Person', 'Center Based'],
    ARRAY['Mobility Equipment', 'Exercise Equipment'],
    NOW()
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'avam',
    'Ava Miller',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    'Exploring creative arts and communication',
    'participant',
    '09876543210',
    true,
    ARRAY['Female Support Worker', 'Creative Environment', 'Small Groups'],
    ARRAY['Art Therapy', 'Music Therapy', 'Speech Therapy'],
    ARRAY['Group Sessions', 'Online'],
    ARRAY['Communication Aids', 'Art Materials'],
    NOW()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'leoc',
    'Leo Chen',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    'Tech enthusiast learning life skills',
    'participant',
    '98765432109',
    true,
    ARRAY['Experience with Technology', 'Structured Environment', 'Clear Instructions'],
    ARRAY['Technology Support', 'Life Skills', 'Social Skills'],
    ARRAY['Online', 'Home Visits'],
    ARRAY['Smart Technology', 'Organization Tools'],
    NOW()
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'islak',
    'Isla Kumar',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
    'Focusing on communication and social skills',
    'participant',
    '87654321087',
    true,
    ARRAY['Female Support Worker', 'Quiet Environment', 'Small Groups'],
    ARRAY['Speech Therapy', 'Social Skills', 'Art Therapy'],
    ARRAY['Individual Sessions', 'Group Sessions'],
    ARRAY['Communication Aids', 'Visual Supports'],
    NOW()
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'noahs',
    'Noah Santos',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
    'Working on physical fitness and coordination',
    'participant',
    '76543210976',
    true,
    ARRAY['Male Support Worker', 'Active Environment', 'Transport Provided'],
    ARRAY['Exercise Physiology', 'Sports Therapy', 'Swimming'],
    ARRAY['Center Based', 'Community Based'],
    ARRAY['Exercise Equipment', 'Pool Access'],
    NOW()
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'miab',
    'Mia Brown',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    'Learning independent living skills',
    'participant',
    '65432109865',
    true,
    ARRAY['Female Support Worker', 'Structured Environment', 'Routine Based'],
    ARRAY['Life Skills', 'Occupational Therapy', 'Community Access'],
    ARRAY['Home Visits', 'Community Based'],
    ARRAY['Home Modifications', 'Life Skills Tools'],
    NOW()
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'felixt',
    'Felix Taylor',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    'Exploring music and creative expression',
    'participant',
    '54321098754',
    true,
    ARRAY['Experience with Hearing Impairment', 'Visual Communication', 'Creative Environment'],
    ARRAY['Music Therapy', 'Art Therapy', 'Dance Movement'],
    ARRAY['Individual Sessions', 'Group Sessions'],
    ARRAY['Visual Aids', 'Vibration Equipment'],
    NOW()
  ),
  (
    '11112222-3333-4444-5555-666677778888',
    'ariaj',
    'Aria Jackson',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    'Working on sensory integration and communication',
    'participant',
    '43210987643',
    true,
    ARRAY['Female Support Worker', 'Quiet Environment', 'Sensory Sensitive'],
    ARRAY['Occupational Therapy', 'Speech Therapy', 'Sensory Integration'],
    ARRAY['Home Visits', 'Center Based'],
    ARRAY['Sensory Equipment', 'Communication Tools'],
    NOW()
  ),
  (
    '22223333-4444-5555-6666-777788889999',
    'lucasw',
    'Lucas White',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    'Focusing on physical therapy and mobility',
    'participant',
    '32109876532',
    true,
    ARRAY['Male Support Worker', 'Active Environment', 'Experience with Physical Disabilities'],
    ARRAY['Physiotherapy', 'Hydrotherapy', 'Exercise Physiology'],
    ARRAY['Center Based', 'Pool Based'],
    ARRAY['Mobility Equipment', 'Pool Access'],
    NOW()
  ),
  (
    '33334444-5555-6666-7777-888899990000',
    'emmad',
    'Emma Davis',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
    'Learning social skills and community participation',
    'participant',
    '21098765421',
    true,
    ARRAY['Female Support Worker', 'Social Environment', 'Small Groups'],
    ARRAY['Social Skills', 'Community Access', 'Life Skills'],
    ARRAY['Group Sessions', 'Community Based'],
    ARRAY['Social Support', 'Transport Assistance'],
    NOW()
  ),
  (
    '44445555-6666-7777-8888-999900001111',
    'oliverm',
    'Oliver Martin',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
    'Working on technology skills and independence',
    'participant',
    '10987654310',
    true,
    ARRAY['Experience with Technology', 'Structured Environment', 'Clear Communication'],
    ARRAY['Technology Support', 'Life Skills', 'Social Skills'],
    ARRAY['Online', 'Center Based'],
    ARRAY['Assistive Technology', 'Computer Access'],
    NOW()
  ),
  (
    '55556666-7777-8888-9999-000011112222',
    'chloea',
    'Chloe Anderson',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    'Exploring creative arts and movement',
    'participant',
    '09876543209',
    true,
    ARRAY['Female Support Worker', 'Creative Environment', 'Movement Based'],
    ARRAY['Dance Therapy', 'Art Therapy', 'Physical Activity'],
    ARRAY['Group Sessions', 'Center Based'],
    ARRAY['Movement Space', 'Art Materials'],
    NOW()
  );

-- Create wallet entries for new users
INSERT INTO wallets (user_id, total_balance, category_breakdown)
SELECT 
  id as user_id,
  50000 as total_balance,
  jsonb_build_object(
    'core_support', floor(random() * 20000 + 10000),
    'capacity_building', floor(random() * 15000 + 8000),
    'capital_support', floor(random() * 10000 + 5000)
  ) as category_breakdown
FROM auth.users
WHERE id IN (
  SELECT id FROM user_profiles 
  WHERE role = 'participant' 
  AND created_at > NOW() - interval '5 minutes'
);