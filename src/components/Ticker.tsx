export type StreamEvent =
  | { type: 'phase'; phase: 'crawl_start' | 'crawl_done' | 'score_done' | 'enrich_start' }
  | { type: 'enrich_progress'; done: number; total: number }
  | { type: 'done'; leads: unknown[]; stats: Record<string, unknown>; warning?: string }
  | { type: 'error'; error: string };
