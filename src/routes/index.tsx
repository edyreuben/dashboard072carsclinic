import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { JobFormDialog, type JobFormValues } from "@/components/JobFormDialog";
import { WebhookDialog } from "@/components/WebhookDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BRANCHES,
  DEFAULT_WEBHOOK,
  OTHERS,
  SERVICES,
  STATUSES,
  WEBHOOK_KEY,
  loadRows,
  nextIds,
  nowStamp,
  saveRows,
  type JobRecord,
  type JobStatus,
} from "@/lib/jobs";
import { sendWebhook } from "@/lib/webhook.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Job / Visits — 072 Cars Clinic Admin" },
      {
        name: "description",
        content:
          "Manage 072 Cars Clinic customer service records, job status and branch visits from one admin dashboard.",
      },
      { property: "og:title", content: "Job / Visits — 072 Cars Clinic Admin" },
      {
        property: "og:description",
        content: "Manage customer service records and job status for 072 Cars Clinic.",
      },
    ],
  }),
  component: Dashboard,
});

const statusClass: Record<JobStatus, string> = {
  Pending: "bg-status-pending/15 text-status-pending",
  "In Progress": "bg-status-progress/15 text-status-progress",
  Completed: "bg-status-completed/15 text-status-completed",
  Cancelled: "bg-status-cancelled/15 text-status-cancelled",
};

