export const DEFAULT_WEBHOOK_URLS = {
  postEvent: "https://reubenedidiong.app.n8n.cloud/webhook/costomer_details",
  getJobs: "https://reubenedidiong.app.n8n.cloud/webhook-test/get_costomer_details",
  getPositiveFeedback: "https://reubenedidiong.app.n8n.cloud/webhook/get_positive_feedback",
  getNegativeFeedback: "https://reubenedidiong.app.n8n.cloud/webhook/get_negative_feedback",
} as const;

export const CACHE_KEYS = {
  jobs: "cc072_jobs",
  positiveFeedback: "cc072_positive_feedback",
  negativeFeedback: "cc072_negative_feedback",
  webhooks: "cc072_webhooks",
} as const;

export const PAGE_SIZE = 50;