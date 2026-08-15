# Project Design Philosophy (Locked)

> [!IMPORTANT]
> **STRICT DESIGN RULES**: The following design elements (Colors, Fonts, Text Content) are **FROZEN**.
> Do not modify these without explicit permissions from the user.

## 1. Color Palette (Invariant)

The background colors and the keypoint (brand) color are fixed.

### Background Colors
- **Day Mode (Light)**: Pure White (`#FFFFFF` / `0 0% 100%`)
- **Night Mode (Dark)**: Deep Blue (`#0F172A` / `222 47% 11%`)
  - *Note*: This specific shade of deep blue is integral to the "Night" theme.

### keypoint Color
- **Brand Purple**: Vivid Purple (`#8B5CF6` / `258 90% 66%` range)
  - Used for: Text highlights, Primary Buttons, Active States.
  - Class: `text-brand-purple`, `bg-brand-purple`

## 2. Typography & Fonts

The font selection creates a specific "Playful yet Professional" brand voice.

### Brand Title (Header)
- **Font**: **Tmon Monsori (티몬 몬소리체)**
- **Feeling**: Strong, thick, distinctive, distinct branding.
- **Selector**: `.font-tmon`
- **Text**: "모두의 AI"

### Main Headline (Hero)
- **Font**: **Yeogi Eottae Jalnan (여기어때 잘난체)**
- **Feeling**: Punchy, friendly, impactful.
- **Selector**: `.font-jalnan`
- **Text**:
  > "많아도 너~~~무 많아!!
  > 나에게 꼭 맞는 생성형 AI 서비스 검색"

### Sub-Headline (Hero)
- **Font**: **Arita Buri SemiBold (아리따 부리 / 돋움)**
- **Feeling**: Clean, modern serif, "Board-style" legibility.
- **Selector**: `.font-arita`
- **Text**:
  > "검색할 시간도 없습니다!
  > 여러분의 업무 시간을 단축시켜 줄 최고의 AI 도구를 찾으세요."

## 3. UI/UX Principles
- **Dark Mode Default**: The application should default to or prioritize the Dark Mode experience.
- **Visual Consistency**: Always maintain the hierarchy of Title (Tmon) -> Heading (Jalnan) -> Body/Subtext (Arita/Sans) to preserve the established identity.

### 4. Layout Strategy: "Modern Dashboard" (Real Estate App Style)
This specific layout style mimics high-density data applications (like Real Estate or Stock Trading apps) to maximize information visibility and ease of filtering.

#### A. Architecture
- **Full-Width Canvas**: DO NOT use vertical sidebars for navigation or filtering. The main content area should capture 100% of the horizontal width (max-width `container`).
- **Sticky Hierarchy**: Critical controls must remain visible while scrolling.
  - **Level 1 (Global)**: Top Navigation Bar (Logo, Search, User Auth).
  - **Level 2 (Context)**: Horizontal Category List (Sticky on Tool List page).
  - **Level 3 (Controls)**: Filter Toggles & Sort Dropdown (Inline bar).

#### B. Component Specifications
- **Global Search Bar**:
  - Properties: Wide (>500px), Centered in Global Header, Rounded-Full.
  - Behavior: Persistent across pages; drives URL query parameters (`?q=`).
- **Category Navigation (Chips)**:
  - Style: **Horizontal ScrollView** (Overflow-X).
  - **Active State**: Solid Black Background (`bg-black`), White Text (`text-white`), Rounded-Full.
  - **Inactive State**: White Background (`bg-white`), Grey Text (`text-slate-600`), Thin Border.
  - Rationale: Allows quick context switching without taking up vertical space.
- **Filter Controls**:
  - Position: Right-aligned relative to the content grid.
  - Style: Minimalist inline checkboxes (e.g., "Domestic AI Only") + Simple Sort Dropdown.
  - **No Accordions**: Do not hide filters inside expandable menus; keep critical toggles exposed.

#### C. Grid Density
- **Card Layout**: Responsive Grid (Mobile 1col, Tablet 2col, Desktop 3-4col).
- **Whitespace**: Minimal padding between cards (gap-4 or gap-6) to show more items per viewport.
