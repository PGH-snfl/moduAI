# K-GenAI Nexus (Modu AI) Project History

This document serves as a historical record of the development process, design decisions, and implementation phases for the Modu AI platform.

## 1. Project Goals
**Objective**: Build a "Generative AI Service Search & Optimization Platform" for Korean users.
**Key Features**:
- Search & Compare AI tools.
- Focus on Korean language support & domestic payment accessibility.
- "Dark Mode" first UI with premium aesthetics.

## 2. Implementation Phases & Milestones

### Phase 1: Foundation (Setup & DB)
- **Tech Stack**: Vite, React, TypeScript, Tailwind CSS, Shadcn/UI.
- **Database**: Supabase schema designed for `tools`, `categories`, and `reviews`.
- **MVP Strategy**: Used `mockData.ts` to simulate database responses for rapid frontend development without backend dependency.

### Phase 2 & 3: Core UI & Filtering
- **Design System**: Established "Deep Blue" (`#0F172A`) & "Vivid Purple" (`#8B5CF6`) theme.
- **Typography**:
  - *Titles*: "Tmon Monsori" (Unique Branding).
  - *Headlines*: "Yeogi Eottae Jalnan" (Punchy/Friendly).
  - *Body*: "Arita Buri" (Readable Serif).
- **Features**:
  - Global Layout (Header/Footer).
  - Infinite Scroll Tool Grid.
  - Faceted Filter Sidebar (Category, Price, Korean Support).

### Phase 4: SEO & Detail Pages
- **SEO**: Implemented `react-helmet-async` for dynamic meta tags and JSON-LD structured data.
- **AEO**: Generated `llms.txt` for AI crawlers.
- **Detail Page**: Dedicated routes (`/tool/:id`) with full specs.

### Phase 6 & 7: Interactive Enhancements (Modal Redesign)
*Goal: Move from static pages to a "Vibe" coding style with rich interactivity.*
- **Architecture Change**: Switched from full-page details to **Radix UI Dialog Modals**.
- **Data Visualization**:
  - Implemented custom **SVG Popularity Chart** (replacing Recharts for React 19 stability).
  - Features: "Draw" animation, clean gradients, and explicit Min/Max markers.
- **User Experience**:
  - Added "Card Hover Scale" effects.
  - Added "Weekly/Monthly" toggle for traffic stats.

### Phase 8: Sorting Optimization
*Goal: Refine how users discover tools.*
- **Algorithm Updates**:
  - **Recognition (Default)**: Sorts by `visit_count` (Mock data enriched with realistic values for Gemini, ChatGPT, etc.).
  - **Popularity**: Weighted score relative to star ratings (`rating * 10000 + reviews`).
  - **Updated**: Sorts by `updated_at`.
- **UI**: Added "Sort By" dropdown to the main grid header.

### Phase 9: Real Estate Style Redesign (Virtual Deployment)
*Goal: Major layout overhaul to match "Real Estate App" usability standards and emphasize 'Domestic AI'.*
- **Navigation & Routing**:
  - **Split Pages**: Separated `HomePage` (Landing with Hero/Ad) and `ToolsPage` (Full Tool List).
  - **Global Header**: Moved Search Bar to the top Global Header. Renamed links to **Ranking** (Tools), **Report**, **Community**.
  - **Login Button**: Updated to Brand Purple style for visibility.
- **Filtering Innovation**:
  - **Domestic AI Only**: Replaced "Korean Support" with a strict **"Domestic AI Only"** filter (`is_domestic` flag) to highlight Korean services.
  - **Horizontal Categories**: Changed stacked sidebar categories to a modern horizontal button list.
  - **No Sidebar**: Removed side panel for a wider, cleaner grid view.

## 3. Key Design Decisions (Deviations)
- **Chart Library**: removed `recharts` in favor of a lightweight **Custom SVG** component to avoid React 19 compat issues.
- **Data Source**: Remained on `MOCK_TOOLS` for the MVP phase to ensure a stable demo environment before Supabase integration.
- **Font Loading**: Used direct `@font-face` CDN links in `index.css` for optimal performance without local asset complexity.

## 4. Verification
- **Logos**: Validated all 45+ tool logos load correctly.
- **Sorting**: verified "Recognition" sort places top tools (ChatGPT, Gemini) at the top.
- **Responsive**: Confirmed Sidebar hides on mobile (future: add mobile drawer).

### Phase 10: Content Enrichment & Report Page Overhaul
*Goal: Transform the platform into a "Daily AI Hub" with dynamic content and deeper insights.*
- **Report Page Reconstruction**:
  - **3-Column Top Layout**: Unified "Sector Share", "Sector Rankings" (Multi-tab), and "Market Leaders" into a balanced grid.
  - **Daily AI News**: Added a tabbed news section (Domestic/Global) with badge indicators.
  - **Pricing & API Analysis**: Refactored into a sleek horizontal bar chart at the footer.
- **Home Page Expansion**:
  - **Weekly Hot AI Works**: New section showcasing viral AI content from YouTube/Instagram/TikTok.
  - **Top 5 AI Technologies**: Highlighting major conferences (NeurIPS, CVPR, etc.) with representative high-quality imagery.
  - **Ad Board**: "Useful AI Services" section restyled as a premium startup advertisement.
- **Visual Polish**:
  - **Tech Imagery**: Replaced static conference logos with immersive photos representing each domain (e.g., 3D scanning, Brain circuits).


### Phase 11: Workspace Optimization & Skill Integration
*Goal: Systematize the development environment for efficiency and scalability.*
- **Documentation Organization**:
  - Structured `docs/` folder into `management/`, `system/`, and `design/`.
  - Standardized all documentation filenames to `snake_case`.
  - Consolidated `WORKFLOW_RULES.md` into `docs/system/antigravity.md`.
- **Skill Definition**:
  - Created standardized `skills/` for repetitive tasks: `update_daily_news`, `update_viral_trends`, `git_sync_project`, `add_new_ai_service`.
- **New Tools DB**:
  - Added **DeeVid AI** and **Pippit AI** to `mockData.ts`.
