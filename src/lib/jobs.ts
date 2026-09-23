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
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  manager_email: string;
  branch: string;
  service_done: string;
  job_status: JobStatus;
  completed_at: string;
};

export const STORAGE_KEY = "cc072_jobs";
export const WEBHOOK_KEY = "cc072_webhook_url";
export const DEFAULT_WEBHOOK = "https://reubenedidiong.app.n8n.cloud/webhook/costomer_details";

export function nowStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes(),
  )}:${p(d.getSeconds())}`;
}

export function nextIds(rows: JobRecord[]) {
  const num = (v: string, prefix: string) => {
    const n = parseInt(v.replace(prefix, ""), 10);
    return Number.isFinite(n) ? n : 0;
  };
  const job = rows.reduce((m, r) => Math.max(m, num(r.job_id, "jb-")), 10000);
  const cust = rows.reduce((m, r) => Math.max(m, num(r.customer_id, "cust-")), 1000);
  return { job_id: `jb-${job + 1}`, customer_id: `cust-${cust + 1}` };
}

export function loadRows(): JobRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as JobRecord[];
  } catch {
    return [];
  }
}

export function saveRows(rows: JobRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}
