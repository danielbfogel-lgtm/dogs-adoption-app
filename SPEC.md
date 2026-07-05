# Project Specification: Dog Adoption Matching Platform

## 1. Overview & Architecture
This system matches dogs looking for a home with potential adopting families based on a smart algorithm. The project is developed using the **Vibe Coding** approach, utilizing a Serverless Split-Stack architecture:
* **Frontend:** Next.js (React) and TypeScript. Responsible for the UI, state management, forms, and routing.
* **Backend (Matching Engine):** Python-based Serverless Functions located in the `api/` directory. Responsible for core logic, data processing, and the scoring algorithm.
* **Database & Auth:** Supabase for user authentication and data tables. Server communication via `supabase-py`.
* **Deployment:** Vercel, supporting both the Next.js frontend and the Python serverless functions, with CI/CD via GitHub.

## 2. Database Schema (Supabase)

### `profiles` (Basic User Profile)
Synced with Supabase Auth.
* `id` (UUID): Auto-generated unique identifier.
* `email` (String): Valid email address (Required).
* `role` (Enum): `admin` / `adopter` (Default: `adopter`).
* `created_at` (Timestamp).

### `adopters` (Adopter Details)
* `id` (UUID): Record ID.
* `user_id` (UUID): Foreign key to `profiles`.
* `first_name` (String): Required.
* `last_name` (String): Required.
* `birth_date` (Date).
* `age` (Integer): Auto-calculated.
* `family_structure` (Enum): Single, Couple without children, Family with children, Retirees.
* `number_of_children` (Integer): Minimum 0.
* `youngest_child_age` (Integer): Conditional, only displayed/relevant if number_of_children > 0.
* `household_size` (Integer): Minimum 1.
* `energy_level` (Integer): Preferred energy level, scale 1-5.
* `size` (Enum): Preferred size (Small, Medium, Large, Does not matter).
* `number_of_dogs` (Integer): Current number of dogs, minimum 0.
* `number_of_cats` (Integer): Current number of cats, minimum 0.
* `sheds` (Enum): Shedding preference (No, Does not matter).
* `dog_age` (Enum): Preferred dog age (0-1, 1-3, 3-7, 7-10, 10+).
* `phone` (String): With validation.
* `created_at` (Timestamp).

### `dogs` (Dog Details)
* `id` (UUID): Dog ID.
* `name` (String).
* `birth_date` (Date).
* `age` (Integer): Auto-calculated.
* `breed` (Enum): Mixed [Default], Poodle, Pitbull, Doberman, Amstaff, etc. (Alphabetical order).
* `size` (Enum): Small, Medium, Large.
* `energy_level` (Integer): Scale 1-5.
* `good_with_children` (Boolean).
* `good_with_dogs` (Boolean).
* `good_with_cats` (Boolean).
* `sheds` (Boolean).
* `free_description` (Text).
* `status` (Enum): Available [Default], Pending, Adopted.
* `photo_url` (String): Image upload link.
* `created_at` (Timestamp).

### `potential_matches` (Matching System)
* `id` (UUID).
* `adopter_id` (UUID): Foreign key to `adopters`.
* `dog_id` (UUID): Foreign key to `dogs`.
* `matching_score` (Float): Score 0-100 (represented as a percentage in the UI).
* `match_status` (Enum): Pending [Default], Confirmed, Rejected.
* `created_at` (Timestamp).

## 3. Matching Engine (Python Backend Logic)
The algorithm runs as a Python serverless function, calculating a compatibility score (0-100) for every dog-adopter pair.
**Display Threshold:** A dog is presented to the adopter ONLY if the final score is **70% or higher**.

**Weight System (72/24/4 method):**

### Group A: High Weight (24% per parameter, Total 72%)
1.  **Energy Level (24%):** Gradual mathematical penalty `S = 24 · (1 − |gap| / delta_max)` with **`delta_max = 4`** (the 1-5 scale). Full match = 24 pts; maximum gap (4) = 0 pts.
2.  **Child Compatibility (24%):**
    * Family with children: Heavy penalty if the dog is not good with children. The penalty mathematically worsens the younger the `youngest_child_age` is.
    * Family without children: Automatically receives a full score (24 pts) for this category.
