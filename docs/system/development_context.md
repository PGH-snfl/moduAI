# K-GenAI Nexus (Modu AI) Development Context

This document consolidates the technical context required to reproduce the current state of the "Modu AI" project. It includes dependency versions, configuration, database schema, and critical implementation logic.

## 1. Technology Stack
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7.2.4
- **Styling**: Tailwind CSS 3.4 + Shadcn/UI (Radix Primitives) + Lucide React
- **State Management**: TanStack Query v5
- **Routing**: React Router DOM v7 (Split: `/` Landing, `/tools` Ranking)

## 2. Project Structure
```text
src/
├── components/
│   ├── common/         # ToolDetailModal, PopularityChart (SVG)
│   ├── home/           # Hero (Landing Page CTA)
│   ├── layout/         # Header (Global Search, Nav), Footer
│   ├── tools/          # ToolGrid, ToolCard (No Sidebar)
│   └── ui/             # Shadcn primitives (Button, Card, etc.)
├── hooks/
│   ├── useTools.ts     # Main data fetching & sorting logic
│   ├── useToolModal.ts # Modal state
│   └── useTrafficData.ts # Mock chart data
├── lib/
│   ├── mockData.ts     # MOCK_TOOLS (Source of Truth for MVP, includes is_domestic flag)
│   └── utils.ts
├── pages/              # HomePage (Landing), ToolsPage (Ranking List)
└── types/
    └── supabase.ts     # Database Schema Definitions
```

## 3. Critical Configuration

### Tailwind Config (Theme & Fonts)
- **Dark Mode**: `class` strategy (Default: Dark)
- **Colors**:
  - Background: `hsl(var(--background))` (Deep Blue: `#0F172A`)
  - Brand Purple: `#8B5CF6` (Keypoint)
- **Fonts**:
  - `font-tmon`: "TmonMonsori" (Headers)
  - `font-jalnan`: "Yeogi Eottae Jalnan" (Hero Title)
  - `font-arita`: "Arita Buri" (Body/Sub)

### Key Interfaces (`src/types/supabase.ts`)
```typescript
interface Tool {
  id: string;
  name: string;
  description: string;
  visit_count?: number; // Critical for Recognition Sort
  updated_at?: string;  // Critical for Update Sort
  is_domestic?: boolean; // New: Filter for "Domestic AI Only" (Korean Services)
  average_rating: number;
  review_count: number;
  pricing_type: 'Free' | 'Freemium' | 'Paid';
  pricing_start_at: string | null;
  // ... other fields matching Supabase schema
}
```

## 4. Key Implementation Logic

### Sorting Logic (`useTools.ts`)
- **Recognition**: `b.visit_count - a.visit_count` (Requires mock data to have high `visit_count` for popular tools).
- **Popular**: Weighted score `(rating * 10000) + review_count`.
- **Price**: Parsed numeric value from strings like "$20/mo" or "Free".

### Filtering Logic
- **Search**: Checks `name`, `description` and mapped `keywords` (e.g., '논문' maps to '#학습').
- **Domestic AI Only**: Filters where `is_domestic === true` (manually flagged in `mockData.ts`).

### Custom SVG Chart (`PopularityChart.tsx`)
*Replaces Recharts due to React 19 compatibility issues.*
- **Technique**: Native SVG `<path>` generation using `L` commands.
- **Math**: Maps data points to a fixed `100x50` coordinate system.
- **Features**:
  - "Draw" animation using `stroke-dasharray`.
  - Explicit Min/Max textual markers.
  - Hover tooltip using coordinate calculations.

### Mock Data Strategy
- `MOCK_TOOLS` in `src/lib/mockData.ts` serves as the primary DB.
- **IMPORTANT**: Popular tools (Gemini, ChatGPT) MUST have high `visit_count` manually assigned to function with the "Recognition" sort.

## 5. CSS / Global Styles
- **Fonts**: `@font-face` definitions in `index.css` are required for Tmon, Jalnan, and Arita fonts to render correctly.
