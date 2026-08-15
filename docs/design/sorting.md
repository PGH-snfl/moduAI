# Sorting Logic Documentation

This document outlines the specific formulas and metrics used for sorting tools in the K-GenAI Nexus platform. This logic is implemented in `src/hooks/useTools.ts`.

## 1. Recognition (인지도순) - Default
**Objective**: Prioritize tools with the highest search volume or site traffic.

- **Metric**: `visit_count` (Number)
- **Formula**: Sort Descending by `visit_count`
- **Code**:
  ```typescript
  data.sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0));
  ```
- **Note**: For mock data, popular tools (ChatGPT, Gemini, etc.) have manually assigned high values (e.g., 15,000,000). Others are assigned random values fallback.

## 2. Popularity (인기순/별점순)
**Objective**: Prioritize tools with the highest user satisfaction, balancing rating and review volume.

- **Metrics**: 
  - `average_rating` (0.0 - 5.0)
  - `review_count` (Integer)
- **Formula**: Weighted Score Descending
  ```typescript
  Score = (AverageRating * 10,000) + ReviewCount
  ```
- **Logic**: 
  - Primarily sorts by **Rating**. Multiplier `10,000` ensures that a 4.9 rating always beats a 4.8 rating regardless of review count (up to 9,999 reviews).
  - If ratings are equal (e.g., both 4.8), the one with more **Reviews** wins.
- **Code**:
  ```typescript
  data.sort((a, b) => {
      const scoreA = (a.average_rating || 0) * 10000 + (a.review_count || 0);
      const scoreB = (b.average_rating || 0) * 10000 + (b.review_count || 0);
      return scoreB - scoreA;
  });
  ```

## 3. Updated (업데이트순)
**Objective**: Prioritize tools that have been updated most recently.

- **Metric**: `updated_at` (ISO Date String)
- **Formula**: Sort Descending by Date
- **Code**:
  ```typescript
  data.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  ```
- **Fallback**: If `updated_at` is missing, `created_at` is used.

## 4. Latest (최신 등록순)
**Objective**: Show newly added tools first.

- **Metric**: `created_at` (ISO Date String)
- **Formula**: Sort Descending by Date
- **Code**:
  ```typescript
  data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  ```

## 5. Price (가격순)
**Objective**: Sort by starting price value.

- **Metric**: `pricing_start_at` (String, e.g., "$20/mo", "Free")
- **Parsing Logic**:
  - "Free" or null = `0`
  - Extracts first number found in string (e.g., "$19.99" -> `19.99`)
- **Formula**:
  - **Low to High**: `Price A - Price B`
  - **High to Low**: `Price B - Price A`
- **Code**:
  ```typescript
  function parsePrice(priceStr: string | null): number {
      if (!priceStr || priceStr.toLowerCase() === 'free') return 0;
      const match = priceStr.match(/(\d+(\.\d+)?)/);
      return match ? parseFloat(match[0]) : 0;
  }
  ```
