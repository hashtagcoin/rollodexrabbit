# Housing Module Enhancement Documentation

## Overview

This document outlines the Housing Module Enhancement implemented in April 2025. This enhancement focuses on improving the housing listing functionality with advanced search capabilities, accessibility features, virtual tour functionality, and co-living group features.

## Key Features Implemented

### Database Enhancements

1. **Extended Housing Listings**
   - Added accessibility rating (1-5 scale)
   - Added SDA certification tracking
   - Added virtual tour support flags

2. **New Tables**
   - `detailed_accessibility_features`: Granular accessibility features for each property
   - `housing_images`: Multiple images per property with categorization
   - `virtual_tours`: 360° panoramic tour data with hotspots
   - `saved_housing_listings`: User favorites functionality
   - `housing_inquiries`: Q&A system for properties
   - `housing_groups`: Co-living groups for shared housing opportunities
   - `housing_group_members`: Members of co-living groups with profile information

3. **Security**
   - Row Level Security policies for all new tables
   - Fine-grained access control based on user roles

### Frontend Enhancements

1. **Advanced Search & Filtering**
   - Accessibility feature filtering
   - SDA certification filtering
   - Multi-parameter search capabilities
   - Saved listings filter
   - "Group Match" indicators for properties with co-living opportunities

2. **Detail View Improvements**
   - Multiple image gallery
   - Detailed accessibility information
   - SDA certification badge
   - Save/favorite functionality
   - Direct inquiry system
   - Co-living group profiles and joining options

3. **Virtual Tour Functionality**
   - Interactive 360° panorama viewer
   - Room-to-room navigation via hotspots
   - Multi-room tour support
   - Mobile-optimized UI

4. **Group Living Features**
   - Group profiles with member information
   - Support level indicators (light, moderate, high)
   - Request to join group functionality
   - Member trait visualization
   - Dedicated group viewer screen

5. **Co-Living Group Creation**
   - Interface to create a group for shared housing
   - Specify roommate preferences (gender, support needs, move-in timeline)
   - Invite friends to join the group
   - View other users' groups for the same property

## Housing Module Components

### Screens
- **Housing Listings**: Main screen showing all available housing listings
- **Housing Detail**: Detailed view of a specific housing listing
- **Housing Application**: Form to apply for a housing listing
- **Co-Living Group Creation**: Interface to create a group for shared housing
- **Housing Group Detail**: View and interact with a housing group

### Co-Living Groups Feature

The co-living groups feature allows users to:
- Create groups tied to specific housing listings
- Specify roommate preferences (gender, support needs, move-in timeline)
- Invite friends to join the group
- View other users' groups for the same property

#### Co-Living Group Creation Flow
1. User views a housing listing detail
2. User clicks "Create Group" button
3. User is taken to dedicated co-living creation screen showing:
   - The property they're applying for
   - Their bio information
   - Preference selectors for roommate matching
   - Option to invite friends
4. Upon submission, a housing group is created in the database with the user as admin

#### Database Tables
The co-living feature uses these tables:
- `housing_groups`: Stores group metadata and listing associations
- `housing_group_members`: Tracks members, preferences, and status
- `housing_group_invites`: Manages invitations to join groups

## Technical Implementation

### Database Schema

```sql
-- Key tables and their relationships
housing_listings
  ↓
  ├── detailed_accessibility_features
  ├── housing_images
  ├── virtual_tours
  ├── saved_housing_listings (← user_id)
  ├── housing_inquiries (← user_id)
  └── housing_groups
       └── housing_group_members (← user_id)
```

### Component Structure

```
app/(tabs)/housing/
  ├── index.tsx        # Listing screen with advanced filters
  ├── [id].tsx         # Detail view with gallery and virtual tour
  ├── apply.tsx        # Application form
  └── inquiry.tsx      # Property inquiry form

app/housing/
  └── group/
       └── [id].tsx    # Group living details and join request page
       └── create.tsx  # Co-living group creation screen

components/
  ├── VirtualTourViewer.tsx  # Reusable 360° panorama viewer
  └── AppHeader.tsx          # Consistent header across all screens
```

### Key Functions

- `get_housing_listing_details`: Retrieves complete property information
- `ensure_single_primary_image`: Ensures only one primary image per listing
- `update_virtual_tour_status`: Maintains virtual tour flags on listings
- `housing_groups_with_members`: Denormalized view for efficient group data retrieval
- `create_co_living_group`: Creates a new co-living group with user as admin

## User Experience Flow

1. **Discovery**
   - User browses listings with advanced filters
   - Accessibility features highlighted with visual indicators
   - "Group Match" badge displayed for properties with co-living opportunities

2. **Details & Virtual Tour**
   - User views detailed property information
   - Browses multiple property images
   - Explores virtual tour if available
   - Saves favorite properties
   - Views co-living group details if available

3. **Co-living Groups**
   - User can view group profiles with member information
   - See support level needs of current members
   - Request to join existing groups
   - Message group members
   - Create a new co-living group for a property

4. **Inquiry & Application**
   - User sends inquiry about specific questions
   - Or proceeds directly to application process
   - Provider receives notifications about user interest

## Testing

Each enhancement has been tested for:
- Proper data storage and retrieval
- UI responsiveness on various screen sizes
- Proper error handling with fallbacks
- TypeScript type safety and error prevention

## Future Improvements

- AI-powered property recommendations based on accessibility needs
- Integration with map view for location-based search
- Enhanced virtual tour capabilities with video and audio
- Community reviews and ratings for housing options

## References

- [Database Schema](../future/database-schema.md)
- [Technical Architecture](../future/technical-architecture.md)
- [Development Guide](../future/development-guide.md)
