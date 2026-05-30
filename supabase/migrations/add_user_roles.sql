-- Add role support to profiles.
-- Roles: owner | manager | staff | accountant
-- All existing users default to 'owner' (non-breaking).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'owner'
    CHECK (role IN ('owner', 'manager', 'staff', 'accountant'));

-- RLS: only the user themselves (or an owner of the same business) should update role.
-- For now, users can read their own role; owner updates happen via Supabase Studio
-- until a team-management UI is built.

COMMENT ON COLUMN public.profiles.role IS
  'App-level role. owner=full access, manager=no delete/settings, staff=add only, accountant=read+export';
