# Database Functions and Procedures

This file lists all stored functions and procedures in the Rollodex database. Functions encapsulate complex logic in the database that can be called from SQL queries or triggered by database events.

## Key Information:
- **function_name**: The name of the function or procedure
- **argument_data_types**: The parameters accepted by the function
- **return_type**: The data type returned by the function
- **function_definition**: The actual SQL/PL/pgSQL code that defines the function
- **function_type**: Whether it's a function, procedure, aggregate, or window function

## Key Functions for the Application:
- **book_service**: Manages the service booking process
- **award_booking_milestone_badge**: Triggers badge awards based on booking milestones
- Various reward and point management functions

## Note for Friends and Chat Features:
The database currently lacks specific functions for managing friend relationships or chat operations. When implementing these features, you may need to create functions for:
- Friend request management
- Chat message delivery
- Chat participant management

These functions would help ensure that business logic is consistent across all application components.

[
  {
    "function_name": "_postgis_deprecate",
    "argument_data_types": "oldname text, newname text, version text",
    "return_type": "void",
    "function_definition": "\nDECLARE\n  curver_text text;\nBEGIN\n  --\n  -- Raises a NOTICE if it was deprecated in this version,\n  -- a WARNING if in a previous version (only up to minor version checked)\n  --\n\tcurver_text := '3.3.7';\n\tIF pg_catalog.split_part(curver_text,'.',1)::int > pg_catalog.split_part(version,'.',1)::int OR\n\t   ( pg_catalog.split_part(curver_text,'.',1) = pg_catalog.split_part(version,'.',1) AND\n\t\t pg_catalog.split_part(curver_text,'.',2) != split_part(version,'.',2) )\n\tTHEN\n\t  RAISE WARNING '% signature was deprecated in %. Please use %', oldname, version, newname;\n\tELSE\n\t  RAISE DEBUG '% signature was deprecated in %. Please use %', oldname, version, newname;\n\tEND IF;\nEND;\n",
    "function_type": "function"
  },
  {
    "function_name": "_postgis_index_extent",
    "argument_data_types": "tbl regclass, col text",
    "return_type": "box2d",
    "function_definition": "_postgis_gserialized_index_extent",
    "function_type": "function"
  },
  {
    "function_name": "_postgis_join_selectivity",
    "argument_data_types": "regclass, text, regclass, text, text DEFAULT '2'::text",
    "return_type": "float8",
    "function_definition": "_postgis_gserialized_joinsel",
    "function_type": "function"
  },
  {
    "function_name": "_postgis_pgsql_version",
    "argument_data_types": "",
    "return_type": "text",
    "function_definition": "\n\tSELECT CASE WHEN pg_catalog.split_part(s,'.',1)::integer > 9 THEN pg_catalog.split_part(s,'.',1) || '0'\n\tELSE pg_catalog.split_part(s,'.', 1) || pg_catalog.split_part(s,'.', 2) END AS v\n\tFROM pg_catalog.substring(version(), E'PostgreSQL ([0-9\\\\.]+)') AS s;\n",
    "function_type": "function"
  },
  {
    "function_name": "_postgis_scripts_pgsql_version",
    "argument_data_types": "",
    "return_type": "text",
    "function_definition": "SELECT '150'::text AS version",
    "function_type": "function"
  },
  {
    "function_name": "_postgis_selectivity",
    "argument_data_types": "tbl regclass, att_name text, geom geometry, mode text DEFAULT '2'::text",
    "return_type": "float8",
    "function_definition": "_postgis_gserialized_sel",
    "function_type": "function"
  },
  {
    "function_name": "_postgis_stats",
    "argument_data_types": "tbl regclass, att_name text, text DEFAULT '2'::text",
    "return_type": "text",
    "function_definition": "_postgis_gserialized_stats",
    "function_type": "function"
  },
  {
    "function_name": "_st_3ddfullywithin",
    "argument_data_types": "geom1 geometry, geom2 geometry, double precision",
    "return_type": "bool",
    "function_definition": "LWGEOM_dfullywithin3d",
    "function_type": "function"
  },
  {
    "function_name": "_st_3ddwithin",
    "argument_data_types": "geom1 geometry, geom2 geometry, double precision",
    "return_type": "bool",
    "function_definition": "LWGEOM_dwithin3d",
    "function_type": "function"
  },
  {
    "function_name": "_st_3dintersects",
    "argument_data_types": "geom1 geometry, geom2 geometry",
    "return_type": "bool",
    "function_definition": "ST_3DIntersects",
    "function_type": "function"
  },
  {
    "function_name": "_st_asgml",
    "argument_data_types": "integer, geometry, integer, integer, text, text",
    "return_type": "text",
    "function_definition": "LWGEOM_asGML",
    "function_type": "function"
  },
  {
    "function_name": "_st_asx3d",
    "argument_data_types": "integer, geometry, integer, integer, text",
    "return_type": "text",
    "function_definition": "LWGEOM_asX3D",
    "function_type": "function"
  },
  {
    "function_name": "_st_bestsrid",
    "argument_data_types": "geography",
    "return_type": "int4",
    "function_definition": "geography_bestsrid",
    "function_type": "function"
  },
  {
    "function_name": "_st_bestsrid",
    "argument_data_types": "geography, geography",
    "return_type": "int4",
    "function_definition": "geography_bestsrid",
    "function_type": "function"
  },
  {
    "function_name": "_st_contains",
    "argument_data_types": "geom1 geometry, geom2 geometry",
    "return_type": "bool",
    "function_definition": "contains",
    "function_type": "function"
  },
  {
    "function_name": "_st_containsproperly",
    "argument_data_types": "geom1 geometry, geom2 geometry",
    "return_type": "bool",
    "function_definition": "containsproperly",
    "function_type": "function"
  },
  {
    "function_name": "_st_coveredby",
    "argument_data_types": "geom1 geometry, geom2 geometry",
    "return_type": "bool",
    "function_definition": "coveredby",
    "function_type": "function"
  },
  {
    "function_name": "_st_coveredby",
    "argument_data_types": "geog1 geography, geog2 geography",
    "return_type": "bool",
    "function_definition": "geography_coveredby",
    "function_type": "function"
  },
  {
    "function_name": "_st_covers",
    "argument_data_types": "geom1 geometry, geom2 geometry",
    "return_type": "bool",
    "function_definition": "covers",
    "function_type": "function"
  },
  {
    "function_name": "_st_covers",
    "argument_data_types": "geog1 geography, geog2 geography",
    "return_type": "bool",
    "function_definition": "geography_covers",
    "function_type": "function"
  },
  {
    "function_name": "_st_crosses",
    "argument_data_types": "geom1 geometry, geom2 geometry",
    "return_type": "bool",
    "function_definition": "crosses",
    "function_type": "function"
  },
  {
    "function_name": "_st_dfullywithin",
    "argument_data_types": "geom1 geometry, geom2 geometry, double precision",
    "return_type": "bool",
    "function_definition": "LWGEOM_dfullywithin",
    "function_type": "function"
  },
  {
    "function_name": "_st_distancetree",
    "argument_data_types": "geography, geography",
    "return_type": "float8",
    "function_definition": "SELECT public._ST_DistanceTree($1, $2, 0.0, true)",
    "function_type": "function"
  },
  {
    "function_name": "_st_distancetree",
    "argument_data_types": "geography, geography, double precision, boolean",
    "return_type": "float8",
    "function_definition": "geography_distance_tree",
    "function_type": "function"
  },
  {
    "function_name": "_st_distanceuncached",
    "argument_data_types": "geography, geography",
    "return_type": "float8",
    "function_definition": "SELECT public._ST_DistanceUnCached($1, $2, 0.0, true)",
    "function_type": "function"
  },
  {
    "function_name": "_st_distanceuncached",
    "argument_data_types": "geography, geography, boolean",
    "return_type": "float8",
    "function_definition": "SELECT public._ST_DistanceUnCached($1, $2, 0.0, $3)",
    "function_type": "function"
  },
  {
    "function_name": "_st_distanceuncached",
    "argument_data_types": "geography, geography, double precision, boolean",
    "return_type": "float8",
    "function_definition": "geography_distance_uncached",
    "function_type": "function"
  },
  {
    "function_name": "_st_dwithin",
    "argument_data_types": "geom1 geometry, geom2 geometry, double precision",
    "return_type": "bool",
    "function_definition": "LWGEOM_dwithin",
    "function_type": "function"
  },
  {
    "function_name": "_st_dwithin",
    "argument_data_types": "geog1 geography, geog2 geography, tolerance double precision, use_spheroid boolean DEFAULT true",
    "return_type": "bool",
    "function_definition": "geography_dwithin",
    "function_type": "function"
  },
  {
    "function_name": "_st_dwithinuncached",
    "argument_data_types": "geography, geography, double precision",
    "return_type": "bool",
    "function_definition": "SELECT $1 OPERATOR(public.&&) public._ST_Expand($2,$3) AND $2 OPERATOR(public.&&) public._ST_Expand($1,$3) AND public._ST_DWithinUnCached($1, $2, $3, true)",
    "function_type": "function"
  },
  {
    "function_name": "_st_dwithinuncached",
    "argument_data_types": "geography, geography, double precision, boolean",
    "return_type": "bool",
    "function_definition": "geography_dwithin_uncached",
    "function_type": "function"
  },
  {
    "function_name": "_st_equals",
    "argument_data_types": "geom1 geometry, geom2 geometry",
    "return_type": "bool",
    "function_definition": "ST_Equals",
    "function_type": "function"
  },
  {
    "function_name": "_st_expand",
    "argument_data_types": "geography, double precision",
    "return_type": "geography",
    "function_definition": "geography_expand",
    "function_type": "function"
  },
  {
    "function_name": "_st_geomfromgml",
    "argument_data_types": "text, integer",
    "return_type": "geometry",
    "function_definition": "geom_from_gml",
    "function_type": "function"
  },
  {
    "function_name": "_st_intersects",
    "argument_data_types": "geom1 geometry, geom2 geometry",
    "return_type": "bool",
    "function_definition": "ST_Intersects",
    "function_type": "function"
  },
  {
    "function_name": "_st_linecrossingdirection",
    "argument_data_types": "line1 geometry, line2 geometry",
    "return_type": "int4",
    "function_definition": "ST_LineCrossingDirection",
    "function_type": "function"
  },
  {
    "function_name": "_st_longestline",
    "argument_data_types": "geom1 geometry, geom2 geometry",
    "return_type": "geometry",
    "function_definition": "LWGEOM_longestline2d",
    "function_type": "function"
  },
  {
    "function_name": "_st_maxdistance",
    "argument_data_types": "geom1 geometry, geom2 geometry",
    "return_type": "float8",
    "function_definition": "LWGEOM_maxdistance2d_linestring",
    "function_type": "function"
  },
  {
    "function_name": "_st_orderingequals",
    "argument_data_types": "geom1 geometry, geom2 geometry",
    "return_type": "bool",
    "function_definition": "LWGEOM_same",
    "function_type": "function"
  },
  {
    "function_name": "_st_overlaps",
    "argument_data_types": "geom1 geometry, geom2 geometry",
    "return_type": "bool",
    "function_definition": "overlaps",
    "function_type": "function"
  },
  {
    "function_name": "_st_pointoutside",
    "argument_data_types": "geography",
    "return_type": "geography",
    "function_definition": "geography_point_outside",
    "function_type": "function"
  },
  {
    "function_name": "_st_sortablehash",
    "argument_data_types": "geom geometry",
    "return_type": "int8",
    "function_definition": "_ST_SortableHash",
    "function_type": "function"
  },
  {
    "function_name": "_st_touches",
    "argument_data_types": "geom1 geometry, geom2 geometry",
    "return_type": "bool",
    "function_definition": "touches",
    "function_type": "function"
  },
  {
    "function_name": "_st_voronoi",
    "argument_data_types": "g1 geometry, clip geometry DEFAULT NULL::geometry, tolerance double precision DEFAULT 0.0, return_polygons boolean DEFAULT true",
    "return_type": "geometry",
    "function_definition": "ST_Voronoi",
    "function_type": "function"
  },
  {
    "function_name": "_st_within",
    "argument_data_types": "geom1 geometry, geom2 geometry",
    "return_type": "bool",
    "function_definition": "SELECT public._ST_Contains($2,$1)",
    "function_type": "function"
  },
  {
    "function_name": "addauth",
    "argument_data_types": "text",
    "return_type": "bool",
    "function_definition": "\nDECLARE\n\tlockid alias for $1;\n\tokay boolean;\n\tmyrec record;\nBEGIN\n\t-- check to see if table exists\n\t--  if not, CREATE TEMP TABLE mylock (transid xid, lockcode text)\n\tokay := 'f';\n\tFOR myrec IN SELECT * FROM pg_class WHERE relname = 'temp_lock_have_table' LOOP\n\t\tokay := 't';\n\tEND LOOP;\n\tIF (okay <> 't') THEN\n\t\tCREATE TEMP TABLE temp_lock_have_table (transid xid, lockcode text);\n\t\t\t-- this will only work from pgsql7.4 up\n\t\t\t-- ON COMMIT DELETE ROWS;\n\tEND IF;\n\n\t--  INSERT INTO mylock VALUES ( $1)\n--\tEXECUTE 'INSERT INTO temp_lock_have_table VALUES ( '||\n--\t\tquote_literal(getTransactionID()) || ',' ||\n--\t\tquote_literal(lockid) ||')';\n\n\tINSERT INTO temp_lock_have_table VALUES (getTransactionID(), lockid);\n\n\tRETURN true::boolean;\nEND;\n",
    "function_type": "function"
  },
  {
    "function_name": "addgeometrycolumn",
    "argument_data_types": "table_name character varying, column_name character varying, new_srid integer, new_type character varying, new_dim integer, use_typmod boolean DEFAULT true",
    "return_type": "text",
    "function_definition": "\nDECLARE\n\tret  text;\nBEGIN\n\tSELECT public.AddGeometryColumn('','',$1,$2,$3,$4,$5, $6) into ret;\n\tRETURN ret;\nEND;\n",
    "function_type": "function"
  },
  {
    "function_name": "addgeometrycolumn",
    "argument_data_types": "schema_name character varying, table_name character varying, column_name character varying, new_srid integer, new_type character varying, new_dim integer, use_typmod boolean DEFAULT true",
    "return_type": "text",
    "function_definition": "\nDECLARE\n\tret  text;\nBEGIN\n\tSELECT public.AddGeometryColumn('',$1,$2,$3,$4,$5,$6,$7) into ret;\n\tRETURN ret;\nEND;\n",
    "function_type": "function"
  },
  {
    "function_name": "addgeometrycolumn",
    "argument_data_types": "catalog_name character varying, schema_name character varying, table_name character varying, column_name character varying, new_srid_in integer, new_type character varying, new_dim integer, use_typmod boolean DEFAULT true",
    "return_type": "text",
    "function_definition": "\nDECLARE\n\trec RECORD;\n\tsr varchar;\n\treal_schema name;\n\tsql text;\n\tnew_srid integer;\n\nBEGIN\n\n\t-- Verify geometry type\n\tIF (postgis_type_name(new_type,new_dim) IS NULL )\n\tTHEN\n\t\tRAISE EXCEPTION 'Invalid type name \"%(%)\" - valid ones are:\n\tPOINT, MULTIPOINT,\n\tLINESTRING, MULTILINESTRING,\n\tPOLYGON, MULTIPOLYGON,\n\tCIRCULARSTRING, COMPOUNDCURVE, MULTICURVE,\n\tCURVEPOLYGON, MULTISURFACE,\n\tGEOMETRY, GEOMETRYCOLLECTION,\n\tPOINTM, MULTIPOINTM,\n\tLINESTRINGM, MULTILINESTRINGM,\n\tPOLYGONM, MULTIPOLYGONM,\n\tCIRCULARSTRINGM, COMPOUNDCURVEM, MULTICURVEM\n\tCURVEPOLYGONM, MULTISURFACEM, TRIANGLE, TRIANGLEM,\n\tPOLYHEDRALSURFACE, POLYHEDRALSURFACEM, TIN, TINM\n\tor GEOMETRYCOLLECTIONM', new_type, new_dim;\n\t\tRETURN 'fail';\n\tEND IF;\n\n\t-- Verify dimension\n\tIF ( (new_dim >4) OR (new_dim <2) ) THEN\n\t\tRAISE EXCEPTION 'invalid dimension';\n\t\tRETURN 'fail';\n\tEND IF;\n\n\tIF ( (new_type LIKE '%M') AND (new_dim!=3) ) THEN\n\t\tRAISE EXCEPTION 'TypeM needs 3 dimensions';\n\t\tRETURN 'fail';\n\tEND IF;\n\n\t-- Verify SRID\n\tIF ( new_srid_in > 0 ) THEN\n\t\tIF new_srid_in > 998999 THEN\n\t\t\tRAISE EXCEPTION 'AddGeometryColumn() - SRID must be <= %', 998999;\n\t\tEND IF;\n\t\tnew_srid := new_srid_in;\n\t\tSELECT SRID INTO sr FROM spatial_ref_sys WHERE SRID = new_srid;\n\t\tIF NOT FOUND THEN\n\t\t\tRAISE EXCEPTION 'AddGeometryColumn() - invalid SRID';\n\t\t\tRETURN 'fail';\n\t\tEND IF;\n\tELSE\n\t\tnew_srid := public.ST_SRID('POINT EMPTY'::public.geometry);\n\t\tIF ( new_srid_in != new_srid ) THEN\n\t\t\tRAISE NOTICE 'SRID value % converted to the officially unknown SRID value %', new_srid_in, new_srid;\n\t\tEND IF;\n\tEND IF;\n\n\t-- Verify schema\n\tIF ( schema_name IS NOT NULL AND schema_name != '' ) THEN\n\t\tsql := 'SELECT nspname FROM pg_namespace ' ||\n\t\t\t'WHERE text(nspname) = ' || quote_literal(schema_name) ||\n\t\t\t'LIMIT 1';\n\t\tRAISE DEBUG '%', sql;\n\t\tEXECUTE sql INTO real_schema;\n\n\t\tIF ( real_schema IS NULL ) THEN\n\t\t\tRAISE EXCEPTION 'Schema % is not a valid schemaname', quote_literal(schema_name);\n\t\t\tRETURN 'fail';\n\t\tEND IF;\n\tEND IF;\n\n\tIF ( real_schema IS NULL ) THEN\n\t\tRAISE DEBUG 'Detecting schema';\n\t\tsql := 'SELECT n.nspname AS schemaname ' ||\n\t\t\t'FROM pg_catalog.pg_class c ' ||\n\t\t\t  'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace ' ||\n\t\t\t'WHERE c.relkind = ' || quote_literal('r') ||\n\t\t\t' AND n.nspname NOT IN (' || quote_literal('pg_catalog') || ', ' || quote_literal('pg_toast') || ')' ||\n\t\t\t' AND pg_catalog.pg_table_is_visible(c.oid)' ||\n\t\t\t' AND c.relname = ' || quote_literal(table_name);\n\t\tRAISE DEBUG '%', sql;\n\t\tEXECUTE sql INTO real_schema;\n\n\t\tIF ( real_schema IS NULL ) THEN\n\t\t\tRAISE EXCEPTION 'Table % does not occur in the search_path', quote_literal(table_name);\n\t\t\tRETURN 'fail';\n\t\tEND IF;\n\tEND IF;\n\n\t-- Add geometry column to table\n\tIF use_typmod THEN\n\t\t sql := 'ALTER TABLE ' ||\n\t\t\tquote_ident(real_schema) || '.' || quote_ident(table_name)\n\t\t\t|| ' ADD COLUMN ' || quote_ident(column_name) ||\n\t\t\t' geometry(' || public.postgis_type_name(new_type, new_dim) || ', ' || new_srid::text || ')';\n\t\tRAISE DEBUG '%', sql;\n\tELSE\n\t\tsql := 'ALTER TABLE ' ||\n\t\t\tquote_ident(real_schema) || '.' || quote_ident(table_name)\n\t\t\t|| ' ADD COLUMN ' || quote_ident(column_name) ||\n\t\t\t' geometry ';\n\t\tRAISE DEBUG '%', sql;\n\tEND IF;\n\tEXECUTE sql;\n\n\tIF NOT use_typmod THEN\n\t\t-- Add table CHECKs\n\t\tsql := 'ALTER TABLE ' ||\n\t\t\tquote_ident(real_schema) || '.' || quote_ident(table_name)\n\t\t\t|| ' ADD CONSTRAINT '\n\t\t\t|| quote_ident('enforce_srid_' || column_name)\n\t\t\t|| ' CHECK (st_srid(' || quote_ident(column_name) ||\n\t\t\t') = ' || new_srid::text || ')' ;\n\t\tRAISE DEBUG '%', sql;\n\t\tEXECUTE sql;\n\n\t\tsql := 'ALTER TABLE ' ||\n\t\t\tquote_ident(real_schema) || '.' || quote_ident(table_name)\n\t\t\t|| ' ADD CONSTRAINT '\n\t\t\t|| quote_ident('enforce_dims_' || column_name)\n\t\t\t|| ' CHECK (st_ndims(' || quote_ident(column_name) ||\n\t\t\t') = ' || new_dim::text || ')' ;\n\t\tRAISE DEBUG '%', sql;\n\t\tEXECUTE sql;\n\n\t\tIF ( NOT (new_type = 'GEOMETRY')) THEN\n\t\t\tsql := 'ALTER TABLE ' ||\n\t\t\t\tquote_ident(real_schema) || '.' || quote_ident(table_name) || ' ADD CONSTRAINT ' ||\n\t\t\t\tquote_ident('enforce_geotype_' || column_name) ||\n\t\t\t\t' CHECK (GeometryType(' ||\n\t\t\t\tquote_ident(column_name) || ')=' ||\n\t\t\t\tquote_literal(new_type) || ' OR (' ||\n\t\t\t\tquote_ident(column_name) || ') is null)';\n\t\t\tRAISE DEBUG '%', sql;\n\t\t\tEXECUTE sql;\n\t\tEND IF;\n\tEND IF;\n\n\tRETURN\n\t\treal_schema || '.' ||\n\t\ttable_name || '.' || column_name ||\n\t\t' SRID:' || new_srid::text ||\n\t\t' TYPE:' || new_type ||\n\t\t' DIMS:' || new_dim::text || ' ';\nEND;\n",
    "function_type": "function"
  },
  {
    "function_name": "award_booking_milestone_badge",
    "argument_data_types": "",
    "return_type": "trigger",
    "function_definition": "\r\nDECLARE\r\n  booking_count INTEGER;\r\n  milestone_badge_id UUID;\r\nBEGIN\r\n  -- Count user's total bookings\r\n  SELECT COUNT(*) INTO booking_count\r\n  FROM service_bookings\r\n  WHERE user_id = NEW.user_id;\r\n  \r\n  -- Check for 5 bookings milestone\r\n  IF booking_count = 5 THEN\r\n    SELECT id INTO milestone_badge_id FROM badges \r\n    WHERE category = 'services' AND name = 'Booking Expert'\r\n    LIMIT 1;\r\n    \r\n    IF milestone_badge_id IS NOT NULL THEN\r\n      INSERT INTO user_badges (user_id, badge_id)\r\n      VALUES (NEW.user_id, milestone_badge_id)\r\n      ON CONFLICT (user_id, badge_id) DO NOTHING;\r\n    END IF;\r\n  END IF;\r\n  \r\n  RETURN NEW;\r\nEND;\r\n",
    "function_type": "function"
  },
  {
    "function_name": "award_login_streak_badge",
    "argument_data_types": "",
    "return_type": "trigger",
    "function_definition": "\r\nDECLARE\r\n  streak_badge_id UUID;\r\nBEGIN\r\n  -- Find the streak badge\r\n  SELECT id INTO streak_badge_id FROM badges \r\n  WHERE category = 'engagement' AND description ILIKE '%consecutive day%'\r\n  LIMIT 1;\r\n  \r\n  -- If badge exists and user has a 7-day streak, award the badge\r\n  IF streak_badge_id IS NOT NULL AND NEW.current_count >= 7 THEN\r\n    INSERT INTO user_badges (user_id, badge_id)\r\n    VALUES (NEW.user_id, streak_badge_id)\r\n    ON CONFLICT (user_id, badge_id) DO NOTHING;\r\n  END IF;\r\n  \r\n  RETURN NEW;\r\nEND;\r\n",
    "function_type": "function"
  },
  {
    "function_name": "award_points",
    "argument_data_types": "p_user_id uuid, p_amount integer, p_transaction_type text, p_description text DEFAULT NULL::text, p_reference_id uuid DEFAULT NULL::uuid",
    "return_type": "void",
    "function_definition": "\r\nDECLARE\r\n    v_points_record RECORD;\r\nBEGIN\r\n    -- Get current points record\r\n    SELECT * INTO v_points_record\r\n    FROM user_points\r\n    WHERE user_id = p_user_id;\r\n    \r\n    -- If no points record exists, create one\r\n    IF v_points_record IS NULL THEN\r\n        INSERT INTO user_points (\r\n            user_id, \r\n            total_points, \r\n            available_points, \r\n            lifetime_points\r\n        )\r\n        VALUES (\r\n            p_user_id, \r\n            p_amount, \r\n            p_amount, \r\n            p_amount\r\n        );\r\n    ELSE\r\n        -- Update existing points record\r\n        UPDATE user_points\r\n        SET \r\n            total_points = total_points + p_amount,\r\n            available_points = available_points + p_amount,\r\n            lifetime_points = lifetime_points + p_amount,\r\n            updated_at = NOW()\r\n        WHERE user_id = p_user_id;\r\n    END IF;\r\n    \r\n    -- Record the transaction\r\n    INSERT INTO point_transactions (\r\n        user_id,\r\n        amount,\r\n        transaction_type,\r\n        description,\r\n        reference_id\r\n    )\r\n    VALUES (\r\n        p_user_id,\r\n        p_amount,\r\n        p_transaction_type,\r\n        p_description,\r\n        p_reference_id\r\n    );\r\nEND;\r\n",
    "function_type": "function"
  },
  {
    "function_name": "award_profile_completion_badge",
    "argument_data_types": "",
    "return_type": "trigger",
    "function_definition": "\r\nDECLARE\r\n  profile_badge_id UUID;\r\n  fields_required INTEGER := 5; -- Arbitrary number of fields required to consider profile \"complete\"\r\n  fields_completed INTEGER := 0;\r\nBEGIN\r\n  -- Count completed profile fields (non-null)\r\n  IF NEW.username IS NOT NULL THEN fields_completed := fields_completed + 1; END IF;\r\n  IF NEW.full_name IS NOT NULL THEN fields_completed := fields_completed + 1; END IF;\r\n  IF NEW.avatar_url IS NOT NULL THEN fields_completed := fields_completed + 1; END IF;\r\n  IF NEW.bio IS NOT NULL THEN fields_completed := fields_completed + 1; END IF;\r\n  IF NEW.role IS NOT NULL THEN fields_completed := fields_completed + 1; END IF;\r\n  \r\n  -- If profile is considered complete\r\n  IF fields_completed >= fields_required THEN\r\n    -- Find the profile completion badge\r\n    SELECT id INTO profile_badge_id FROM badges \r\n    WHERE category = 'profile' AND name = 'Profile Complete'\r\n    LIMIT 1;\r\n    \r\n    -- Award badge if it exists\r\n    IF profile_badge_id IS NOT NULL THEN\r\n      INSERT INTO user_badges (user_id, badge_id)\r\n      VALUES (NEW.id, profile_badge_id)\r\n      ON CONFLICT (user_id, badge_id) DO NOTHING;\r\n    END IF;\r\n  END IF;\r\n  \r\n  RETURN NEW;\r\nEND;\r\n",
    "function_type": "function"
  },
  {
    "function_name": "book_service",
    "argument_data_types": "p_user_id uuid, p_service_id uuid, p_scheduled_at timestamp with time zone, p_total_price numeric, p_ndis_covered_amount numeric, p_gap_payment numeric, p_notes text, p_category text",
    "return_type": "uuid",
    "function_definition": "\r\nDECLARE\r\n  v_wallet_record RECORD;\r\n  v_category_balance DECIMAL;\r\n  v_booking_id UUID;\r\nBEGIN\r\n  -- Get wallet data\r\n  SELECT * INTO v_wallet_record FROM wallets WHERE user_id = p_user_id;\r\n  \r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Wallet not found for user';\r\n  END IF;\r\n  \r\n  -- Check category balance\r\n  v_category_balance := (v_wallet_record.category_breakdown->p_category)::DECIMAL;\r\n  \r\n  IF v_category_balance IS NULL OR v_category_balance < p_ndis_covered_amount THEN\r\n    RAISE EXCEPTION 'Insufficient funds in % category. Available: %', p_category, COALESCE(v_category_balance, 0);\r\n  END IF;\r\n  \r\n  -- Create booking\r\n  INSERT INTO service_bookings (\r\n    user_id,\r\n    service_id,\r\n    scheduled_at,\r\n    total_price,\r\n    ndis_covered_amount,\r\n    gap_payment,\r\n    notes,\r\n    status\r\n  ) VALUES (\r\n    p_user_id,\r\n    p_service_id,\r\n    p_scheduled_at,\r\n    p_total_price,\r\n    p_ndis_covered_amount,\r\n    p_gap_payment,\r\n    p_notes,\r\n    'pending'\r\n  ) RETURNING id INTO v_booking_id;\r\n  \r\n  -- Update wallet balance\r\n  UPDATE wallets\r\n  SET \r\n    total_balance = total_balance - p_ndis_covered_amount,\r\n    category_breakdown = jsonb_set(\r\n      category_breakdown,\r\n      ARRAY[p_category],\r\n      to_jsonb(v_category_balance - p_ndis_covered_amount)\r\n    )\r\n  WHERE user_id = p_user_id;\r\n  \r\n  -- Create claim record\r\n  INSERT INTO claims (\r\n    user_id,\r\n    booking_id,\r\n    amount,\r\n    status,\r\n    category,\r\n    expiry_date\r\n  ) VALUES (\r\n    p_user_id,\r\n    v_booking_id,\r\n    p_ndis_covered_amount,\r\n    'pending',\r\n    p_category,\r\n    NOW() + INTERVAL '90 days'\r\n  );\r\n  \r\n  RETURN v_booking_id;\r\nEND;\r\n",
    "function_type": "function"
  },
  {
    "function_name": "book_service_fixed",
    "argument_data_types": "p_user_id uuid, p_service_id uuid, p_scheduled_at timestamp with time zone, p_total_price numeric, p_ndis_covered_amount numeric, p_gap_payment numeric, p_notes text, p_category text",
    "return_type": "uuid",
    "function_definition": "\r\nDECLARE\r\n  v_wallet_record RECORD;\r\n  v_category_balance DECIMAL;\r\n  v_booking_id UUID;\r\nBEGIN\r\n  -- Get wallet data\r\n  SELECT * INTO v_wallet_record FROM wallets WHERE user_id = p_user_id;\r\n  \r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Wallet not found for user';\r\n  END IF;\r\n  \r\n  -- Check category balance\r\n  v_category_balance := (v_wallet_record.category_breakdown->p_category)::DECIMAL;\r\n  \r\n  IF v_category_balance IS NULL OR v_category_balance < p_ndis_covered_amount THEN\r\n    RAISE EXCEPTION 'Insufficient funds in % category. Available: %', p_category, COALESCE(v_category_balance, 0);\r\n  END IF;\r\n  \r\n  -- Create booking (without category)\r\n  INSERT INTO service_bookings (\r\n    user_id,\r\n    service_id,\r\n    scheduled_at,\r\n    total_price,\r\n    ndis_covered_amount,\r\n    gap_payment,\r\n    notes,\r\n    status\r\n  ) VALUES (\r\n    p_user_id,\r\n    p_service_id,\r\n    p_scheduled_at,\r\n    p_total_price,\r\n    p_ndis_covered_amount,\r\n    p_gap_payment,\r\n    p_notes,\r\n    'pending'\r\n  ) RETURNING id INTO v_booking_id;\r\n  \r\n  -- Update wallet balance\r\n  UPDATE wallets\r\n  SET \r\n    total_balance = total_balance - p_ndis_covered_amount,\r\n    category_breakdown = jsonb_set(\r\n      category_breakdown,\r\n      ARRAY[p_category],\r\n      to_jsonb(v_category_balance - p_ndis_covered_amount)\r\n    )\r\n  WHERE user_id = p_user_id;\r\n  \r\n  -- Create claim record (without category)\r\n  INSERT INTO claims (\r\n    user_id,\r\n    booking_id,\r\n    amount,\r\n    status,\r\n    expiry_date\r\n  ) VALUES (\r\n    p_user_id,\r\n    v_booking_id,\r\n    p_ndis_covered_amount,\r\n    'pending',\r\n    NOW() + INTERVAL '90 days'\r\n  );\r\n  \r\n  RETURN v_booking_id;\r\nEND;\r\n",
    "function_type": "function"
  },
  {
    "function_name": "box",
    "argument_data_types": "geometry",
    "return_type": "box",
    "function_definition": "LWGEOM_to_BOX",
    "function_type": "function"
  },
  {
    "function_name": "box",
    "argument_data_types": "box3d",
    "return_type": "box",
    "function_definition": "BOX3D_to_BOX",
    "function_type": "function"
  },
  {
    "function_name": "box2d",
    "argument_data_types": "geometry",
    "return_type": "box2d",
    "function_definition": "LWGEOM_to_BOX2D",
    "function_type": "function"
  },
  {
    "function_name": "box2d",
    "argument_data_types": "box3d",
    "return_type": "box2d",
    "function_definition": "BOX3D_to_BOX2D",
    "function_type": "function"
  },
  {
    "function_name": "box2d_in",
    "argument_data_types": "cstring",
    "return_type": "box2d",
    "function_definition": "BOX2D_in",
    "function_type": "function"
  },
  {
    "function_name": "box2d_out",
    "argument_data_types": "box2d",
    "return_type": "cstring",
    "function_definition": "BOX2D_out",
    "function_type": "function"
  },
  {
    "function_name": "box2df_in",
    "argument_data_types": "cstring",
    "return_type": "box2df",
    "function_definition": "box2df_in",
    "function_type": "function"
  },
  {
    "function_name": "box2df_out",
    "argument_data_types": "box2df",
    "return_type": "cstring",
    "function_definition": "box2df_out",
    "function_type": "function"
  },
  {
    "function_name": "box3d",
    "argument_data_types": "geometry",
    "return_type": "box3d",
    "function_definition": "LWGEOM_to_BOX3D",
    "function_type": "function"
  },
  {
    "function_name": "box3d",
    "argument_data_types": "box2d",
    "return_type": "box3d",
    "function_definition": "BOX2D_to_BOX3D",
    "function_type": "function"
  },
  {
    "function_name": "box3d_in",
    "argument_data_types": "cstring",
    "return_type": "box3d",
    "function_definition": "BOX3D_in",
    "function_type": "function"
  },
  {
    "function_name": "box3d_out",
    "argument_data_types": "box3d",
    "return_type": "cstring",
    "function_definition": "BOX3D_out",
    "function_type": "function"
  },
  {
    "function_name": "box3dtobox",
    "argument_data_types": "box3d",
    "return_type": "box",
    "function_definition": "BOX3D_to_BOX",
    "function_type": "function"
  },
  {
    "function_name": "bytea",
    "argument_data_types": "geometry",
    "return_type": "bytea",
    "function_definition": "LWGEOM_to_bytea",
    "function_type": "function"
  },
  {
    "function_name": "bytea",
    "argument_data_types": "geography",
    "return_type": "bytea",
    "function_definition": "LWGEOM_to_bytea",
    "function_type": "function"
  },
  {
    "function_name": "check_and_award_badges",
    "argument_data_types": "p_user_id uuid",
    "return_type": "record",
    "function_definition": "\r\nDECLARE\r\n    v_badge RECORD;\r\n    v_eligible BOOLEAN;\r\n    v_achievement RECORD;\r\n    v_requirement RECORD;\r\n    v_awarded_badges UUID[] := ARRAY[]::UUID[];\r\nBEGIN\r\n    -- Loop through all active badges\r\n    FOR v_badge IN \r\n        SELECT * FROM badge_definitions WHERE is_active = TRUE\r\n    LOOP\r\n        -- Skip if user already has this badge\r\n        CONTINUE WHEN EXISTS (\r\n            SELECT 1 FROM user_badges \r\n            WHERE user_id = p_user_id AND badge_id = v_badge.id\r\n        );\r\n        \r\n        v_eligible := TRUE;\r\n        \r\n        -- Check each requirement in the badge\r\n        FOR v_requirement IN \r\n            SELECT * FROM jsonb_each(v_badge.requirements)\r\n        LOOP\r\n            -- Check if user meets this requirement\r\n            SELECT * INTO v_achievement\r\n            FROM user_achievements\r\n            WHERE user_id = p_user_id \r\n            AND achievement_type = v_requirement.key;\r\n            \r\n            -- If achievement doesn't exist or isn't completed, user is not eligible\r\n            IF v_achievement IS NULL OR NOT v_achievement.completed THEN\r\n                v_eligible := FALSE;\r\n                EXIT; -- No need to check further requirements\r\n            END IF;\r\n        END LOOP;\r\n        \r\n        -- Award badge if eligible\r\n        IF v_eligible THEN\r\n            INSERT INTO user_badges (user_id, badge_id)\r\n            VALUES (p_user_id, v_badge.id);\r\n            \r\n            -- Add to result set\r\n            v_awarded_badges := array_append(v_awarded_badges, v_badge.id);\r\n            \r\n            -- Award points for the badge\r\n            PERFORM award_points(\r\n                p_user_id, \r\n                v_badge.points, \r\n                'BADGE_EARNED', \r\n                'Earned badge: ' || v_badge.name, \r\n                v_badge.id\r\n            );\r\n        END IF;\r\n    END LOOP;\r\n    \r\n    -- Return awarded badges\r\n    RETURN QUERY\r\n    SELECT b.id, b.name\r\n    FROM badge_definitions b\r\n    WHERE b.id = ANY(v_awarded_badges);\r\nEND;\r\n",
    "function_type": "function"
  },
  {
    "function_name": "checkauth",
    "argument_data_types": "text, text",
    "return_type": "int4",
    "function_definition": " SELECT CheckAuth('', $1, $2) ",
    "function_type": "function"
  },
  {
    "function_name": "checkauth",
    "argument_data_types": "text, text, text",
    "return_type": "int4",
    "function_definition": "\nDECLARE\n\tschema text;\nBEGIN\n\tIF NOT LongTransactionsEnabled() THEN\n\t\tRAISE EXCEPTION 'Long transaction support disabled, use EnableLongTransaction() to enable.';\n\tEND IF;\n\n\tif ( $1 != '' ) THEN\n\t\tschema = $1;\n\tELSE\n\t\tSELECT current_schema() into schema;\n\tEND IF;\n\n\t-- TODO: check for an already existing trigger ?\n\n\tEXECUTE 'CREATE TRIGGER check_auth BEFORE UPDATE OR DELETE ON '\n\t\t|| quote_ident(schema) || '.' || quote_ident($2)\n\t\t||' FOR EACH ROW EXECUTE PROCEDURE CheckAuthTrigger('\n\t\t|| quote_literal($3) || ')';\n\n\tRETURN 0;\nEND;\n",
    "function_type": "function"
  },
  {
    "function_name": "checkauthtrigger",
    "argument_data_types": "",
    "return_type": "trigger",
    "function_definition": "check_authorization",
    "function_type": "function"
  },
  {
    "function_name": "contains_2d",
    "argument_data_types": "geometry, box2df",
    "return_type": "bool",
    "function_definition": "SELECT $2 OPERATOR(public.@) $1;",
    "function_type": "function"
  },
  {
    "function_name": "contains_2d",
    "argument_data_types": "box2df, geometry",
    "return_type": "bool",
    "function_definition": "gserialized_contains_box2df_geom_2d",
    "function_type": "function"
  },
  {
    "function_name": "contains_2d",
    "argument_data_types": "box2df, box2df",
    "return_type": "bool",
    "function_definition": "gserialized_contains_box2df_box2df_2d",
    "function_type": "function"
  },
  {
    "function_name": "create_booking_with_wallet_update",
    "argument_data_types": "p_user_id uuid, p_service_id uuid, p_scheduled_at timestamp with time zone, p_total_price numeric, p_ndis_covered_amount numeric, p_gap_payment numeric, p_notes text, p_category text",
    "return_type": "uuid",
    "function_definition": "\r\nDECLARE\r\n  v_wallet_record RECORD;\r\n  v_category_balance DECIMAL;\r\n  v_booking_id UUID;\r\nBEGIN\r\n  -- Get wallet data\r\n  SELECT * INTO v_wallet_record FROM wallets WHERE user_id = p_user_id;\r\n  \r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Wallet not found for user';\r\n  END IF;\r\n  \r\n  -- Check category balance\r\n  v_category_balance := (v_wallet_record.category_breakdown->p_category)::DECIMAL;\r\n  \r\n  IF v_category_balance IS NULL OR v_category_balance < p_ndis_covered_amount THEN\r\n    RAISE EXCEPTION 'Insufficient funds in % category. Available: %', p_category, COALESCE(v_category_balance, 0);\r\n  END IF;\r\n  \r\n  -- Create booking - removed category column from both the column list and values\r\n  INSERT INTO service_bookings (\r\n    user_id,\r\n    service_id,\r\n    scheduled_at,\r\n    total_price,\r\n    ndis_covered_amount,\r\n    gap_payment,\r\n    notes,\r\n    status\r\n  ) VALUES (\r\n    p_user_id,\r\n    p_service_id,\r\n    p_scheduled_at,\r\n    p_total_price,\r\n    p_ndis_covered_amount,\r\n    p_gap_payment,\r\n    p_notes,\r\n    'pending'\r\n  ) RETURNING id INTO v_booking_id;\r\n  \r\n  -- Update wallet balance\r\n  UPDATE wallets\r\n  SET \r\n    total_balance = total_balance - p_ndis_covered_amount,\r\n    category_breakdown = jsonb_set(\r\n      category_breakdown,\r\n      ARRAY[p_category],\r\n      to_jsonb(v_category_balance - p_ndis_covered_amount)\r\n    )\r\n  WHERE user_id = p_user_id;\r\n  \r\n  -- Create claim record - keeping category here since claims table does have a category column\r\n  INSERT INTO claims (\r\n    user_id,\r\n    booking_id,\r\n    amount,\r\n    status,\r\n    category,\r\n    expiry_date\r\n  ) VALUES (\r\n    p_user_id,\r\n    v_booking_id,\r\n    p_ndis_covered_amount,\r\n    'pending',\r\n    p_category,\r\n    NOW() + INTERVAL '90 days'\r\n  );\r\n  \r\n  RETURN v_booking_id;\r\nEND;\r\n",
    "function_type": "function"
  },
  {
    "function_name": "disablelongtransactions",
    "argument_data_types": "",
    "return_type": "text",
    "function_definition": "\nDECLARE\n\trec RECORD;\n\nBEGIN\n\n\t--\n\t-- Drop all triggers applied by CheckAuth()\n\t--\n\tFOR rec IN\n\t\tSELECT c.relname, t.tgname, t.tgargs FROM pg_trigger t, pg_class c, pg_proc p\n\t\tWHERE p.proname = 'checkauthtrigger' and t.tgfoid = p.oid and t.tgrelid = c.oid\n\tLOOP\n\t\tEXECUTE 'DROP TRIGGER ' || quote_ident(rec.tgname) ||\n\t\t\t' ON ' || quote_ident(rec.relname);\n\tEND LOOP;\n\n\t--\n\t-- Drop the authorization_table table\n\t--\n\tFOR rec IN SELECT * FROM pg_class WHERE relname = 'authorization_table' LOOP\n\t\tDROP TABLE authorization_table;\n\tEND LOOP;\n\n\t--\n\t-- Drop the authorized_tables view\n\t--\n\tFOR rec IN SELECT * FROM pg_class WHERE relname = 'authorized_tables' LOOP\n\t\tDROP VIEW authorized_tables;\n\tEND LOOP;\n\n\tRETURN 'Long transactions support disabled';\nEND;\n",
    "function_type": "function"
  },
  {
    "function_name": "dropgeometrycolumn",
    "argument_data_types": "table_name character varying, column_name character varying",
    "return_type": "text",
    "function_definition": "\nDECLARE\n\tret text;\nBEGIN\n\tSELECT public.DropGeometryColumn('','',$1,$2) into ret;\n\tRETURN ret;\nEND;\n",
    "function_type": "function"
  },
  {
    "function_name": "dropgeometrycolumn",
    "argument_data_types": "schema_name character varying, table_name character varying, column_name character varying",
    "return_type": "text",
    "function_definition": "\nDECLARE\n\tret text;\nBEGIN\n\tSELECT public.DropGeometryColumn('',$1,$2,$3) into ret;\n\tRETURN ret;\nEND;\n",
    "function_type": "function"
  },
  {
    "function_name": "dropgeometrycolumn",
    "argument_data_types": "catalog_name character varying, schema_name character varying, table_name character varying, column_name character varying",
    "return_type": "text",
    "function_definition": "\nDECLARE\n\tmyrec RECORD;\n\tokay boolean;\n\treal_schema name;\n\nBEGIN\n\n\t-- Find, check or fix schema_name\n\tIF ( schema_name != '' ) THEN\n\t\tokay = false;\n\n\t\tFOR myrec IN SELECT nspname FROM pg_namespace WHERE text(nspname) = schema_name LOOP\n\t\t\tokay := true;\n\t\tEND LOOP;\n\n\t\tIF ( okay <>  true ) THEN\n\t\t\tRAISE NOTICE 'Invalid schema name - using current_schema()';\n\t\t\tSELECT current_schema() into real_schema;\n\t\tELSE\n\t\t\treal_schema = schema_name;\n\t\tEND IF;\n\tELSE\n\t\tSELECT current_schema() into real_schema;\n\tEND IF;\n\n\t-- Find out if the column is in the geometry_columns table\n\tokay = false;\n\tFOR myrec IN SELECT * from public.geometry_columns where f_table_schema = text(real_schema) and f_table_name = table_name and f_geometry_column = column_name LOOP\n\t\tokay := true;\n\tEND LOOP;\n\tIF (okay <> true) THEN\n\t\tRAISE EXCEPTION 'column not found in geometry_columns table';\n\t\tRETURN false;\n\tEND IF;\n\n\t-- Remove table column\n\tEXECUTE 'ALTER TABLE ' || quote_ident(real_schema) || '.' ||\n\t\tquote_ident(table_name) || ' DROP COLUMN ' ||\n\t\tquote_ident(column_name);\n\n\tRETURN real_schema || '.' || table_name || '.' || column_name ||' effectively removed.';\n\nEND;\n",
    "function_type": "function"
  },
  {
    "function_name": "dropgeometrytable",
    "argument_data_types": "table_name character varying",
    "return_type": "text",
    "function_definition": " SELECT public.DropGeometryTable('','',$1) ",
    "function_type": "function"
  },
  {
    "function_name": "dropgeometrytable",
    "argument_data_types": "schema_name character varying, table_name character varying",
    "return_type": "text",
    "function_definition": " SELECT public.DropGeometryTable('',$1,$2) ",
    "function_type": "function"
  },
  {
    "function_name": "dropgeometrytable",
    "argument_data_types": "catalog_name character varying, schema_name character varying, table_name character varying",
    "return_type": "text",
    "function_definition": "\nDECLARE\n\treal_schema name;\n\nBEGIN\n\n\tIF ( schema_name = '' ) THEN\n\t\tSELECT current_schema() into real_schema;\n\tELSE\n\t\treal_schema = schema_name;\n\tEND IF;\n\n\t-- TODO: Should we warn if table doesn't exist probably instead just saying dropped\n\t-- Remove table\n\tEXECUTE 'DROP TABLE IF EXISTS '\n\t\t|| quote_ident(real_schema) || '.' ||\n\t\tquote_ident(table_name) || ' RESTRICT';\n\n\tRETURN\n\t\treal_schema || '.' ||\n\t\ttable_name ||' dropped.';\n\nEND;\n",
    "function_type": "function"
  },
  {
    "function_name": "enablelongtransactions",
    "argument_data_types": "",
    "return_type": "text",
    "function_definition": "\nDECLARE\n\t\"query\" text;\n\texists bool;\n\trec RECORD;\n\nBEGIN\n\n\texists = 'f';\n\tFOR rec IN SELECT * FROM pg_class WHERE relname = 'authorization_table'\n\tLOOP\n\t\texists = 't';\n\tEND LOOP;\n\n\tIF NOT exists\n\tTHEN\n\t\t\"query\" = 'CREATE TABLE authorization_table (\n\t\t\ttoid oid, -- table oid\n\t\t\trid text, -- row id\n\t\t\texpires timestamp,\n\t\t\tauthid text\n\t\t)';\n\t\tEXECUTE \"query\";\n\tEND IF;\n\n\texists = 'f';\n\tFOR rec IN SELECT * FROM pg_class WHERE relname = 'authorized_tables'\n\tLOOP\n\t\texists = 't';\n\tEND LOOP;\n\n\tIF NOT exists THEN\n\t\t\"query\" = 'CREATE VIEW authorized_tables AS ' ||\n\t\t\t'SELECT ' ||\n\t\t\t'n.nspname as schema, ' ||\n\t\t\t'c.relname as table, trim(' ||\n\t\t\tquote_literal(chr(92) || '000') ||\n\t\t\t' from t.tgargs) as id_column ' ||\n\t\t\t'FROM pg_trigger t, pg_class c, pg_proc p ' ||\n\t\t\t', pg_namespace n ' ||\n\t\t\t'WHERE p.proname = ' || quote_literal('checkauthtrigger') ||\n\t\t\t' AND c.relnamespace = n.oid' ||\n\t\t\t' AND t.tgfoid = p.oid and t.tgrelid = c.oid';\n\t\tEXECUTE \"query\";\n\tEND IF;\n\n\tRETURN 'Long transactions support enabled';\nEND;\n",
    "function_type": "function"
  },
  {
    "function_name": "equals",
    "argument_data_types": "geom1 geometry, geom2 geometry",
    "return_type": "bool",
    "function_definition": "ST_Equals",
    "function_type": "function"
  },
  {
    "function_name": "find_srid",
    "argument_data_types": "character varying, character varying, character varying",
    "return_type": "int4",
    "function_definition": "\nDECLARE\n\tschem varchar =  $1;\n\ttabl varchar = $2;\n\tsr int4;\nBEGIN\n-- if the table contains a . and the schema is empty\n-- split the table into a schema and a table\n-- otherwise drop through to default behavior\n\tIF ( schem = '' and strpos(tabl,'.') > 0 ) THEN\n\t schem = substr(tabl,1,strpos(tabl,'.')-1);\n\t tabl = substr(tabl,length(schem)+2);\n\tEND IF;\n\n\tselect SRID into sr from public.geometry_columns where (f_table_schema = schem or schem = '') and f_table_name = tabl and f_geometry_column = $3;\n\tIF NOT FOUND THEN\n\t   RAISE EXCEPTION 'find_srid() - could not find the corresponding SRID - is the geometry registered in the GEOMETRY_COLUMNS table?  Is there an uppercase/lowercase mismatch?';\n\tEND IF;\n\treturn sr;\nEND;\n",
    "function_type": "function"
  },
  {
    "function_name": "geog_brin_inclusion_add_value",
    "argument_data_types": "internal, internal, internal, internal",
    "return_type": "bool",
    "function_definition": "geog_brin_inclusion_add_value",
    "function_type": "function"
  },
  {
    "function_name": "geography",
    "argument_data_types": "bytea",
    "return_type": "geography",
    "function_definition": "geography_from_binary",
    "function_type": "function"
  },
  {
    "function_name": "geography",
    "argument_data_types": "geometry",
    "return_type": "geography",
    "function_definition": "geography_from_geometry",
    "function_type": "function"
  },
  {
    "function_name": "geography",
    "argument_data_types": "geography, integer, boolean",
    "return_type": "geography",
    "function_definition": "geography_enforce_typmod",
    "function_type": "function"
  },
  {
    "function_name": "geography_analyze",
    "argument_data_types": "internal",
    "return_type": "bool",
    "function_definition": "gserialized_analyze_nd",
    "function_type": "function"
  },
  {
    "function_name": "geography_cmp",
    "argument_data_types": "geography, geography",
    "return_type": "int4",
    "function_definition": "geography_cmp",
    "function_type": "function"
  },
  {
    "function_name": "geography_distance_knn",
    "argument_data_types": "geography, geography",
    "return_type": "float8",
    "function_definition": "geography_distance_knn",
    "function_type": "function"
  },
  {
    "function_name": "geography_eq",
    "argument_data_types": "geography, geography",
    "return_type": "bool",
    "function_definition": "geography_eq",
    "function_type": "function"
  },
  {
    "function_name": "geography_ge",
    "argument_data_types": "geography, geography",
    "return_type": "bool",
    "function_definition": "geography_ge",
    "function_type": "function"
  },
  {
    "function_name": "geography_gist_compress",
    "argument_data_types": "internal",
    "return_type": "internal",
    "function_definition": "gserialized_gist_compress",
    "function_type": "function"
  },
  {
    "function_name": "geography_gist_consistent",
    "argument_data_types": "internal, geography, integer",
    "return_type": "bool",
    "function_definition": "gserialized_gist_consistent",
    "function_type": "function"
  },
  {
    "function_name": "geography_gist_decompress",
    "argument_data_types": "internal",
    "return_type": "internal",
    "function_definition": "gserialized_gist_decompress",
    "function_type": "function"
  }
]