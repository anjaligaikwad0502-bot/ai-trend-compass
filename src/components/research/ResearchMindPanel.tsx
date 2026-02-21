import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Brain, Shield, AlertTriangle, Search, Lightbulb,
  CheckCircle2, XCircle, HelpCircle, ChevronDown, ChevronUp,
  Loader2, Zap, FileWarning, Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface ResearchAnalysis {
  claims: { text: string; type: string; strength: string }[];
  supporting_papers: { title: string; relation: string }[];
  conflicting_papers: { title: string; contradiction: string }[];
  contradictions: { description: string; severity: string }[];
  evidence_gaps: string[];
  devils_advocate: { challenge: string; target_claim: string }[];
  confidence_score: number;
  confidence_explanation: string;
  reasoning_summary: string;
}

export type PipelineStage = 'idle' | 'searching' | 'extracting' | 'comparing' | 'reasoning' | 'report' | 'done' | 'error';

interface ResearchMindPanelProps {
  isOpen: boolean;
  onClose: () => void;
  paperTitle: string;
  analysis: ResearchAnalysis | null;
  stage: PipelineStage;
  error?: string | null;
}

const stageConfig: Record<string, { label: string; icon: typeof Search; progress: number }> = {
  searching: { label: 'Searching related papers…', icon: Search, progress: 20 },
  extracting: { label: 'Extracting claims…', icon: Zap, progress: 40 },
  comparing: { label: 'Cross-paper comparison…', icon: Scale, progress: 60 },
  reasoning: { label: 'Autonomous reasoning…', icon: Brain, progress: 80 },
  report: { label: 'Generating report…', icon: Lightbulb, progress: 95 },
  done: { label: 'Analysis complete', icon: CheckCircle2, progress: 100 },
};

