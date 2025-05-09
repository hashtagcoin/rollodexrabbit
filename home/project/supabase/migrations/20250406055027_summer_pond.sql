/*
  # Add Mock Housing Listings

  This migration adds 15 detailed housing listings with realistic data including:
  - Various SDA categories
  - Different property types and sizes
  - Diverse locations across Australia
  - Comprehensive accessibility features
  - Realistic pricing and availability
  - Multiple high-quality property images

  1. Service Providers
    - Creates 3 verified service providers
    - Each provider has a unique UUID and ABN

  2. Housing Listings
    - 15 diverse properties across Australia
    - Mix of SDA categories and property types
    - Realistic pricing and features
    - Actual coordinates for each location
    - High-quality Unsplash image URLs
*/

-- First create service providers for the listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM service_providers 
    WHERE id IN (
      'd1eef850-b62a-4b80-9d96-3c07c1642a36',
      'e2f56789-c34d-5e67-8f90-1a2b3c4d5e6f',
      'f3g67890-d45e-6f78-9012-3b4c5d6e7f89'
    )
  ) THEN
    INSERT INTO service_providers (id, business_name, abn, verified)
    VALUES 
      ('d1eef850-b62a-4b80-9d96-3c07c1642a36', 'AccessHomes Australia', '12345678901', true),
      ('e2f56789-c34d-5e67-8f90-1a2b3c4d5e6f', 'Inclusive Living Solutions', '98765432109', true),
      ('f3g67890-d45e-6f78-9012-3b4c5d6e7f89', 'SDA Housing Group', '45678901234', true);
  END IF;
END $$;

