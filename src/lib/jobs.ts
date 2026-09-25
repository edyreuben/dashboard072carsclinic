import { CACHE_KEYS, DEFAULT_WEBHOOK_URLS, PAGE_SIZE } from "@/lib/app-config";

export const BRANCHES = [
  "Ikeja Branch (Lagos)",
  "Victoria Island Branch (Lagos)",
  "Abuja Main Branch",
  "Port Harcourt Central",
] as const;

export const SERVICES = [
  "Oil Change & Filter Replacement",
  "Brake System Inspection & Pad Replacement",
  "Transmission Fluid Flush",
  "Wheel Alignment & Tire Balancing",
  "AC Inspection & Gas Refill",
  "Engine Diagnostics & Tuning",
  "Battery Test & Replacement",
  "Suspension & Shock Absorber Repair",
  "Comprehensive Vehicle Inspection",
  "Auto Body Repair & Painting",
] as const;

export const OTHERS = "Others (Specify)";

export const STATUSES = ["Pending", "In Progress", "Completed", "Cancelled"] as const;

export type JobStatus = (typeof STATUSES)[number];

export type JobRecord = {
  job_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  manager_email: string;
  branch: string;
  service_done: string;
  job_status: JobStatus;
  completed_at: string;
};

export type WebhookConfig = {
  postEvent: string;
  getJobs: string;
  getPositiveFeedback: string;
  getNegativeFeedback: string;
};

export const DEFAULT_WEBHOOKS: WebhookConfig = { ...DEFAULT_WEBHOOK_URLS };

export const SESSION_KEY = CACHE_KEYS.jobs;
export const WEBHOOK_KEY = CACHE_KEYS.webhooks;
export { PAGE_SIZE };

export function nowStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes(),
  )}:${p(d.getSeconds())}`;
}

export function nextJobId(rows: JobRecord[]) {
  const max = rows.reduce((m, r) => {
    const n = parseInt(r.job_id.replace("jb-", ""), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 10000);
  return `jb-${max + 1}`;
}

export function loadSessionRows(): JobRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "[]") as JobRecord[];
  } catch {
    return [];
  }
}

export function saveSessionRows(rows: JobRecord[]) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(rows));
}

export function loadWebhooks(): WebhookConfig {
  if (typeof window === "undefined") return DEFAULT_WEBHOOKS;
  try {
    return { ...DEFAULT_WEBHOOKS, ...JSON.parse(localStorage.getItem(WEBHOOK_KEY) ?? "{}") };
  } catch {
    return DEFAULT_WEBHOOKS;
  }
}

export function saveWebhooks(cfg: WebhookConfig) {
  localStorage.setItem(WEBHOOK_KEY, JSON.stringify(cfg));
}

/** Tolerantly map a raw webhook record into a JobRecord. */
export function normalizeRecord(raw: Record<string, unknown>): JobRecord | null {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const v = raw[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
    }
    return "";
  };
  const job_id = get("job_id", "jobId", "id");
  const customer_name = get("customer_name", "customerName", "name");
  if (!job_id && !customer_name) return null;
  const status = get("job_status", "jobStatus", "status") || "Pending";
  return {
    job_id: job_id || `jb-${Math.abs(hash(customer_name))}`,
    customer_name,
    customer_phone: get("customer_phone", "customerPhone", "phone"),
    customer_email: get("customer_email", "customerEmail", "email"),
    manager_email: get("manager_email", "managerEmail"),
    branch: get("branch"),
    service_done: get("service_done", "serviceDone", "service"),
    job_status: (STATUSES as readonly string[]).includes(status)
      ? (status as JobStatus)
      : "Pending",
    completed_at: get("completed_at", "completedAt"),
  };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
