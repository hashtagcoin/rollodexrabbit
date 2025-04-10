SELECT
    c.relname AS table_name,
    CASE c.relpersistence
        WHEN 'p' THEN 'permanent'
        WHEN 't' THEN 'temporary'
        WHEN 'u' THEN 'unlogged'
    END AS persistence,
    pg_size_pretty(pg_relation_size(c.oid)) AS table_size,
    pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size_with_indexes,
    c.reltuples::bigint AS approximate_row_count,
    c.reloptions AS storage_parameters
FROM
    pg_class c
JOIN
    pg_namespace n ON c.relnamespace = n.oid
WHERE
    n.nspname = 'public' AND
    c.relkind = 'r'
ORDER BY
    table_name;