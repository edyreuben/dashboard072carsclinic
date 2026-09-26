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

export type DashboardData = {
  jobs: JobRecord[];
  positiveFeedback: FeedbackRecord[];
  negativeFeedback: FeedbackRecord[];
  failedSources: string[];
};

export async function syncDashboardData(config: WebhookConfig): Promise<DashboardData> {
  const sources = [
    ["Customer / Job", config.getJobs],
    ["Positive Feedback", config.getPositiveFeedback],
    ["Negative Feedback", config.getNegativeFeedback],
  ] as const;
  const results = await Promise.all(
    sources.map(async ([name, url]) => ({
      name,
      result: url ? await fetchAllRecords({ data: { url } }) : { ok: false, status: 0, records: [] },
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
  const jobs = fetchedJobs.length ? fetchedJobs : loadSessionRows();
  const positiveFeedback = fetchedPositive.length
    ? fetchedPositive
    : loadFeedbackCache("positive");
  const negativeFeedback = fetchedNegative.length
    ? fetchedNegative
    : loadFeedbackCache("negative");
  if (fetchedJobs.length) saveSessionRows(fetchedJobs);
  if (fetchedPositive.length) saveFeedbackCache("positive", fetchedPositive);
  if (fetchedNegative.length) saveFeedbackCache("negative", fetchedNegative);
  return {
    jobs,
    positiveFeedback,
    negativeFeedback,
    failedSources: results
      .filter(({ result }) => !result.ok || result.records.length === 0)
      .map(({ name }) => name),
  };
}