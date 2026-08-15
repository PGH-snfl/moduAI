import { useMemo } from 'react';

interface HighlightResult {
  text: string;
  matches: boolean;
}

export function useSearchHighlight(text: string, searchQuery: string): HighlightResult[] {
  return useMemo(() => {
    if (!searchQuery.trim()) {
      return [{ text, matches: false }];
    }

    const query = searchQuery.toLowerCase();
    const normalizedText = text.toLowerCase();
    const result: HighlightResult[] = [];
    
    let lastIndex = 0;
    let matchIndex = normalizedText.indexOf(query);

    while (matchIndex !== -1) {
      // Add non-matching text before this match
      if (matchIndex > lastIndex) {
        result.push({
          text: text.slice(lastIndex, matchIndex),
          matches: false,
        });
      }

      // Add matching text
      result.push({
        text: text.slice(matchIndex, matchIndex + query.length),
        matches: true,
      });

      lastIndex = matchIndex + query.length;
      matchIndex = normalizedText.indexOf(query, lastIndex);
    }

    // Add remaining non-matching text
    if (lastIndex < text.length) {
      result.push({
        text: text.slice(lastIndex),
        matches: false,
      });
    }

    return result;
  }, [text, searchQuery]);
}

interface HighlightTextProps {
  text: string;
  searchQuery: string;
  highlightClassName?: string;
}

export function HighlightText({
  text,
  searchQuery,
  highlightClassName = 'bg-brand-purple/30 text-brand-purple font-semibold',
}: HighlightTextProps) {
  const segments = useSearchHighlight(text, searchQuery);

  return (
    <span>
      {segments.map((segment, index) => {
        if (segment.matches) {
          return (
            <span key={index} className={highlightClassName}>
              {segment.text}
            </span>
          );
        }
        return <span key={index}>{segment.text}</span>;
      })}
    </span>
  );
}
