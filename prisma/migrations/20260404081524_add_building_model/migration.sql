-- This migration was superseded by `20260404093000_add_building_model`.
-- It previously attempted to alter the `Building` table before it existed,
-- which can fail on a fresh database. Keep it as a no-op for deploy safety.
SELECT 1;
