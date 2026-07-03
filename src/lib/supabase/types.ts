/**
 * Hand-written Supabase types for the tables the frontend currently touches
 * (`profiles`, `adopters`, `dogs`). Mirrors the live schema (see the Obsidian
 * status file's "Database Schema" section) rather than a full
 * `supabase gen types` output. Extend as more tables are wired up
 * (`potential_matches`).
 *
 * Shape must satisfy postgrest-js's `GenericSchema` (Tables + Views +
 * Functions, each table with Row/Insert/Update/Relationships) — supabase-js's
 * `SupabaseClient<Database>` generic silently collapses to `never` for every
 * query if the schema doesn't structurally match, with no type error at the
 * `createClient<Database>()` call site (the error only surfaces later, at each
 * `.from(...)` call, as a confusing "does not exist on type 'never'").
 */

export type ProfileRole = "adopter" | "admin";

type ProfileRow = {
  id: string;
  // `email` has no NOT NULL constraint in the schema (see
  // supabase/migrations/20260623125227_create_initial_schema.sql) — nullable
  // here to match, even though nothing selects it today (Header reads the
  // JWT claim instead).
  email: string | null;
  role: ProfileRole;
  created_at: string;
};

// Mirrors supabase/migrations/20260623125227..., 20260623200049..., and
// 20260630120000_reconcile_adopter_preferences_with_spec.sql. `adopters.age`
// is "auto-calculated" per SPEC.md §2 but no DB trigger/generated column
// exists for it yet — the frontend never reads or writes it. (`dogs.age` has
// the same missing-trigger gap, but the admin dog form computes it
// server-side from `birth_date` as a stopgap — see the `dogs.Insert` comment
// below.)
export type FamilyStructure = "single" | "couple" | "family";
export type SizePreference = "small" | "medium" | "large" | "doesnt_matter";
export type SheddingPreference = "no" | "doesnt_matter";
export type DogAgeRange = "0-1" | "1-3" | "3-7" | "7-10" | "10+";

type AdopterRow = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  age: number | null;
  family_structure: FamilyStructure | null;
  energy_level: number | null;
  number_of_children: number | null;
  youngest_child_age: number | null;
  number_of_dogs: number | null;
  number_of_cats: number | null;
  household_size: number | null;
  phone: string | null;
  size: SizePreference | null;
  sheds: SheddingPreference | null;
  dog_age: DogAgeRange | null;
  created_at: string;
};

// Mirrors api/db_client.py's `Dog` TypedDict / the `dogs` table.
export type DogSize = "small" | "medium" | "large";
export type DogStatus = "available" | "pending" | "adopted";

type DogRow = {
  id: string;
  name: string | null;
  birth_date: string | null;
  age: number | null;
  breed: string | null;
  size: DogSize | null;
  energy_level: number | null;
  good_with_children: boolean | null;
  good_with_dogs: boolean | null;
  good_with_cats: boolean | null;
  sheds: boolean | null;
  free_description: string | null;
  status: DogStatus;
  photo_url: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        // `role`/`created_at` have DB defaults ('adopter', now()) — optional
        // on Insert. The frontend never inserts into `profiles` itself (the
        // `handle_new_user` trigger owns that), but this keeps the type
        // honest for any future admin tooling that does.
        Insert: Omit<ProfileRow, "role" | "created_at"> & Partial<Pick<ProfileRow, "role" | "created_at">>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      adopters: {
        Row: AdopterRow;
        // `id`/`created_at` have DB defaults; `age` is never written by the
        // frontend (no auto-calc mechanism exists yet — see the comment
        // above `FamilyStructure`).
        Insert: Omit<AdopterRow, "id" | "created_at" | "age"> &
          Partial<Pick<AdopterRow, "id" | "created_at">>;
        Update: Partial<Omit<AdopterRow, "id" | "user_id">>;
        Relationships: [];
      };
      dogs: {
        Row: DogRow;
        // `id`/`created_at`/`status` have DB defaults, so optional on Insert.
        // `age` has no DB auto-calc trigger (see the comment above
        // `FamilyStructure`) — the admin dog form's Server Action
        // (`lib/dog-actions.ts`) computes it from `birth_date` at save time
        // via `computeAgeFromBirthDate()` and writes it explicitly, so it
        // stays a required (but nullable) field here rather than omitted.
        Insert: Omit<DogRow, "id" | "created_at"> &
          Partial<Pick<DogRow, "id" | "created_at" | "status">>;
        Update: Partial<Omit<DogRow, "id">>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
  };
};