const strengthColor: Record<string, string> = {
  strong: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  moderate: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  weak: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

const severityColor: Record<string, string> = {
  high: 'text-rose-500',
  medium: 'text-amber-500',
  low: 'text-muted-foreground',
};

export function ResearchMindPanel({ isOpen, onClose, paperTitle, analysis, stage, error }: ResearchMindPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('claims');

  const toggle = (section: string) => setExpandedSection(prev => prev === section ? null : section);

  const isLoading = stage !== 'idle' && stage !== 'done' && stage !== 'error';
  const currentStage = stageConfig[stage];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg glass-strong border-l border-border/50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold">ResearchMind</h2>
                  <p className="text-xs text-muted-foreground truncate">{paperTitle}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Pipeline Progress */}
            {isLoading && currentStage && (
              <div className="px-4 py-3 border-b border-border/50 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-muted-foreground">{currentStage.label}</span>
                </div>
                <Progress value={currentStage.progress} className="h-1.5" />
                <div className="flex gap-1">
                  {Object.keys(stageConfig).filter(s => s !== 'done').map(s => (
                    <div
                      key={s}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-colors',
                        Object.keys(stageConfig).indexOf(s) <= Object.keys(stageConfig).indexOf(stage)
                          ? 'bg-primary'
                          : 'bg-muted'
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {stage === 'error' && (
              <div className="p-4 m-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                <FileWarning className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Analysis failed</p>
                  <p className="text-xs text-muted-foreground mt-1">{error || 'An unexpected error occurred.'}</p>
                </div>
              </div>
            )}

            {/* Results */}
            {analysis && stage === 'done' && (
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {/* Confidence Score */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        Confidence Score
                      </span>
                      <span className={cn(
                        'text-2xl font-bold',
                        analysis.confidence_score >= 0.7 ? 'text-emerald-500' :
                        analysis.confidence_score >= 0.4 ? 'text-amber-500' : 'text-rose-500'
                      )}>
                        {Math.round(analysis.confidence_score * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={analysis.confidence_score * 100}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">{analysis.confidence_explanation}</p>
                  </div>

                  {/* Summary */}
                  <div className="p-3 rounded-xl bg-secondary/30 text-sm text-muted-foreground">
                    {analysis.reasoning_summary}
                  </div>

                  {/* Claims */}
                  <CollapsibleSection
                    title="Key Claims"
                    icon={Zap}
                    count={analysis.claims.length}
                    isOpen={expandedSection === 'claims'}
                    onToggle={() => toggle('claims')}
                  >
                    <div className="space-y-2">
                      {analysis.claims.map((c, i) => (
                        <div key={i} className="p-3 rounded-lg bg-secondary/20 space-y-1.5">
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className={cn('text-[10px] shrink-0 mt-0.5', strengthColor[c.strength] || '')}>
                              {c.strength}
                            </Badge>
                            <p className="text-sm">{c.text}</p>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">{c.type}</Badge>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Supporting Papers */}
                  {analysis.supporting_papers.length > 0 && (
                    <CollapsibleSection
                      title="Supporting Papers"
                      icon={CheckCircle2}
                      count={analysis.supporting_papers.length}
                      isOpen={expandedSection === 'supporting'}
                      onToggle={() => toggle('supporting')}
                    >
                      <div className="space-y-2">
                        {analysis.supporting_papers.map((p, i) => (
                          <div key={i} className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                            <p className="text-sm font-medium">{p.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{p.relation}</p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Conflicting Papers */}
                  {analysis.conflicting_papers.length > 0 && (
                    <CollapsibleSection
                      title="Conflicting Papers"
                      icon={XCircle}
                      count={analysis.conflicting_papers.length}
                      isOpen={expandedSection === 'conflicting'}
                      onToggle={() => toggle('conflicting')}
                    >
                      <div className="space-y-2">
                        {analysis.conflicting_papers.map((p, i) => (
                          <div key={i} className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                            <p className="text-sm font-medium">{p.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{p.contradiction}</p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Contradictions */}
                  {analysis.contradictions.length > 0 && (
                    <CollapsibleSection
                      title="Contradiction Highlights"
                      icon={AlertTriangle}
                      count={analysis.contradictions.length}
                      isOpen={expandedSection === 'contradictions'}
                      onToggle={() => toggle('contradictions')}
                    >
                      <div className="space-y-2">
                        {analysis.contradictions.map((c, i) => (
                          <div key={i} className="p-3 rounded-lg bg-secondary/20 flex items-start gap-2">
                            <AlertTriangle className={cn('w-4 h-4 mt-0.5 shrink-0', severityColor[c.severity])} />
                            <div>
                              <p className="text-sm">{c.description}</p>
                              <Badge variant="outline" className="text-[10px] mt-1">{c.severity} severity</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Evidence Gaps */}
                  {analysis.evidence_gaps.length > 0 && (
                    <CollapsibleSection
                      title="Evidence Gaps"
                      icon={HelpCircle}
                      count={analysis.evidence_gaps.length}
                      isOpen={expandedSection === 'gaps'}
                      onToggle={() => toggle('gaps')}
                    >
                      <ul className="space-y-1.5">
                        {analysis.evidence_gaps.map((g, i) => (
                          <li key={i} className="text-sm flex items-start gap-2 text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                            {g}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                  )}

                  {/* Devil's Advocate */}
                  {analysis.devils_advocate.length > 0 && (
                    <CollapsibleSection
                      title="Devil's Advocate"
                      icon={Scale}
                      count={analysis.devils_advocate.length}
                      isOpen={expandedSection === 'devils'}
                      onToggle={() => toggle('devils')}
                    >
                      <div className="space-y-2">
                        {analysis.devils_advocate.map((d, i) => (
                          <div key={i} className="p-3 rounded-lg bg-secondary/20 space-y-1">
                            <p className="text-sm font-medium">{d.challenge}</p>
                            <p className="text-xs text-muted-foreground">
                              Re: <span className="italic">{d.target_claim}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}
                </div>
              </ScrollArea>
            )}

            {/* Loading placeholder */}
            {isLoading && !analysis && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Brain className="w-12 h-12 text-primary/30 mx-auto animate-pulse" />
                  <p className="text-sm text-muted-foreground">ResearchMind is thinking…</p>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CollapsibleSection({
  title, icon: Icon, count, isOpen, onToggle, children
}: {
  title: string;
  icon: typeof Search;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="w-4 h-4 text-primary" />
          {title}
          <Badge variant="secondary" className="text-[10px] ml-1">{count}</Badge>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
