import { CACHE_KEYS } from "@/lib/app-config";

export type FeedbackSource = "positive" | "negative";
export type FeedbackCategory = "Ready to Post" | "Private Queue" | "Escalated";

export type FeedbackRecord = {
  id: string;
  source: FeedbackSource;
  service_date: string;
  job_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  branch: string;
  service_done: string;
  manager: string;
  feedback: string;
  ai_feedback_response: string;
  sentiment_score: string;
  severity: string;
};

function value(raw: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const candidate = raw[key];
    if (candidate !== undefined && candidate !== null && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }
  return "";
}

export function normalizeFeedback(
  raw: Record<string, unknown>,
  source: FeedbackSource,
  index: number,
): FeedbackRecord {
  const jobId = value(raw, "job_id", "jobId", "Job ID");
  const serviceDate = value(
    raw,
    "service_date",
    "serviceDate",
    "Service Date",
    "created_at",
    "date",
  );
  const feedback =
    source === "positive"
      ? value(
          raw,
          "positive_feedback",
          "positiveFeedback",
          "Positive Feedback",
          "feedback",
          "comment",
        )
      : value(
          raw,
          "negative_feedback",
          "negativeFeedback",
          "Negative Feedback",
          "feedback",
          "comment",
        );
  return {
    id: value(raw, "id", "feedback_id") || `${source}-${jobId || serviceDate || index}-${index}`,
    source,
    service_date: serviceDate,
    job_id: jobId,
    customer_name: value(raw, "customer_name", "customerName", "Customer Name", "name"),
    customer_phone: value(raw, "customer_phone", "customerPhone", "Customer Phone", "phone"),
    customer_email: value(raw, "customer_email", "customerEmail", "Customer Email", "email"),
    branch: value(raw, "branch", "location", "Branch"),
    service_done: value(raw, "service_done", "serviceDone", "Service Done", "service"),
    manager: value(raw, "manager", "manager_email", "managerEmail", "Manager"),
    feedback,
    ai_feedback_response: value(
      raw,
      "ai_feedback_response",
      "aiFeedbackResponse",
      "AI Feedback Response",
      "response",
    ),
    sentiment_score: value(raw, "sentiment_score", "sentimentScore", "Sentiment Score", "score"),
    severity: value(raw, "severity", "Severity").toLowerCase() || "none",
  };
}

export function feedbackCategory(record: FeedbackRecord): FeedbackCategory {
  if (record.source === "positive") return "Ready to Post";
  return ["high", "critical", "repeat negative respond", "repeat negative response"].includes(
    record.severity,
  )
    ? "Escalated"
    : "Private Queue";
}

export function loadFeedbackCache(source: FeedbackSource): FeedbackRecord[] {
  if (typeof window === "undefined") return [];
  const key = source === "positive" ? CACHE_KEYS.positiveFeedback : CACHE_KEYS.negativeFeedback;
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "[]") as FeedbackRecord[];
  } catch {
    return [];
  }
}

export function saveFeedbackCache(source: FeedbackSource, records: FeedbackRecord[]) {
  const key = source === "positive" ? CACHE_KEYS.positiveFeedback : CACHE_KEYS.negativeFeedback;
  sessionStorage.setItem(key, JSON.stringify(records));
}
