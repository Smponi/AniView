# AniView Architecture & Engineering Guide

**Project Status:** Production-Ready Prototype
**Focus:** High-Performance UI, Social Graph Analysis, Client-Side Heuristics.

This document serves as the **source of truth** for the codebase. It details the architectural patterns, data flow, and design constraints used to build AniView.

## 1. Tech Stack & Decisions

| Technology | Choice | Context / Why? |
| :--- | :--- | :--- |
| **Framework** | **Vue 3 (Script Setup)** | Utilizes Composition API for modular logic reuse (Composables). |
| **Language** | **TypeScript (Strict)** | Strict typing for API responses and component props to prevent runtime errors. |
| **State/Data** | **TanStack Query** | Handles caching, deduplication, and infinite scroll state. `staleTime` is set to 5min to minimize API hits. |
| **Styling** | **Native CSS3** | No frameworks (Tailwind/Bootstrap). Uses CSS Variables & Scoped CSS for maximum performance and "Glassmorphism" aesthetic. |
| **API** | **GraphQL (Anilist)** | Allows fetching nested data (Media + User + Following) in minimal roundtrips. |
| **Bundler** | **Vite** | Instant HMR and optimized production builds. |

***

## 2. Directory Structure & Key Responsibilities

```text
src/
├── api/                  # PURE FETCH LAYER (Stateless)
│   └── anilist.ts        # Contains raw GraphQL query strings & fetch wrappers.
│                         # Handles the "N+1" logic via chunked requests.
│
├── composables/          # BUSINESS LOGIC (Stateful Hooks)
│   ├── useMediaList.ts   # Wraps useInfiniteQuery. Handles flattening of pagination pages.
│   └── useSocialGraph.ts # THE CORE ENGINE. Manages Friend-Lists & Intersection calculation.
│
├── components/           # UI LAYER (Presentational)
│   ├── MediaCard.vue     # Atomic entry display with Hover-Reveal logic.
│   ├── SidebarLeft.vue   # Filter Controls & User Input (v-model bindings).
│   ├── SidebarRight.vue  # Social Graph & Genre Cloud (Tabs).
│   └── ui/               # Reusable primitives (Icons, Skeletons).
│
├── types/                # DOMAIN MODELS
│   └── index.ts          # Central interfaces (MediaEntry, AnilistUser, etc).
│
├── App.vue               # ORCHESTRATOR. Combines Composables with Components.
└── main.ts               # Entry point. Registers VueQueryPlugin.
```

***

## 3. Core Features & Implementation Details

### Data Structure Consolidation
- **Social Graph Storage:** We use a single `Map<UserId, Map<MediaId, Score>>` to store friend data. This serves both the Hype-Ranking (keys) and the detailed Score-Consensus (values).
- **Dead Code Removal:** Replaced local sync calculations with async JIT (Just-In-Time) batching to handle large friend lists efficiently.

### A. The "Smart" Infinite Scroll

* **Implementation:** Located in `App.vue` & `useMediaList.ts`.
* **Logic:** Uses an `IntersectionObserver` on a hidden sentinel element (`.trigger`) at the bottom of the list.
* **Why:** Better performance than scroll-event listeners.
* **Data Handling:** The API returns paginated "chunks" (Lists of Entries). The Composable flattens these arrays (`flatMap`) into a single reactive `allEntries` array for smooth rendering.

### B. Client-Side Filtering & Sorting

* **Strategy:** "Fetch Broad, Filter Narrow".
* **Logic:** We fetch the user's list in chunks of 50/100.
* **Optimization:** Instead of asking the API to "Filter by Genre Action", we fetch *all* and filter in memory (`computed` property in `App.vue`).
  * *Reason:* Anilist API rate limits are strict. Re-fetching for every filter change is too slow.
* **Sorting Options:**
  * `DATE_DESC` (Default, Array Order)
  * `SCORE` (Asc/Desc)
  * `SOCIAL_HYPE` (See Section C)

### C. Social Discovery Engine (The Hybrid Model) (Complex Feature)

We use two distinct fetching strategies to balance performance vs. detail:

#### 1. The Broad Phase (Discovery)

