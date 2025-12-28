# AniView - Advanced Anilist Dashboard

A modern, high-performance dashboard to view Anime/Manga lists from Anilist.co using GraphQL.

## Tech Stack
- **Framework:** Vue 3 (Composition API, `<script setup>`)
- **Language:** TypeScript (Strict)
- **Data Fetching:** TanStack Query (Infinite Scroll, Caching)
- **Styling:** CSS3 (Variables, Grid, Glassmorphism)
- **Tooling:** Vite

## Architecture

This project follows a separation of concerns pattern:

- `api/`: Contains pure fetch functions isolated from UI logic.
- `composables/`: Contains stateful logic (Hooks). `useMediaList` handles the infinite pagination and data flattening.
- `components/`: Pure presentational components.
  - `SidebarLeft/Right`: Handle user input and filtering visualization.
  - `MediaGrid`: Handles the layout.
- `types/`: Shared TypeScript interfaces to ensure type safety across the app.

## Key Features
- **Client-Side Filtering:** Data is fetched in chunks, but filtering (Status, Genres) happens instantly on the client for best UX.
- **Virtualization-ready:** The grid uses responsive layouts.
- **Aesthetic UI:** Dark mode, glassmorphism sidebars, and soft scroll masking.

## Setup

```bash
pnpm install
pnpm dev
```
