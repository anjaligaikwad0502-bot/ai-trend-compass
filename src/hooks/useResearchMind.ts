import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContentItem } from '@/lib/api/content';
import type { ResearchAnalysis, PipelineStage } from '@/components/research/ResearchMindPanel';

export function useResearchMind() {
  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [analysis, setAnalysis] = useState<ResearchAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePaper, setActivePaper] = useState<ContentItem | null>(null);

  const analyze = useCallback(async (paper: ContentItem, allContent: ContentItem[]) => {
    setActivePaper(paper);
    setIsOpen(true);
    setAnalysis(null);
    setError(null);

    // Simulate pipeline stages for UX
    const stages: PipelineStage[] = ['searching', 'extracting', 'comparing', 'reasoning', 'report'];

    // Find related papers (same tags or content_type)
    const relatedPapers = allContent
      .filter(item =>
        item.id !== paper.id &&
        (item.content_type === 'paper' || item.tags.some(t => paper.tags.includes(t)))
      )
      .slice(0, 8);

    // Progress through stages with delays
    let currentStageIndex = 0;
    const advanceStage = () => {
      if (currentStageIndex < stages.length) {
        setStage(stages[currentStageIndex]);
        currentStageIndex++;
      }
    };

    advanceStage(); // searching
    const stageInterval = setInterval(advanceStage, 2500);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('research-mind', {
        body: {
          paper: {
            id: paper.id,
            title: paper.title,
            summary: paper.summary,
            tags: paper.tags,
            author: paper.author,
            source: paper.source,
            arxiv_id: paper.arxiv_id,
          },
          relatedPapers: relatedPapers.map(p => ({
            id: p.id,
            title: p.title,
            summary: p.summary,
            tags: p.tags,
            author: p.author,
            source: p.source,
          })),
        },
      });

      clearInterval(stageInterval);

      if (fnError) {
        setStage('error');
        setError(fnError.message || 'Analysis failed');
        return;
      }

      if (data?.error) {
        setStage('error');
        setError(data.error);
        return;
      }

      setAnalysis(data.data);
      setStage('done');
    } catch (err) {
      clearInterval(stageInterval);
      setStage('error');
      setError(err instanceof Error ? err.message : 'Unexpected error');
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Reset after animation
    setTimeout(() => {
      setStage('idle');
      setAnalysis(null);
      setError(null);
      setActivePaper(null);
    }, 300);
  }, []);

  return { isOpen, stage, analysis, error, activePaper, analyze, close };
}
