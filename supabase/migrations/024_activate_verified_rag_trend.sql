update public.ai_technology_trends
set is_active = true,
    display_order = 5,
    updated_at = timezone('utc'::text, now())
where source_label = 'OpenAlex 자동수집 · RAG'
  and paper_count_7d > 0
  and jsonb_array_length(representative_papers) > 0;
