import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { JobFormDialog, type JobFormValues } from "@/components/JobFormDialog";
import { WebhookDialog } from "@/components/WebhookDialog";
import { Button } from "@/components/ui/button";
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
  PAGE_SIZE,
  BRANCHES,
  STATUSES,
  loadSessionRows,
  loadWebhooks,
  nextJobId,
  nowStamp,
  saveSessionRows,
  saveWebhooks,
  type JobRecord,
  type JobStatus,
  type WebhookConfig,
} from "@/lib/jobs";
import { sendWebhook } from "@/lib/webhook.functions";
import { syncDashboardData } from "@/lib/dashboard-sync";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const [webhooks, setWebhooks] = useState<WebhookConfig>(() => loadWebhooks());
  const [formOpen, setFormOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editing, setEditing] = useState<JobRecord | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const refreshData = useCallback(async (config: WebhookConfig, preserveLocal = false) => {
    const data = await syncDashboardData(config);
    setRows((current) => {
      if (!preserveLocal) return data.jobs;
      const remoteIds = new Set(data.jobs.map((row) => row.job_id));
      return [...current.filter((row) => !remoteIds.has(row.job_id)), ...data.jobs];
    });
    if (data.failedSources.length) {
      toast.error("Connection with database failed, check specific webhook erroring.", {
        description: data.failedSources.join(", "),
      });
    }
  }, []);

  // Restore the session cache immediately, then refresh all remote datasets.
  useEffect(() => {
    const cfg = loadWebhooks();
    setWebhooks(cfg);
    setRows(loadSessionRows());
    setHydrated(true);
    void refreshData(cfg);
  }, [refreshData]);

  useEffect(() => {
    if (hydrated) saveSessionRows(rows);
  }, [rows, hydrated]);

  const filteredRows = useMemo(
    () => rows.filter((row) => branchFilter === "all" || row.branch === branchFilter),
    [branchFilter, rows],
  );
  const visibleRows = filteredRows.slice(0, visibleCount);

  // Infinite scroll reveals the next cached batch without another network request.
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || visibleCount >= filteredRows.length || loadingRef.current) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      loadingRef.current = true;
      setLoadingMore(true);
      window.setTimeout(() => {
        setVisibleCount((count) => Math.min(count + PAGE_SIZE, filteredRows.length));
        loadingRef.current = false;
        setLoadingMore(false);
      }, 150);
    }
  };

  const nextId = useMemo(() => ({ job_id: nextJobId(rows) }), [rows]);
  const selected = rows.find((r) => r.job_id === selectedId) ?? null;

  const dispatch = async (
    event: "customer_created" | "customer_updated",
    row: JobRecord,
  ): Promise<boolean> => {
    if (!webhooks.postEvent) {
      toast.error("No webhook configured", {
        description: "Open settings to set the Post Event webhook URL.",
      });
      return false;
    }
    const res = await sendWebhook({
      data: {
        url: webhooks.postEvent,
        payload: {
          event,
          job_id: row.job_id,
          customer_name: row.customer_name,
          customer_phone: row.customer_phone,
          customer_email: row.customer_email,
          manager_email: row.manager_email,
          branch: row.branch,
          service_done: row.service_done,
          job_status: row.job_status,
          completed_at: row.completed_at,
        },
      },
    });
    if (!res.ok) {
      toast.error("Sync failed", { description: res.body || `Status ${res.status}` });
      return false;
    }
    return true;
  };

  const handleSubmit = async (values: JobFormValues) => {
    if (editing) {
      const completed_at =
        values.job_status === "Completed"
          ? editing.job_status === "Completed" && editing.completed_at
            ? editing.completed_at
            : nowStamp()
          : "";
      const updated: JobRecord = { ...editing, ...values, completed_at };
      const ok = await dispatch("customer_updated", updated);
      if (!ok) return;
      setRows((p) => p.map((r) => (r.job_id === updated.job_id ? updated : r)));
      setFormOpen(false);
      setEditing(null);
      toast.success("Job record updated", { description: updated.job_id });
      void refreshData(webhooks, true);
      return;
    }
    const created: JobRecord = {
      job_id: nextId.job_id,
      ...values,
      completed_at: values.job_status === "Completed" ? nowStamp() : "",
    };
    const ok = await dispatch("customer_created", created);
    if (!ok) return;
    setRows((p) => [created, ...p]);
    setSelectedId(created.job_id);
    setFormOpen(false);
    toast.success("Customer job created", { description: created.job_id });
    void refreshData(webhooks, true);
  };

  const patchRow = async (job_id: string, patch: Partial<JobRecord>) => {
    const current = rows.find((r) => r.job_id === job_id);
    if (!current) return;
    const updated: JobRecord = { ...current, ...patch };
    if (patch.job_status) {
      updated.completed_at =
        patch.job_status === "Completed"
          ? current.job_status === "Completed" && current.completed_at
            ? current.completed_at
            : nowStamp()
          : "";
    }
    const ok = await dispatch("customer_updated", updated);
    if (!ok) return;
    setRows((prev) => prev.map((r) => (r.job_id === job_id ? updated : r)));
    toast.success("Record updated", { description: job_id });
    void refreshData(webhooks, true);
  };

  const remove = (row: JobRecord) => {
    setRows((p) => p.filter((r) => r.job_id !== row.job_id));
    if (selectedId === row.job_id) setSelectedId(null);
    toast.success("Job record deleted", { description: row.job_id });
    void refreshData(webhooks, true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Job / Visits</h2>
            <p className="text-sm text-muted-foreground">
              {rows.length} record{rows.length === 1 ? "" : "s"} loaded
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-56">
              <label className="mb-1.5 block text-xs font-medium uppercase text-muted-foreground">Branch / Location</label>
              <Select value={branchFilter} onValueChange={(value) => { setBranchFilter(value); setVisibleCount(PAGE_SIZE); }}>
                <SelectTrigger aria-label="Filter jobs by branch"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {BRANCHES.map((branch) => <SelectItem key={branch} value={branch}>{branch}</SelectItem>)}
                </SelectContent>
              </Select>
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
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left: jobs table */}
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
            <div
              ref={scrollRef}
              onScroll={onScroll}
              className="max-h-[calc(20*3.25rem+2.75rem)] overflow-y-auto"
            >
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="bg-muted">
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead className="min-w-[150px]">Job Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                        No job records yet. Use “Add New Customer / Job” to create the first one.
                      </TableCell>
                    </TableRow>
                  )}
                  {visibleRows.map((row) => (
                    <TableRow
                      key={row.job_id}
                      onClick={() => setSelectedId(row.job_id)}
                      data-state={selectedId === row.job_id ? "selected" : undefined}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-medium">{row.customer_name}</TableCell>
                      <TableCell>{row.customer_phone}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={row.job_status}
                          onValueChange={(v) =>
                            void patchRow(row.job_id, { job_status: v as JobStatus })
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
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="View"
                            onClick={() => setSelectedId(row.job_id)}
                          >
                            <Eye className="size-4" />
                          </Button>
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
                  ))}
                </TableBody>
              </Table>
              {loadingMore && (
                <p className="py-3 text-center text-xs text-muted-foreground">
                  Loading more records…
                </p>
              )}
            </div>
            <div className="border-t border-border px-4 py-3 text-right text-xs font-medium text-muted-foreground">
              {visibleRows.length} of {filteredRows.length} records loaded
            </div>
          </div>

          {/* Right: details panel */}
          <div className="h-fit rounded-lg border border-border bg-card shadow-[var(--shadow-card)] lg:sticky lg:top-6">
            <div className="border-b bg-surface-dark px-5 py-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-surface-dark-foreground">
                Customer / Job Details
              </h3>
            </div>
            {selected ? (
              <dl className="space-y-4 px-5 py-5 text-sm">
                {(
                  [
                    ["Job ID", selected.job_id],
                    ["Customer Name", selected.customer_name],
                    ["Phone Number", selected.customer_phone],
                    ["Customer Email", selected.customer_email],
                    ["Manager Email", selected.manager_email],
                    ["Branch", selected.branch],
                    ["Service Done", selected.service_done],
                    ["Job Status", selected.job_status],
                    ["Completed At", selected.completed_at || "—"],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                Select a record to view its full details.
              </p>
            )}
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
        ids={nextId}
        onSubmit={(v) => void handleSubmit(v)}
      />
      <WebhookDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        config={webhooks}
        onSave={(cfg) => {
          setWebhooks(cfg);
          saveWebhooks(cfg);
          setSettingsOpen(false);
          toast.success("Webhook settings saved");
          void refreshData(cfg);
        }}
      />
    </div>
  );
}
