# Database Unique Constraints

This file contains the SQL query to retrieve all unique constraints defined in the Rollodex database. Unique constraints ensure that values in specified columns or combinations of columns occur only once in a table, preventing duplicate data.

## Query Purpose:
This query fetches unique constraints from `information_schema.table_constraints` and joins with `information_schema.key_column_usage` to retrieve the column names involved in each constraint.

## Query Information Returned:
- **table_schema**: The schema where the table resides (public)
- **table_name**: The name of the database table with the constraint
- **constraint_name**: The name of the unique constraint
- **column_name**: The column(s) that must contain unique values

## Importance for Friends and Chat Features:
Unique constraints may exist for:
- Preventing duplicate friendship relationships
- Ensuring users don't join the same chat conversation multiple times
- Enforcing one-to-one relationships in certain scenarios

Run this query in Supabase SQL Editor to see the complete list of unique constraints.

SELECT
    tc.table_schema, 
    tc.table_name, 
    tc.constraint_name, 
    kcu.column_name
FROM 
    information_schema.table_constraints tc
JOIN 
    information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE 
    tc.constraint_type = 'UNIQUE' AND
    tc.table_schema = 'public'
ORDER BY 
    tc.table_schema,
    tc.table_name;