function Dashboard() {
  const [rows, setRows] = useState<JobRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(DEFAULT_WEBHOOK);
  const [formOpen, setFormOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editing, setEditing] = useState<JobRecord | null>(null);
  const [customFor, setCustomFor] = useState<Record<string, string>>({});

  useEffect(() => {
    setRows(loadRows());
    setWebhookUrl(localStorage.getItem(WEBHOOK_KEY) ?? DEFAULT_WEBHOOK);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveRows(rows);
  }, [rows, hydrated]);

  const ids = useMemo(() => nextIds(rows), [rows]);

  const dispatch = async (event: "customer_created" | "customer_updated", row: JobRecord) => {
    if (!webhookUrl) {
      toast.error("No webhook URL configured", {
        description: "Open settings to set your n8n webhook URL.",
      });
      return;
    }
    const payload = {
      event,
      job_id: row.job_id,
      customer_id: row.customer_id,
      customer_name: row.customer_name,
      customer_phone: row.customer_phone,
      customer_email: row.customer_email,
      manager_email: row.manager_email,
      branch: row.branch,
      service_done: row.service_done,
      job_status: row.job_status,
      completed_at: row.completed_at,
    };
    const res = await sendWebhook({ data: { url: webhookUrl, payload } });
    if (res.ok) toast.success(`Sent "${event}" to n8n`, { description: row.job_id });
    else
      toast.error("Webhook dispatch failed", {
        description: res.body || `Status ${res.status}`,
      });
  };

  const handleSubmit = (values: JobFormValues) => {
    if (editing) {
      const completed_at =
        values.job_status === "Completed"
          ? editing.job_status === "Completed" && editing.completed_at
            ? editing.completed_at
            : nowStamp()
          : "";
      const updated: JobRecord = { ...editing, ...values, completed_at };
      setRows((p) => p.map((r) => (r.job_id === updated.job_id ? updated : r)));
      setFormOpen(false);
      setEditing(null);
      toast.success("Job record updated", { description: updated.job_id });
      void dispatch("customer_updated", updated);
      return;
    }
    const created: JobRecord = {
      ...ids,
      ...values,
      completed_at: values.job_status === "Completed" ? nowStamp() : "",
    };
    setRows((p) => [created, ...p]);
    setFormOpen(false);
    toast.success("Customer job created", { description: created.job_id });
    void dispatch("customer_created", created);
  };

  const patchRow = (job_id: string, patch: Partial<JobRecord>) => {
    let updated: JobRecord | null = null;
    setRows((prev) =>
      prev.map((r) => {
        if (r.job_id !== job_id) return r;
        const next = { ...r, ...patch };
        if (patch.job_status) {
          next.completed_at =
            patch.job_status === "Completed"
              ? r.job_status === "Completed" && r.completed_at
                ? r.completed_at
                : nowStamp()
              : "";
        }
        updated = next;
        return next;
      }),
    );
    if (updated) {
      toast.success("Record updated", { description: job_id });
      void dispatch("customer_updated", updated);
    }
  };

  const remove = (row: JobRecord) => {
    setRows((p) => p.filter((r) => r.job_id !== row.job_id));
    toast.success("Job record deleted", { description: row.job_id });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Job / Visits</h2>
            <p className="text-sm text-muted-foreground">
              {rows.length} record{rows.length === 1 ? "" : "s"} · synced to n8n on create and
              update
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="font-bold"
          >
            <Plus className="size-4" /> Add New Customer / Job
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead>Job ID</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Manager Email</TableHead>
                  <TableHead className="min-w-[220px]">Branch</TableHead>
                  <TableHead className="min-w-[240px]">Service Done</TableHead>
                  <TableHead className="min-w-[160px]">Job Status</TableHead>
                  <TableHead className="min-w-[170px]">Completed At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="py-12 text-center text-muted-foreground">
                      No job records yet. Use “Add New Customer / Job” to create the first one.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row) => {
                  const isPreset = (SERVICES as readonly string[]).includes(row.service_done);
                  const showCustom = customFor[row.job_id] !== undefined || !isPreset;
                  return (
                    <TableRow key={row.job_id}>
                      <TableCell className="font-medium">{row.job_id}</TableCell>
                      <TableCell>{row.customer_id}</TableCell>
                      <TableCell className="font-medium">{row.customer_name}</TableCell>
                      <TableCell>{row.customer_phone}</TableCell>
                      <TableCell className="text-muted-foreground">{row.customer_email}</TableCell>
                      <TableCell className="text-muted-foreground">{row.manager_email}</TableCell>
                      <TableCell>
                        <Select
                          value={row.branch}
                          onValueChange={(v) => patchRow(row.job_id, { branch: v })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BRANCHES.map((b) => (
                              <SelectItem key={b} value={b}>
                                {b}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={isPreset ? row.service_done : OTHERS}
                          onValueChange={(v) => {
                            if (v === OTHERS) {
                              setCustomFor((p) => ({
                                ...p,
                                [row.job_id]: isPreset ? "" : row.service_done,
                              }));
                            } else {
                              setCustomFor((p) => {
                                const n = { ...p };
                                delete n[row.job_id];
                                return n;
                              });
                              patchRow(row.job_id, { service_done: v });
                            }
                          }}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SERVICES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                            <SelectItem value={OTHERS}>{OTHERS}</SelectItem>
                          </SelectContent>
                        </Select>
                        {showCustom && (
                          <Input
                            className="mt-2 h-9"
                            placeholder="Specify Custom Service"
                            defaultValue={isPreset ? (customFor[row.job_id] ?? "") : row.service_done}
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (v && v !== row.service_done)
                                patchRow(row.job_id, { service_done: v });
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.job_status}
                          onValueChange={(v) =>
                            patchRow(row.job_id, { job_status: v as JobStatus })
                          }
                        >
                          <SelectTrigger
                            className={`h-9 font-medium ${statusClass[row.job_status]}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {row.completed_at || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit"
                            onClick={() => {
                              setEditing(row);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete"
                            className="text-primary hover:text-primary"
                            onClick={() => remove(row)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <AppFooter />

      <JobFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditing(null);
        }}
        initial={editing}
        ids={ids}
        onSubmit={handleSubmit}
      />
      <WebhookDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        url={webhookUrl}
        onSave={(u) => {
          setWebhookUrl(u);
          localStorage.setItem(WEBHOOK_KEY, u);
          setSettingsOpen(false);
          toast.success("Webhook URL saved");
        }}
      />
    </div>
  );
}
