-- Add onboarding_completed flag to businesses.
-- New users default to false and are redirected to /onboarding after registration.
-- Existing users are backfilled to true so they are not interrupted.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Backfill: existing businesses have already been set up — skip onboarding for them.
UPDATE public.businesses SET onboarding_completed = true WHERE onboarding_completed = false;
