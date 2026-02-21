'use client';

import { useState, useEffect, useCallback } from 'react';
import { OverviewCards } from './OverviewCards';
import { GapRadar } from './GapRadar';
import { CoOccurrenceTable } from './CoOccurrenceTable';
import { EntryPointsList } from './EntryPointsList';
import { TranslationDictionary } from './TranslationDictionary';
import { EngagementMetrics } from './EngagementMetrics';

interface DashboardData {
  gapTopics: Array<{
    topic: string;
    phrase: string;
    count: number;
    sampleConversationIds: string[];
  }>;
  coOccurrence: Array<{
    pattern1: number;
    pattern2: number;
    count: number;
    isConnectedInNetwork: boolean;
  }>;
  entryPoints: Array<{
    readingOrder: number;
    patternId: number;
    patternName: string;
    count: number;
    percentage: number;
  }>;
  translationMap: Array<{
    userQuery: string;
    patterns: number[];
    count: number;
  }>;
  engagement: {
    totalConversations: number;
    avgPatternsPerConversation: number;
    totalGapsDetected: number;
    totalEntryPoints: number;
  };
  meta: {
    lastProcessedAt: string | null;
    totalSummaries: number;
  };
}

interface ProcessingResult {
  conversationsProcessed: number;
  eventsCreated: number;
  errors: string[];
}

export function GuideIntelligenceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ProcessingResult | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics/data');
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProcess = async (fullReprocess = false) => {
    setProcessing(true);
    setLastResult(null);

    try {
      const res = await fetch('/api/admin/analytics/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullReprocess }),
      });

      if (!res.ok) throw new Error('Processing failed');

      const result = await res.json();
      setLastResult(result);

      // Refresh data after processing
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="spinner w-6 h-6 mr-3" />
        <span className="text-slate">Loading analytics...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-card p-6 text-red-700">
        <p className="font-semibold">Error loading analytics</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={() => fetchData()}
          className="mt-4 btn btn-secondary"
        >
          Retry
        </button>
      </div>
    );
  }

  const lastProcessed = data?.meta.lastProcessedAt
    ? new Date(data.meta.lastProcessedAt).toLocaleString()
    : 'Never';

  return (
    <div className="space-y-8">
      {/* Control Bar */}
      <div className="bg-white rounded-card border border-slate/10 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-slate">
          Last processed: <span className="font-mono text-charcoal">{lastProcessed}</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleProcess(false)}
            disabled={processing}
            className="btn btn-secondary"
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <span className="spinner w-4 h-4" />
                Processing...
              </span>
            ) : (
              'Refresh Analytics'
            )}
          </button>
          <button
            onClick={() => handleProcess(true)}
            disabled={processing}
            className="btn btn-primary"
          >
            Full Reprocess
          </button>
        </div>
      </div>

      {/* Processing Result */}
      {lastResult && (
        <div className={`rounded-card border p-4 ${
          lastResult.errors.length > 0
            ? 'bg-amber-50 border-amber-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <p className="font-semibold text-charcoal">
            Processed {lastResult.conversationsProcessed} conversations,
            created {lastResult.eventsCreated} events
          </p>
          {lastResult.errors.length > 0 && (
            <ul className="mt-2 text-sm text-amber-700 list-disc list-inside">
              {lastResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {data && (
        <>
          {/* Overview Cards */}
          <OverviewCards
            totalConversations={data.engagement.totalConversations}
            totalGaps={data.gapTopics.length}
            totalEntryPatterns={data.entryPoints.length}
            avgPatterns={data.engagement.avgPatternsPerConversation}
          />

          {/* Main Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Gap Radar */}
            <GapRadar gaps={data.gapTopics} />

            {/* Entry Points */}
            <EntryPointsList entryPoints={data.entryPoints} />
          </div>

          {/* Co-Occurrence Table */}
          <CoOccurrenceTable coOccurrences={data.coOccurrence} />

          {/* Translation Dictionary */}
          <TranslationDictionary translations={data.translationMap} />

          {/* Engagement Metrics */}
          <EngagementMetrics engagement={data.engagement} />
        </>
      )}
    </div>
  );
}
