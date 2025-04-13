# Housing Groups Feature

## Database Tables

### housing_groups
Stores information about groups of users interested in a specific housing listing.

```json
{
  "table_name": "housing_groups",
  "column_name": "id",
  "data_type": "uuid",
  "is_nullable": "NO",
  "column_default": "gen_random_uuid()",
  "ordinal_position": 1
}
```

```json
{
  "table_name": "housing_groups",
  "column_name": "listing_id",
  "data_type": "uuid",
  "is_nullable": "YES",
  "column_default": null,
  "ordinal_position": 2
}
```

### housing_group_members
Tracks individual members of housing groups.

```json
{
  "table_name": "housing_group_members",
  "column_name": "id",
  "data_type": "uuid",
  "is_nullable": "NO",
  "column_default": "gen_random_uuid()",
  "ordinal_position": 1
}
```

```json
{
  "table_name": "housing_group_members",
  "column_name": "group_id",
  "data_type": "uuid",
  "is_nullable": "YES",
  "column_default": null,
  "ordinal_position": 2
}
```

```json
{
  "table_name": "housing_group_members",
  "column_name": "user_id",
  "data_type": "uuid",
  "is_nullable": "YES",
  "column_default": null,
  "ordinal_position": 3
}
```

## Implementation Details

### Querying Housing Groups
When displaying housing listings, the application queries the housing_groups table to determine if a listing has an associated group. This enables the display of "Group Match" badges on listings.

```typescript
// Example query to check if a listing has a housing group
const { data, error } = await supabase
  .from('housing_groups')
  .select('id')
  .eq('listing_id', listingId)
  .limit(1);

// A housing group exists if data contains at least one record
const hasHousingGroup = data && data.length > 0;
```

### Batch Processing
For efficiency, when loading multiple housing listings, the application uses batch processing to query housing groups:

```typescript
// Process in smaller batches to avoid query limits
const BATCH_SIZE = 30;
for (let i = 0; i < listingIds.length; i += BATCH_SIZE) {
  const batchIds = listingIds.slice(i, i + BATCH_SIZE);
  
  const { data, error } = await supabase
    .from('housing_groups')
    .select('id, listing_id')
    .in('listing_id', batchIds);
  
  // Process results...
}
```

## UI Integration

### Group Match Badge
Housing listings with associated groups display a "Group Match" badge in the UI:

- Position: Top right corner of the listing image
- Appearance: Semi-transparent green background (80% opacity) with "Group Match" text
- Icons: Uses the Users icon from Lucide React Native

### Display Modes
The Group Match badge is visible in all view modes:
- Grid view (main discovery screen)
- List view (alternative discovery layout)
- Swipe view (card-based browsing)

## Error Handling

The implementation includes robust error handling for database queries:
- Graceful handling of database connection errors
- Fallback to empty results when queries fail
- Console logging for debugging purposes
- State management to prevent UI glitches

## Performance Considerations

- Batch processing limits the number of listings in each query to avoid hitting API limits
- Housing group data is preloaded when housing listings are fetched
- Client-side caching of housing group status to minimize repeated queries