3.  **Size (24%):** Only **3 tiers** exist — `small`=1, `medium`=2, `large`=3 — so **`delta_max = 2`**. Gradual penalty `S = 24 · (1 − |size_dog − size_adopter| / 2)`, clamped to `[0, 24]`.
    * Adopter selected "Does not matter" = full 24 pts (skip the penalty).
    * Exact match = 24 pts.
    * Gap of one tier (e.g. small↔medium) = 12 pts.
    * Maximum gap of two tiers (small↔large) = 0 pts.

### Group B: Medium Weight (8% per parameter, Total 24%)
4.  **Good with Dogs (8%):** Relevant only if the adopter currently has dogs. If the dog is compatible = 8 pts. If not = 0 pts. If the adopter has no dogs = 8 pts automatically.
5.  **Good with Cats (8%):** Relevant only if the adopter currently has cats. If the dog is compatible = 8 pts. If not = 0 pts. If the adopter has no cats = 8 pts automatically.
6.  **Dog Age (8%):** The adopter picks an age **range** (`0-1`, `1-3`, `3-7`, `7-10`, `10+`) mapped to `[low, high]` (`10+` → `[10, ∞)`); the dog has an **integer** age. Award the full **8 pts** when the dog's age is inside the range. Outside it, apply a gradual penalty that grows with distance from the nearest edge, down to 0: with `years_outside = max(0, low − age, age − high)`, `S = 8 · max(0, 1 − years_outside / AGE_DELTA_MAX)` where **`AGE_DELTA_MAX = 5`** (tunable) — i.e. 0 pts once the dog is 5+ years beyond the chosen range.

### Group C: Low Weight (4% Total)
7.  **Shedding (4%):** If the adopter prefers "No" shedding and the dog sheds = 0 pts. In any other scenario (adopter chose "Does not matter" or the dog actually doesn't shed) = 4 pts.

## 4. User Interface & Page Structure (UI/UX)
The UI will be built in Next.js with clear navigation separating the Adopter and Admin areas. The global Header includes the site logo and user avatar (dropdown menu: "My Profile" / "Logout").

### Public / Onboarding Pages
* **Login Page (`/login`):** Site logo, email & password fields, and a prominent registration link/button.
* **Registration Page (`/register`):** Comprehensive form covering all fields defined in the `adopters` table.

### Adopter Pages
* **Match Results (`/matches`):** The primary dashboard for adopters. Displays ONLY dogs with a **>= 70% match score**.
    * Toggle between List view and Tile/Card view (displaying dog photo and key details).
    * Clearly display the match percentage on each item.
    * Action buttons: "Confirm Match" (Green Check) sets `match_status = 'confirmed'`; "Reject Match" (Red X) sets `match_status = 'rejected'`. Clicking updates the row in the DB.
    * Tabs/Filters: "All Recommendations", "Confirmed Dogs", "Rejected Dogs".
* **All Dogs Gallery (`/dogs`):** Requires login. Display of all dogs (List/Tiles) with pagination or infinite scroll. Includes a text search by name and an "Advanced Search" to filter by `dogs` table attributes.
* **Dog Details (`/dogs/[id]`):** Requires login. A dedicated page for a single dog. Read-only for standard users.
* **My Profile (`/profile`):** Allows the user to view and edit their submitted registration details.

### Admin Only Pages
* **User Management (`/admin/users`):** List of all users. Admins can manually create or delete users.
* **Admin User View (`/admin/users/[id]`):** Accessed by clicking a user's email. Admins can edit user details, change passwords, and modify the Role (adopter/admin).
* **Dog Management (Integrated):** "Add New Dog", "Edit Dog", and "Delete Dog" capabilities will be visible and functional strictly for users with the Admin role.

## 5. Role-Based Access Control (RBAC)
* **Adopter:** Can edit their own profile, view dogs, receive algorithm recommendations, and confirm/reject matches.
* **Admin:** Full CRUD access to the entire dog database, user management, password resets, and role assignments. Route protection must be implemented on both the frontend (Next.js Middleware) and backend (Python endpoints / Supabase RLS).