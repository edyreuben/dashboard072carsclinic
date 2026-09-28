import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Copy, Eye, Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { WebhookDialog } from "@/components/WebhookDialog";
import { DataTablePanel, DetailsPanel } from "@/components/DashboardPanels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { syncDashboardData } from "@/lib/dashboard-sync";
import {
  feedbackCategory,
  loadFeedbackCache,
  saveFeedbackCache,
  type FeedbackRecord,
} from "@/lib/feedback";
import { loadWebhooks, saveWebhooks, type WebhookConfig } from "@/lib/jobs";
import { PAGE_SIZE } from "@/lib/app-config";
import { formatServiceDate } from "@/lib/utils";
import { showWebhookFailures } from "@/lib/webhook-diagnostics";

function LocationMultiSelect({
  locations,
  selected,
  onChange,
}: {
  locations: string[];
  selected: string[];
  onChange: (locations: string[]) => void;
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
        <Button variant="outline" className="h-9 min-w-64 justify-between font-normal">
          <span className="truncate">
            {locations.length === 0
              ? "—"
              : allSelected
                ? locations.length > 1
                  ? "All locations"
                  : "1 location"
                : `${selected.length} location${selected.length === 1 ? "" : "s"} selected`}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <p className="px-2 pb-2 text-xs font-medium uppercase text-muted-foreground">
          Filter feedback by branch
        </p>
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

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Feedback Status" },
      {
        name: "description",
        content: "Review feedback metrics, queues and escalations for 072 Cars Clinic.",
      },
      { property: "og:title", content: "Feedback Status" },
      {
        property: "og:description",
        content: "Review customer feedback metrics and management queues for 072 Cars Clinic.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StatusPage,
});

const categoryClass = {
  "Ready to Post": "border-category-ready/30 bg-category-ready/10 text-category-ready",
  "Private Queue": "border-category-private/30 bg-category-private/10 text-category-private",
  Escalated: "border-category-escalated/30 bg-category-escalated/10 text-category-escalated",
} as const;

const feedbackToneClass = {
  "Ready to Post": "bg-category-ready/10 text-category-ready",
  "Private Queue": "bg-category-private/10 text-category-private",
  Escalated: "bg-category-escalated/10 text-category-escalated",
} as const;

const feedbackActionHoverClass = {
  "Ready to Post": "hover:bg-category-ready/25",
  "Private Queue": "hover:bg-category-private/25",
  Escalated: "hover:bg-category-escalated/25",
} as const;

function StatusPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [webhooks, setWebhooks] = useState<WebhookConfig>(() => loadWebhooks());
  const [records, setRecords] = useState<FeedbackRecord[]>(() => [
    ...loadFeedbackCache("positive"),
    ...loadFeedbackCache("negative"),
  ]);
  const [branchFilter, setBranchFilter] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingResponse, setEditingResponse] = useState(false);
  const [responseDraft, setResponseDraft] = useState("");
  const [expandedBox, setExpandedBox] = useState<"feedback" | "response" | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async (config: WebhookConfig) => {
    const data = await syncDashboardData(config);
    setRecords([...data.positiveFeedback, ...data.negativeFeedback]);
    showWebhookFailures(data.failures);
  }, []);

  useEffect(() => {
    const config = loadWebhooks();
    setWebhooks(config);
    void refresh(config);
  }, [refresh]);

  const filtered = useMemo(
    () =>
      records
        .filter((record) => branchFilter.length === 0 || branchFilter.includes(record.branch))
        .sort((a, b) => Date.parse(b.service_date) - Date.parse(a.service_date)),
    [branchFilter, records],
  );
  const availableBranches = useMemo(
    () => Array.from(new Set(records.map((record) => record.branch).filter(Boolean))).sort(),
    [records],
  );
  useEffect(() => {
    if (branchFilter.some((branch) => !availableBranches.includes(branch))) {
      setBranchFilter([]);
    }
  }, [availableBranches, branchFilter]);
  const selected = records.find((record) => record.id === selectedId) ?? null;
  const visibleRecords = filtered.slice(0, visibleCount);
  const counts = useMemo(() => {
    const severity = (value: string) =>
      filtered.filter((record) => record.severity === value).length;
    return [
      { category: "Total Feedback", total: filtered.length },
      {
        category: "Ready to Post",
        ready: filtered.filter((record) => record.source === "positive").length,
      },
      {
        category: "Escalated",
        high: severity("high"),
        critical: severity("critical"),
        repeat: filtered.filter((record) =>
          ["repeat negative respond", "repeat negative response"].includes(record.severity),
        ).length,
      },
      {
        category: "Private Queue",
        low: severity("low"),
        medium: severity("medium"),
        none: severity("none"),
      },
    ];
  }, [filtered]);

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const saveResponse = () => {
    if (!selected) return;
    const next = records.map((record) =>
      record.id === selected.id
        ? { ...record, ai_feedback_response: responseDraft.trim() }
        : record,
    );
    setRecords(next);
    saveFeedbackCache(
      "negative",
      next.filter((record) => record.source === "negative"),
    );
    setEditingResponse(false);
    toast.success("AI response updated");
  };

  const onTableScroll = () => {
    const element = scrollRef.current;
    if (!element || visibleCount >= filtered.length) return;
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 40) {
      setVisibleCount((count) => Math.min(count + PAGE_SIZE, filtered.length));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans lg:h-screen lg:overflow-hidden">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:min-h-0 lg:py-4">
        <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Feedback Status</h2>
          </div>
          <div className="min-w-64">
            <label className="mb-1.5 block text-xs font-medium uppercase text-muted-foreground">
              Branch / Location
            </label>
            <LocationMultiSelect
              locations={availableBranches}
              selected={branchFilter}
              onChange={(value) => {
                setBranchFilter(value);
                setVisibleCount(PAGE_SIZE);
              }}
            />
          </div>
        </div>

        <section
          className="mb-2 border-y border-border bg-card px-4 py-2 sm:px-6"
          aria-label="Feedback metrics"
        >
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <div
              className="rounded-md border border-secondary/30 bg-secondary/10 px-3 py-1.5"
              title="Total Feedback"
            >
              <p className="text-xs font-medium uppercase text-muted-foreground">Total Feedback</p>
              <p className="text-lg font-bold text-foreground">{filtered.length}</p>
            </div>
            <div
              className="rounded-md border border-category-ready/30 bg-category-ready/10 px-3 py-1.5"
              title="Ready to Post feedback"
            >
              <p className="text-xs font-medium uppercase text-muted-foreground">Ready to Post</p>
              <p className="text-lg font-bold text-foreground">{counts[1].ready ?? 0}</p>
            </div>
            <div
              className="rounded-md border border-category-escalated/30 bg-category-escalated/10 px-3 py-1.5"
              title="Escalated feedback breakdown"
            >
              <p className="text-xs font-medium uppercase text-muted-foreground">Escalated</p>
              <p className="text-lg font-bold text-foreground">
                {(counts[2].high ?? 0) + (counts[2].critical ?? 0) + (counts[2].repeat ?? 0)}
              </p>
              <div
                className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-muted"
                aria-label="Escalated severity breakdown"
              >
                {[
                  ["High", counts[2].high ?? 0, "bg-primary"],
                  ["Critical", counts[2].critical ?? 0, "bg-destructive"],
                  ["Repeat negative respond", counts[2].repeat ?? 0, "bg-status-cancelled"],
                ].map(([label, value, color]) => {
                  const total =
                    (counts[2].high ?? 0) + (counts[2].critical ?? 0) + (counts[2].repeat ?? 0);
                  const percent = total ? ((Number(value) / total) * 100).toFixed(0) : "0";
                  return (
                    <span
                      key={label}
                      className={`h-full ${color}`}
                      style={{ width: `${percent}%` }}
                      title={`${label}: ${value} (${percent}%)`}
                    />
                  );
                })}
              </div>
            </div>
            <div
              className="rounded-md border border-category-private/30 bg-category-private/10 px-3 py-1.5"
              title="Private Queue feedback breakdown"
            >
              <p className="text-xs font-medium uppercase text-muted-foreground">Private Queue</p>
              <p className="text-lg font-bold text-foreground">
                {(counts[3].low ?? 0) + (counts[3].medium ?? 0) + (counts[3].none ?? 0)}
              </p>
              <div
                className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-muted"
                aria-label="Private queue severity breakdown"
              >
                {[
                  ["Low", counts[3].low ?? 0, "bg-category-private"],
                  ["Medium", counts[3].medium ?? 0, "bg-status-pending"],
                  ["None", counts[3].none ?? 0, "bg-muted-foreground"],
                ].map(([label, value, color]) => {
                  const total =
                    (counts[3].low ?? 0) + (counts[3].medium ?? 0) + (counts[3].none ?? 0);
                  const percent = total ? ((Number(value) / total) * 100).toFixed(0) : "0";
                  return (
                    <span
                      key={label}
                      className={`h-full ${color}`}
                      style={{ width: `${percent}%` }}
                      title={`${label}: ${value} (${percent}%)`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_400px]">
          <DataTablePanel
            scrollRef={scrollRef}
            onScroll={onTableScroll}
            footer={`${visibleRecords.length} of ${filtered.length} records loaded`}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-muted">
                  <TableHead>Service Date</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                      No feedback records available.
                    </TableCell>
                  </TableRow>
                )}
                {visibleRecords.map((record) => {
                  const category = feedbackCategory(record);
                  return (
                    <TableRow
                      key={record.id}
                      className="cursor-pointer"
                      data-state={selectedId === record.id ? "selected" : undefined}
                      onClick={() => {
                        setSelectedId(record.id);
                        setEditingResponse(false);
                        setExpandedBox(null);
                      }}
                    >
                      <TableCell className="whitespace-nowrap">
                        {formatServiceDate(record.service_date)}
                      </TableCell>
                      <TableCell className="font-medium">{record.customer_name || "—"}</TableCell>
                      <TableCell>{record.branch || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={categoryClass[category]}>
                          {category}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DataTablePanel>

          <DetailsPanel
            title="Feedback Details"
            empty="Select a feedback record to view its full details."
          >
            {selected ? (
              <div className="flex h-full min-h-0 flex-col overflow-hidden p-4">
                <dl className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {[
                    ["Service Date", formatServiceDate(selected.service_date)],
                    ["Job ID", selected.job_id],
                    ["Customer Name", selected.customer_name],
                    ["Customer Phone", selected.customer_phone],
                    ["Customer Email", selected.customer_email],
                    ["Branch", selected.branch],
                    ["Service Done", selected.service_done],
                    ["Manager", selected.manager],
                    ["Sentiment Score", selected.sentiment_score],
                    ["Severity", selected.severity],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-[10px] uppercase text-muted-foreground">{label}</dt>
                      <dd className="truncate font-medium text-foreground" title={value || "—"}>
                        {value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-3 flex min-h-0 flex-[3] flex-col gap-3 border-t border-border pt-3">
                  <div
                    className={`flex min-h-0 flex-1 flex-col rounded-md p-3 ${feedbackToneClass[feedbackCategory(selected)]}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground">
                        {selected.source === "positive" ? "Positive Feedback" : "Negative Feedback"}
                      </h4>
                      <div className="flex gap-1">
                        {selected.source === "positive" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`text-muted-foreground hover:text-white ${feedbackActionHoverClass[feedbackCategory(selected)]}`}
                            onClick={() => void copyText(selected.feedback, "Feedback")}
                          >
                            <Copy className="size-4" /> Copy
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`text-muted-foreground hover:text-white ${feedbackActionHoverClass[feedbackCategory(selected)]}`}
                          aria-label="View full feedback"
                          title={
                            selected.feedback.trim() ? "View full feedback" : "No feedback to view"
                          }
                          disabled={!selected.feedback.trim()}
                          onClick={() => setExpandedBox("feedback")}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words pr-1 text-sm leading-5 text-foreground">
                      {selected.feedback || "No comment provided."}
                    </p>
                  </div>
                  {selected.source === "negative" && (
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground">
                          AI-Generated Response
                        </h4>
                        <div className="flex gap-1">
                          {editingResponse ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={saveResponse}
                            >
                              <Save className="size-4" /> Save
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setResponseDraft(selected.ai_feedback_response);
                                setEditingResponse(true);
                                setExpandedBox("response");
                              }}
                            >
                              <Pencil className="size-4" /> Edit
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              void copyText(
                                editingResponse ? responseDraft : selected.ai_feedback_response,
                                "Response",
                              )
                            }
                          >
                            <Copy className="size-4" /> Copy
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="View full AI response"
                            title={
                              selected.ai_feedback_response.trim()
                                ? "View full AI response"
                                : "No response to view"
                            }
                            disabled={!selected.ai_feedback_response.trim()}
                            onClick={() => setExpandedBox("response")}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </div>
                      </div>
                      {editingResponse ? (
                        <Textarea
                          value={responseDraft}
                          onChange={(event) => setResponseDraft(event.target.value)}
                          className="min-h-0 flex-1 resize-none overflow-x-hidden overflow-y-auto"
                          aria-label="Edit AI-generated response"
                        />
                      ) : (
                        <p className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words pr-1 text-sm leading-5 text-foreground">
                          {selected.ai_feedback_response || "No response available."}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </DetailsPanel>
        </div>
      </main>
      <AppFooter />
      <Dialog open={expandedBox !== null} onOpenChange={(open) => !open && setExpandedBox(null)}>
        <DialogContent className="max-w-2xl [&>button]:flex [&>button]:size-8 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-md [&>button]:!border-0 [&>button]:text-muted-foreground [&>button]:!outline-none [&>button]:!ring-0 [&>button:hover]:bg-muted [&>button:focus]:!border-0 [&>button:focus]:!outline-none [&>button:focus]:!ring-0 [&>button:focus-visible]:!border-0 [&>button:focus-visible]:!outline-none [&>button:focus-visible]:!ring-0">
          <DialogHeader>
            <DialogTitle>
              {expandedBox === "response" ? "AI-Generated Response" : "Customer Feedback"}
            </DialogTitle>
          </DialogHeader>
          {expandedBox === "response" ? (
            <div className="flex min-h-0 flex-col gap-3">
              <div className="flex justify-end gap-2">
                {editingResponse ? (
                  <Button variant="outline" size="sm" onClick={saveResponse}>
                    <Save className="size-4" /> Save
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!selected) return;
                      setResponseDraft(selected.ai_feedback_response);
                      setEditingResponse(true);
                    }}
                  >
                    <Pencil className="size-4" /> Edit
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    !(
                      (editingResponse ? responseDraft : selected?.ai_feedback_response) ?? ""
                    ).trim()
                  }
                  onClick={() =>
                    void copyText(
                      editingResponse ? responseDraft : (selected?.ai_feedback_response ?? ""),
                      "Response",
                    )
                  }
                >
                  <Copy className="size-4" /> Copy
                </Button>
              </div>
              {editingResponse ? (
                <Textarea
                  value={responseDraft}
                  onChange={(event) => setResponseDraft(event.target.value)}
                  className="min-h-64 resize-y whitespace-pre-wrap"
                  aria-label="Edit AI-generated response"
                />
              ) : (
                <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-md border border-border p-4 text-sm leading-6">
                  {selected?.ai_feedback_response || "No response available."}
                </div>
              )}
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-md border border-border p-4 text-sm leading-6">
              {selected?.feedback || "No comment provided."}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <WebhookDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        config={webhooks}
        onSave={(config) => {
          setWebhooks(config);
          saveWebhooks(config);
          setSettingsOpen(false);
          toast.success("Webhook settings saved");
          void refresh(config);
        }}
      />
    </div>
  );
}
