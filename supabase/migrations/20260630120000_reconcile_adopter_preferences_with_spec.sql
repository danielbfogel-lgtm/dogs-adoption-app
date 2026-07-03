-- =========================================================
-- Reconcile adopters preference columns with SPEC product logic.
-- (SPEC/DB reconciliation, items 5-7.)
--
-- REVIEW BEFORE RUNNING. Run via `supabase db push` or paste into the
-- Supabase SQL editor for project jjhkikmuehqtfouohmex.
-- =========================================================

-- ---------------------------------------------------------
-- 5. adopters.size: allow 'doesnt_matter'
--    (existing CHECK only allowed small/medium/large)
-- ---------------------------------------------------------
alter table public.adopters
  drop constraint if exists adopters_size_check;
alter table public.adopters
  add constraint adopters_size_check
  check (size in ('small', 'medium', 'large', 'doesnt_matter'));

-- ---------------------------------------------------------
-- 6. adopters.sheds: boolean -> text ('no' | 'doesnt_matter')
--    Legacy-data mapping (preserves every row):
--      true  -> 'doesnt_matter'  (adopter was fine with a shedding dog)
--      false -> 'no'             (adopter wanted a non-shedding dog)
--      NULL  -> NULL
-- ---------------------------------------------------------
alter table public.adopters
  alter column sheds drop default;
alter table public.adopters
  alter column sheds type text
  using (
    case
      when sheds is true  then 'doesnt_matter'
      when sheds is false then 'no'
      else null
    end
  );
alter table public.adopters
  add constraint adopters_sheds_check
  check (sheds in ('no', 'doesnt_matter'));

-- ---------------------------------------------------------
-- 7. adopters.dog_age: enforce exactly the five allowed ranges.
--    NOTE: if any existing row holds a value outside this set the ADD
--    CONSTRAINT will fail; clean those rows first (the column was added as
--    free text with no CHECK in 20260623200049_add_dog_preferences_to_adopters).
-- ---------------------------------------------------------
alter table public.adopters
  add constraint adopters_dog_age_check
  check (dog_age in ('0-1', '1-3', '3-7', '7-10', '10+'));
