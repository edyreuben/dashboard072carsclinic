import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { JobFormDialog, type JobFormValues } from "@/components/JobFormDialog";
import { WebhookDialog } from "@/components/WebhookDialog";
import { DataTablePanel, DetailsPanel } from "@/components/DashboardPanels";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { showWebhookFailures } from "@/lib/webhook-diagnostics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Job / Visits" },
      {
        name: "description",
        content:
          "Manage 072 Cars Clinic customer service records, job status and branch visits from one admin dashboard.",
      },
      { property: "og:title", content: "Job / Visits" },
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
  Pending:
    "border-status-pending/50 bg-status-pending/15 text-status-pending focus-visible:border-status-pending/70 focus-visible:ring-status-pending/30",
  "In Progress":
    "border-status-progress/50 bg-status-progress/15 text-status-progress focus-visible:border-status-progress/70 focus-visible:ring-status-progress/30",
  Completed:
    "border-status-completed/50 bg-status-completed/15 text-status-completed focus-visible:border-status-completed/70 focus-visible:ring-status-completed/30",
  Cancelled:
    "border-status-cancelled/50 bg-status-cancelled/15 text-status-cancelled focus-visible:border-status-cancelled/70 focus-visible:ring-status-cancelled/30",
};

function LocationMultiSelect({
  locations,
  selected,
  onChange,
  label,
}: {
  locations: string[];
  selected: string[];
  onChange: (locations: string[]) => void;
  label: string;
}) {
  const allSelected = selected.length === 0;
  const toggle = (location: string) => {
    const next = allSelected
      ? [location]
      : selected.includes(location)
        ? selected.filter((item) => item !== location)
        : [...selected, location];
    onChange(next.length === locations.length ? [] : next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 min-w-56 justify-between font-normal">
          <span className="truncate">
            {allSelected
              ? locations.length > 1
                ? "All locations"
                : "1 location"
              : `${selected.length} location${selected.length === 1 ? "" : "s"} selected`}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <p className="px-2 pb-2 text-xs font-medium uppercase text-muted-foreground">{label}</p>
        {locations.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">No locations available.</p>
        ) : (
          locations.map((location) => (
            <label
              key={location}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-muted"
            >
              <Checkbox
                checked={allSelected || selected.includes(location)}
                onCheckedChange={() => toggle(location)}
              />
              <span>{location}</span>
            </label>
          ))
        )}
        <label className="mt-1 flex cursor-pointer items-center gap-2 border-t px-2 pt-2 text-xs text-muted-foreground">
          <Checkbox checked={allSelected} onCheckedChange={() => onChange([])} />
          <span>Select all</span>
        </label>
      </PopoverContent>
    </Popover>
  );
}

function Dashboard() {
  const [rows, setRows] = useState<JobRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [webhooks, setWebhooks] = useState<WebhookConfig>(() => loadWebhooks());
  const [formOpen, setFormOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editing, setEditing] = useState<JobRecord | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const refreshData = useCallback(async (config: WebhookConfig) => {
    const data = await syncDashboardData(config);
    // A successful GET webhook response is the source of truth. The sync
    // layer falls back to cache only when that request fails.
    setRows(data.jobs);
    showWebhookFailures(data.failures);
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
    () => rows.filter((row) => branchFilter.length === 0 || branchFilter.includes(row.branch)),
    [branchFilter, rows],
  );
  const availableBranches = useMemo(
    () => Array.from(new Set(rows.map((row) => row.branch).filter(Boolean))).sort(),
    [rows],
  );
  useEffect(() => {
    if (branchFilter.some((branch) => !availableBranches.includes(branch))) {
      setBranchFilter([]);
    }
  }, [availableBranches, branchFilter]);
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
      toast.error("Post Customer/Job Event Webhook Error", {
        description: "Webhook URL is not configured",
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
      showWebhookFailures([
        {
          name: "Post Customer/Job Event Webhook",
          status: res.status,
          error: res.error,
        },
      ]);
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
      void refreshData(webhooks);
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
    void refreshData(webhooks);
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
    // Update the row immediately so the selected status colour and timestamp
    // are reflected before the webhook round trip completes.
    setRows((prev) => prev.map((r) => (r.job_id === job_id ? updated : r)));
    const ok = await dispatch("customer_updated", updated);
    if (!ok) {
      setRows((prev) => prev.map((r) => (r.job_id === job_id ? current : r)));
      return;
    }
    toast.success("Record updated", { description: job_id });
    void refreshData(webhooks);
  };

  const remove = (row: JobRecord) => {
    setRows((p) => p.filter((r) => r.job_id !== row.job_id));
    if (selectedId === row.job_id) setSelectedId(null);
    toast.success("Job record deleted", { description: row.job_id });
    void refreshData(webhooks);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans lg:h-screen lg:overflow-hidden">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:min-h-0 lg:py-4">
        <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between lg:mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Job / Visits</h2>
          </div>
          <div className="flex shrink-0 flex-wrap items-end justify-end gap-3">
            <div className="min-w-56">
              <label className="mb-1.5 block text-xs font-medium uppercase text-muted-foreground">
                Branch / Location
              </label>
              <LocationMultiSelect
                locations={availableBranches}
                selected={branchFilter}
                label="Filter jobs by branch"
                onChange={(value) => {
                  setBranchFilter(value);
                  setVisibleCount(PAGE_SIZE);
                }}
              />
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

        <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* Left: jobs table */}
          <DataTablePanel
            scrollRef={scrollRef}
            onScroll={onScroll}
            footer={`${visibleRows.length} of ${filteredRows.length} records loaded`}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-muted">
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead className="min-w-[150px]">Job Status</TableHead>
                  <TableHead className="w-[96px] text-right">Action</TableHead>
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
                        <SelectTrigger className={`h-9 font-medium ${statusClass[row.job_status]}`}>
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
          </DataTablePanel>

          {/* Right: details panel */}
          <DetailsPanel
            title="Customer / Job Details"
            empty="Select a record to view its full details."
          >
            {selected ? (
              <dl className="grid h-full content-start grid-cols-2 gap-x-4 gap-y-3 overflow-hidden px-5 py-4 text-sm">
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
                  <div
                    key={label}
                    className={
                      label === "Customer Email" ||
                      label === "Manager Email" ||
                      label === "Service Done"
                        ? "col-span-2 min-w-0"
                        : "min-w-0"
                    }
                  >
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-0.5 break-words font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </DetailsPanel>
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
