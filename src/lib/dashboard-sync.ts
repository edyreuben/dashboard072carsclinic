import { fetchAllRecords } from "@/lib/webhook.functions";
import {
  loadSessionRows,
  normalizeRecord,
  saveSessionRows,
  type JobRecord,
  type WebhookConfig,
} from "@/lib/jobs";
import {
  loadFeedbackCache,
  normalizeFeedback,
  saveFeedbackCache,
  type FeedbackRecord,
} from "@/lib/feedback";
import type { WebhookFailure } from "@/lib/webhook-diagnostics";

export type DashboardData = {
  jobs: JobRecord[];
  positiveFeedback: FeedbackRecord[];
  negativeFeedback: FeedbackRecord[];
  failures: WebhookFailure[];
};

export async function syncDashboardData(config: WebhookConfig): Promise<DashboardData> {
  const sources = [
    ["Get Customer/Job Webhook", config.getJobs],
    ["Get Positive Feedback Webhook", config.getPositiveFeedback],
    ["Get Negative Feedback Webhook", config.getNegativeFeedback],
  ] as const;
  const results = await Promise.all(
    sources.map(async ([name, url]) => ({
      name,
      result: url
        ? await fetchAllRecords({ data: { url } })
        : { ok: false, status: 0, records: [], error: "Webhook URL is not configured" },
    })),
  );
  const [jobsResult, positiveResult, negativeResult] = results;
  const jobsRaw = jobsResult?.result.records ?? [];
  const positiveRaw = positiveResult?.result.records ?? [];
  const negativeRaw = negativeResult?.result.records ?? [];
  const fetchedJobs = jobsRaw
    .map((item) => normalizeRecord(item as Record<string, unknown>))
    .filter((item): item is JobRecord => item !== null);
  const fetchedPositive = positiveRaw.map((item, index) =>
    normalizeFeedback(item as Record<string, unknown>, "positive", index),
  );
  const fetchedNegative = negativeRaw.map((item, index) =>
    normalizeFeedback(item as Record<string, unknown>, "negative", index),
  );
  // A successful empty webhook response is authoritative: clear the old
  // cache instead of falling back to stale records from the previous sync.
  const jobs = jobsResult.result.ok ? fetchedJobs : loadSessionRows();
  const positiveFeedback = positiveResult.result.ok
    ? fetchedPositive
    : loadFeedbackCache("positive");
  const negativeFeedback = negativeResult.result.ok
    ? fetchedNegative
    : loadFeedbackCache("negative");
  if (jobsResult.result.ok) saveSessionRows(fetchedJobs);
  if (positiveResult.result.ok) saveFeedbackCache("positive", fetchedPositive);
  if (negativeResult.result.ok) saveFeedbackCache("negative", fetchedNegative);
  return {
    jobs,
    positiveFeedback,
    negativeFeedback,
    failures: results
      .filter(({ result }) => !result.ok)
      .map(({ name, result }) => ({
        name,
        status: result.status,
        error: result.error || `HTTP ${result.status}: Empty response; no records returned`,
      })),
  };
}