-- Insert mock housing listings
INSERT INTO housing_listings (
  provider_id,
  title,
  description,
  weekly_rent,
  bond_amount,
  available_from,
  bedrooms,
  bathrooms,
  parking_spaces,
  property_type,
  sda_category,
  coordinates,
  address,
  suburb,
  state,
  postcode,
  features,
  accessibility_features,
  media_urls,
  virtual_tour_url,
  pets_allowed,
  ndis_supported
)
VALUES 
  (
    'd1eef850-b62a-4b80-9d96-3c07c1642a36',
    'Modern Accessible Apartment in South Brisbane',
    'Stunning ground floor apartment designed for maximum accessibility and comfort. Features open plan living, wide doorways, and a private courtyard. Close to hospitals and public transport.',
    650,
    2600,
    '2025-05-01',
    2,
    2,
    1,
    'Apartment',
    'high_physical_support',
    ST_SetSRID(ST_MakePoint(153.0251, -27.4698), 4326),
    '123 Grey Street',
    'South Brisbane',
    'QLD',
    '4101',
    ARRAY['Air Conditioning', 'Security System', 'NBN Ready', 'Intercom', 'Storage Cage'],
    ARRAY['Ceiling Hoists', 'Height Adjustable Benches', 'Wide Doorways', 'Level Access Shower', 'Emergency Power Backup'],
    ARRAY['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000', 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1000'],
    'https://my.matterport.com/show/?m=example',
    true,
    true
  ),
  (
    'e2f56789-c34d-5e67-8f90-1a2b3c4d5e6f',
    'Accessible Villa in Chatswood',
    'Beautiful villa in quiet neighborhood with full accessibility features. Modern design meets functionality with smart home integration.',
    750,
    3000,
    '2025-04-15',
    3,
    2,
    2,
    'Villa',
    'fully_accessible',
    ST_SetSRID(ST_MakePoint(151.1829, -33.7969), 4326),
    '45 Albert Avenue',
    'Chatswood',
    'NSW',
    '2067',
    ARRAY['Smart Home System', 'Garden', 'Solar Panels', 'Double Garage', 'Ducted AC'],
    ARRAY['Automated Doors', 'Voice Controls', 'Accessible Kitchen', 'Roll-in Shower', 'Wide Hallways'],
    ARRAY['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1000', 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1000'],
    'https://my.matterport.com/show/?m=example2',
    true,
    true
  ),
  (
    'f3g67890-d45e-6f78-9012-3b4c5d6e7f89',
    'Beachside Accessible Home',
    'Stunning beachfront property with full accessibility features and amazing ocean views. Perfect for those who love coastal living.',
    850,
    3400,
    '2025-06-01',
    4,
    3,
    2,
    'House',
    'improved_livability',
    ST_SetSRID(ST_MakePoint(153.4538, -28.0167), 4326),
    '78 Marine Parade',
    'Gold Coast',
    'QLD',
    '4217',
    ARRAY['Ocean Views', 'Pool', 'Beach Access', 'Security System', 'Solar Power'],
    ARRAY['Ramps', 'Pool Lift', 'Accessible Bathroom', 'Wide Doorways', 'Level Flooring'],
    ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1000'],
    null,
    false,
    true
  ),
  (
    'd1eef850-b62a-4b80-9d96-3c07c1642a36',
    'Inner City Accessible Living',
    'Modern apartment in the heart of Melbourne with state-of-the-art accessibility features and stunning city views.',
    700,
    2800,
    '2025-05-15',
    2,
    2,
    1,
    'Apartment',
    'high_physical_support',
    ST_SetSRID(ST_MakePoint(144.9631, -37.8136), 4326),
    '567 Collins Street',
    'Melbourne',
    'VIC',
    '3000',
    ARRAY['City Views', 'Gym Access', '24/7 Security', 'NBN Ready', 'Storage'],
    ARRAY['Ceiling Hoists', 'Automated Blinds', 'Height-Adjustable Kitchen', 'Emergency Call System', 'Wide Corridors'],
    ARRAY['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000'],
    'https://my.matterport.com/show/?m=example3',
    false,
    true
  ),
  (
    'e2f56789-c34d-5e67-8f90-1a2b3c4d5e6f',
    'Peaceful Garden Retreat',
    'Tranquil home with beautiful gardens and full accessibility features. Perfect for nature lovers who need extra support.',
    600,
    2400,
    '2025-04-20',
    3,
    2,
    2,
    'House',
    'robust',
    ST_SetSRID(ST_MakePoint(152.9545, -27.4705), 4326),
    '23 Peaceful Lane',
    'Paddington',
    'QLD',
    '4064',
    ARRAY['Garden', 'Quiet Location', 'Solar Power', 'Water Tank', 'Security'],
    ARRAY['Reinforced Walls', 'Impact Resistant', 'Safe Room', 'Wide Doorways', 'Non-slip Flooring'],
    ARRAY['https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1000'],
    null,
    true,
    true
  ),
  (
    'f3g67890-d45e-6f78-9012-3b4c5d6e7f89',
    'Riverside Accessible Haven',
    'Beautiful riverside property with full accessibility features and amazing water views. Close to amenities and transport.',
    780,
    3120,
    '2025-05-10',
    3,
    2,
    2,
    'House',
    'fully_accessible',
    ST_SetSRID(ST_MakePoint(115.8613, -31.9522), 4326),
    '89 Riverside Drive',
    'Perth',
    'WA',
    '6000',
    ARRAY['River Views', 'Private Jetty', 'Solar Panels', 'Security System', 'Garden'],
    ARRAY['Ceiling Hoists', 'Automated Doors', 'Height-Adjustable Kitchen', 'Accessible Bathroom', 'Wide Pathways'],
    ARRAY['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1000'],
    'https://my.matterport.com/show/?m=example4',
    true,
    true
  ),
  (
    'd1eef850-b62a-4b80-9d96-3c07c1642a36',
    'Mountain View Retreat',
    'Peaceful mountain property with stunning views and full accessibility features. Perfect for those seeking tranquility.',
    550,
    2200,
    '2025-06-15',
    2,
    1,
    1,
    'Villa',
    'improved_livability',
    ST_SetSRID(ST_MakePoint(150.3444, -33.7081), 4326),
    '45 Mountain Road',
    'Katoomba',
    'NSW',
    '2780',
    ARRAY['Mountain Views', 'Fireplace', 'Garden', 'NBN Ready', 'Heating'],
    ARRAY['Ramps', 'Wide Doorways', 'Accessible Bathroom', 'Non-slip Flooring', 'Handrails'],
    ARRAY['https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1000'],
    null,
    true,
    true
  ),
  (
    'e2f56789-c34d-5e67-8f90-1a2b3c4d5e6f',
    'Coastal Living Paradise',
    'Modern beachside apartment with full accessibility features and ocean views. Perfect for coastal lifestyle lovers.',
    820,
    3280,
    '2025-07-01',
    3,
    2,
    2,
    'Apartment',
    'high_physical_support',
    ST_SetSRID(ST_MakePoint(151.2893, -33.8688), 4326),
    '123 Beach Road',
    'Bondi',
    'NSW',
    '2026',
    ARRAY['Ocean Views', 'Pool', 'Gym', 'Security', 'BBQ Area'],
    ARRAY['Ceiling Hoists', 'Emergency Power', 'Height-Adjustable Kitchen', 'Smart Home System', 'Wide Doorways'],
    ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000'],
    'https://my.matterport.com/show/?m=example5',
    false,
    true
  ),
  (
    'f3g67890-d45e-6f78-9012-3b4c5d6e7f89',
    'Suburban Sanctuary',
    'Peaceful suburban home with excellent accessibility features and beautiful garden. Close to shops and transport.',
    580,
    2320,
    '2025-05-20',
    3,
    2,
    1,
    'House',
    'basic',
    ST_SetSRID(ST_MakePoint(138.6007, -34.9285), 4326),
    '67 Quiet Street',
    'Adelaide',
    'SA',
    '5000',
    ARRAY['Garden', 'Solar Panels', 'NBN Ready', 'Storage', 'Carport'],
    ARRAY['Wide Doorways', 'Accessible Bathroom', 'Level Access', 'Good Lighting', 'Non-slip Flooring'],
    ARRAY['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1000'],
    null,
    true,
    true
  ),
  (
    'd1eef850-b62a-4b80-9d96-3c07c1642a36',
    'City Edge Apartment',
    'Modern apartment on the city fringe with excellent accessibility features and city views. Close to everything.',
    690,
    2760,
    '2025-06-10',
    2,
    2,
    1,
    'Apartment',
    'fully_accessible',
    ST_SetSRID(ST_MakePoint(144.9631, -37.8136), 4326),
    '89 City Road',
    'Southbank',
    'VIC',
    '3006',
    ARRAY['City Views', 'Security', 'Pool', 'Gym', 'Storage'],
    ARRAY['Ceiling Hoists', 'Smart Home', 'Height-Adjustable Kitchen', 'Wide Doorways', 'Emergency System'],
    ARRAY['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000'],
    'https://my.matterport.com/show/?m=example6',
    false,
    true
  ),
  (
    'e2f56789-c34d-5e67-8f90-1a2b3c4d5e6f',
    'Parkside Living',
    'Beautiful home overlooking parklands with full accessibility features. Perfect for nature lovers.',
    630,
    2520,
    '2025-07-15',
    3,
    2,
    2,
    'House',
    'improved_livability',
    ST_SetSRID(ST_MakePoint(153.0251, -27.4698), 4326),
    '45 Park Avenue',
    'New Farm',
    'QLD',
    '4005',
    ARRAY['Park Views', 'Garden', 'Solar Power', 'Security', 'Storage'],
    ARRAY['Ramps', 'Wide Doorways', 'Accessible Bathroom', 'Level Access', 'Good Lighting'],
    ARRAY['https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1000'],
    null,
    true,
    true
  ),
  (
    'f3g67890-d45e-6f78-9012-3b4c5d6e7f89',
    'Harbourside Haven',
    'Luxurious apartment with harbour views and top-tier accessibility features. Premium location.',
    900,
    3600,
    '2025-08-01',
    3,
    2,
    2,
    'Apartment',
    'high_physical_support',
    ST_SetSRID(ST_MakePoint(151.2093, -33.8688), 4326),
    '123 Harbour Street',
    'Sydney',
    'NSW',
    '2000',
    ARRAY['Harbour Views', 'Concierge', 'Pool', 'Gym', 'Security'],
    ARRAY['Ceiling Hoists', 'Smart Home', 'Height-Adjustable Kitchen', 'Emergency System', 'Wide Doorways'],
    ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000'],
    'https://my.matterport.com/show/?m=example7',
    false,
    true
  ),
  (
    'd1eef850-b62a-4b80-9d96-3c07c1642a36',
    'Garden Oasis',
    'Peaceful garden apartment with excellent accessibility features. Perfect for those who love nature.',
    570,
    2280,
    '2025-06-20',
    2,
    1,
    1,
    'Apartment',
    'basic',
    ST_SetSRID(ST_MakePoint(145.0166, -37.8257), 4326),
    '45 Garden Street',
    'Richmond',
    'VIC',
    '3121',
    ARRAY['Garden', 'BBQ Area', 'Security', 'Storage', 'NBN Ready'],
    ARRAY['Wide Doorways', 'Accessible Bathroom', 'Level Access', 'Good Lighting', 'Non-slip Flooring'],
    ARRAY['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1000'],
    null,
    true,
    true
  ),
  (
    'e2f56789-c34d-5e67-8f90-1a2b3c4d5e6f',
    'Lakeside Living',
    'Beautiful lakeside property with full accessibility features and stunning water views.',
    680,
    2720,
    '2025-07-10',
    3,
    2,
    2,
    'House',
    'fully_accessible',
    ST_SetSRID(ST_MakePoint(149.1300, -35.2809), 4326),
    '89 Lake Road',
    'Canberra',
    'ACT',
    '2600',
    ARRAY['Lake Views', 'Garden', 'Solar Power', 'Security', 'Double Garage'],
    ARRAY['Ceiling Hoists', 'Smart Home', 'Height-Adjustable Kitchen', 'Wide Doorways', 'Emergency System'],
    ARRAY['https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1000'],
    'https://my.matterport.com/show/?m=example8',
    true,
    true
  ),
  (
    'f3g67890-d45e-6f78-9012-3b4c5d6e7f89',
    'Forest Retreat',
    'Peaceful forest property with excellent accessibility features. Perfect for nature lovers.',
    540,
    2160,
    '2025-08-15',
    2,
    1,
    1,
    'Villa',
    'improved_livability',
    ST_SetSRID(ST_MakePoint(152.9545, -27.4705), 4326),
    '123 Forest Road',
    'The Gap',
    'QLD',
    '4061',
    ARRAY['Forest Views', 'Garden', 'Solar Power', 'Security', 'Carport'],
    ARRAY['Ramps', 'Wide Doorways', 'Accessible Bathroom', 'Level Access', 'Good Lighting'],
    ARRAY['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1000'],
    null,
    true,
    true
  );