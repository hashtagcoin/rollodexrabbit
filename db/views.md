# Database Views

This file lists all views defined in the Rollodex database. Views are virtual tables based on the result set of SQL statements that simplify complex queries, combine data from multiple tables, and provide a layer of abstraction.

## Key Information:
- **view_name**: The name of the database view
- **view_definition**: The SQL query that defines the view

## Critical Views for Friends and Chat Features:

### friendships_with_profiles
This view is critical for the Friends feature as it joins the `friendships` table with `user_profiles` to provide complete friend information including:
- Basic friendship data (id, status, category)
- Friend's name, avatar, and role
- User's name and avatar

This view already exists in the database and solves the problem mentioned in the summary document about needing to create proper joins between friendships and user profiles.

### Other Important Views
- **posts_with_users**: Used for social media content display
- **bookings_with_details**: Used for service booking information

When implementing the Friends list functionality, you should query the `friendships_with_profiles` view directly rather than performing complex joins in application code.

[
  {
    "view_name": "bookings_with_details",
    "view_definition": " SELECT sb.id,\n    sb.user_id,\n    sb.service_id,\n    sb.scheduled_at,\n    sb.total_price,\n    sb.ndis_covered_amount,\n    sb.gap_payment,\n    sb.notes,\n    sb.status,\n    sb.created_at,\n    up.full_name AS user_full_name,\n    up.username AS user_username,\n    s.title AS service_title,\n    s.provider_id,\n    sp.business_name AS provider_business_name,\n    sp.service_area AS provider_service_area,\n    sp.logo_url AS provider_logo_url,\n    up.ndis_number,\n    up.ndis_verified\n   FROM (((service_bookings sb\n     JOIN user_profiles up ON ((sb.user_id = up.id)))\n     JOIN services s ON ((sb.service_id = s.id)))\n     JOIN service_providers sp ON ((s.provider_id = sp.id)));"
  },
  {
    "view_name": "friendships_with_profiles",
    "view_definition": " SELECT f.id,\n    f.user_id,\n    f.friend_id,\n    f.status,\n    f.category,\n    f.created_at,\n    friend.full_name AS friend_name,\n    friend.avatar_url AS friend_avatar,\n    friend.role AS friend_role,\n    user_profile.full_name AS user_name,\n    user_profile.avatar_url AS user_avatar\n   FROM ((friendships f\n     JOIN user_profiles friend ON ((f.friend_id = friend.id)))\n     JOIN user_profiles user_profile ON ((f.user_id = user_profile.id)));"
  },
  {
    "view_name": "geography_columns",
    "view_definition": null
  },
  {
    "view_name": "geometry_columns",
    "view_definition": null
  },
  {
    "view_name": "posts_with_users",
    "view_definition": " SELECT p.id,\n    p.caption,\n    p.media_urls,\n    p.created_at,\n    p.user_id,\n    up.full_name,\n    up.avatar_url,\n    ( SELECT count(*) AS count\n           FROM post_likes pl\n          WHERE (pl.post_id = p.id)) AS likes_count,\n    ( SELECT count(*) AS count\n           FROM comments c\n          WHERE (c.post_id = p.id)) AS comments_count\n   FROM (posts p\n     LEFT JOIN user_profiles up ON ((p.user_id = up.id)));"
  },
  {
    "view_name": "provider_financial_summary",
    "view_definition": " SELECT s.provider_id,\n    count(sb.id) AS total_bookings,\n    count(\n        CASE\n            WHEN (sb.status = 'completed'::text) THEN 1\n            ELSE NULL::integer\n        END) AS completed_bookings,\n    count(\n        CASE\n            WHEN (sb.status = 'pending'::text) THEN 1\n            ELSE NULL::integer\n        END) AS pending_bookings,\n    count(\n        CASE\n            WHEN (sb.status = 'confirmed'::text) THEN 1\n            ELSE NULL::integer\n        END) AS confirmed_bookings,\n    sum(\n        CASE\n            WHEN (sb.status = 'completed'::text) THEN sb.total_price\n            ELSE (0)::numeric\n        END) AS total_revenue,\n    sum(\n        CASE\n            WHEN (sb.status = 'completed'::text) THEN sb.ndis_covered_amount\n            ELSE (0)::numeric\n        END) AS ndis_revenue,\n    sum(\n        CASE\n            WHEN (sb.status = 'completed'::text) THEN sb.gap_payment\n            ELSE (0)::numeric\n        END) AS non_ndis_revenue,\n    sum(\n        CASE\n            WHEN (sb.status = 'pending'::text) THEN sb.total_price\n            ELSE (0)::numeric\n        END) AS pending_revenue,\n    sum(\n        CASE\n            WHEN (sb.status = 'confirmed'::text) THEN sb.total_price\n            ELSE (0)::numeric\n        END) AS upcoming_revenue\n   FROM (services s\n     LEFT JOIN service_bookings sb ON ((s.id = sb.service_id)))\n  GROUP BY s.provider_id;"
  }
]