* **Goal:** Sort the main grid by "Social Hype".
* **Method:** We fetch the *first chunk* (100 items) of a friend's library.
* **Why:** Fetching full libraries for 50 friends is too slow. 100 items gives a "good enough" heuristic for ranking.

  #### 2. The Narrow Phase (Inspection)

  * **Goal:** Show detailed stats (Avg/Median) for *one* specific Anime.
  * **Method:** **Just-In-Time (JIT) Batching**.
  * **Critical Implementation Detail:**
    * Directly querying `MediaList(userId: X, mediaId: Y)` causes a **HTTP 404** if the user hasn't seen the anime, causing the entire batch to fail.
    * **Solution:** We wrap each request in a `Page` query:
      ```graphql
      query {
        u101: Page(perPage: 1) { mediaList(userId: 101, mediaId: 555) { score } }
      }
      ```
    * This returns an **empty list** (`[]`) instead of an error if not found, making the query robust.

#### 3. Session Caching

* **Performance:** Calculated stats for detailed views are cached in a `Map<MediaID, Stats>` within the composable.
* **Behavior:**
  * Opening a modal for the same Anime twice results in **zero** network requests (instant load).
  * **Invalidation:** The cache is automatically cleared (`map.clear()`) whenever the main User chang

### D. Aesthetic Score System

* **Problem:** API returns scores in various formats (100, 10, 5, Smiley).
* **Solution:** We request `POINT_10` or `POINT_5` but normalize everything internally to a 1-10 scale.
* **Visuals:**
  * Scores >= 8: Green.
  * Scores >= 6: Orange.
  * Scores < 6: Red.
  * Rendered as a CSS-bordered circle or Star Icons.

***

## 4. UI/UX Design System

The app does not use a CSS framework. It relies on a consistent set of CSS Variables defined in `App.vue`.

* **Palette:** Deep Blue Ocean Theme.
  * Bg: `#0b2545` (Radial Gradient for depth).
  * Card: `#134074`.
  * Accent: `#3b82f6` (Electric Blue).
* **Glassmorphism:** Sidebars use `backdrop-filter: blur(12px)` and semi-transparent backgrounds `rgba(19, 49, 92, 0.6)`.
* **Interaction:**
  * **Shimmer Loading:** CSS Keyframe animation on `SkeletonCard.vue`.
  * **Hover Reveal:** Cards show only the cover initially. Metadata overlays on hover.
  * **Scroll Masking:** The main grid uses `mask-image: linear-gradient(...)` to soft-fade content at the top and bottom edges.

***

## 5. API Reference (Anilist GraphQL)

* **Endpoint:** `https://graphql.anilist.co`
* **Docs:** [Anilist API Docs](https://anilist.gitbook.io/anilist-apiv2-docs/)
* **Key Queries used in `src/api/anilist.ts`**:
  * `MediaListCollection`: Main bulk fetch.
  * `User`: To resolve Username -> ID.
  * `Page.following`: To get social connections.

***

## 6. How to Extend (Developer Guide)

### Adding a new Filter

1. **State:** Add `selectedNewFilter` ref in `App.vue`.
2. **UI:** Add control in `SidebarLeft.vue` and emit update event.
3. **Logic:** Add condition to `processedEntries` computed property in `App.vue`.

### Improving Social Graph

Currently, `analyzeFollower` only fetches the *first* chunk (100 items) of a friend's library to save bandwidth.

* **Improvement:** Modify `useSocialGraph.ts` to implement recursion/pagination to fetch the *full* library of a friend if needed.

### Adding "Watch Party" Feature

* **Idea:** Mark anime that >3 friends are currently "Watching".
* **Impl:** Update `useSocialGraph.ts` -> `inspectMedia` to also map `status`. Add visual indicator in `MediaDetailModal`.

### Extending Batch Limit

* **Current:** `fetchMediaStatsForUsers` puts all IDs in one query.
* **Risk:** If followers > 50, query might be too large.
* **Fix:** Split `userIds` array into chunks of 50 and run `Promise.all`.

***

**Note for AI:** When modifying this codebase, always respect the separation of concerns:

* Fetching logic goes to `api/`.
* Stateful logic goes to `composables/`.
* Keep `App.vue` clean by only orchestrating these parts.

## 7. CI/CD & Quality Engineering

We use a "Bleeding Edge" pipeline focused on speed and correctness.

### The Pipeline (GitHub Actions)
Located in `.github/workflows/ci.yml`.

1.  **Linting (Oxlint):** Replaces ESLint for general code quality. Runs in milliseconds via Rust-based parser.
2.  **Type Checking (vue-tsc):** Validates TypeScript in `.ts` and `.vue` files (which Oxlint currently doesn't cover fully).
3.  **Testing (Vitest):** Runs unit tests.

### How to run checks locally
```bash
pnpm lint:ox    # Run Oxlint
pnpm type-check # Run full TS check
pnpm test       # Run tests
```