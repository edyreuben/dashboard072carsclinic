import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Eye, Pencil, Save } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { WebhookDialog } from "@/components/WebhookDialog";
import { DataTablePanel, DetailsPanel } from "@/components/DashboardPanels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { syncDashboardData } from "@/lib/dashboard-sync";
import {
  feedbackCategory,
  loadFeedbackCache,
  saveFeedbackCache,
  type FeedbackRecord,
} from "@/lib/feedback";
import { BRANCHES, loadWebhooks, saveWebhooks, type WebhookConfig } from "@/lib/jobs";
import { PAGE_SIZE } from "@/lib/app-config";
import { formatServiceDate } from "@/lib/utils";
import { showWebhookFailures } from "@/lib/webhook-diagnostics";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Feedback Status — 072 Cars Clinic Admin" },
      { name: "description", content: "Review feedback metrics, queues and escalations for 072 Cars Clinic." },
      { property: "og:title", content: "Feedback Status — 072 Cars Clinic Admin" },
      { property: "og:description", content: "Review customer feedback metrics and management queues for 072 Cars Clinic." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StatusPage,
});

const chartConfig = {
  total: { label: "Total Feedback", color: "var(--color-secondary)" },
  ready: { label: "Ready to Post", color: "var(--color-category-ready)" },
  high: { label: "High", color: "var(--color-primary)" },
  critical: { label: "Critical", color: "var(--color-destructive)" },
  repeat: { label: "Repeat negative respond", color: "var(--color-status-cancelled)" },
  low: { label: "Low", color: "var(--color-category-private)" },
  medium: { label: "Medium", color: "var(--color-status-pending)" },
  none: { label: "None", color: "var(--color-muted-foreground)" },
} satisfies ChartConfig;

const categoryClass = {
  "Ready to Post": "border-category-ready/30 bg-category-ready/15 text-category-ready",
  "Private Queue": "border-category-private/30 bg-category-private/15 text-category-private",
  Escalated: "border-category-escalated/30 bg-category-escalated/15 text-category-escalated",
} as const;

function StatusPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [webhooks, setWebhooks] = useState<WebhookConfig>(() => loadWebhooks());
  const [records, setRecords] = useState<FeedbackRecord[]>(() => [
    ...loadFeedbackCache("positive"),
    ...loadFeedbackCache("negative"),
  ]);
  const [branchFilter, setBranchFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingResponse, setEditingResponse] = useState(false);
  const [responseDraft, setResponseDraft] = useState("");
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
    () => records
      .filter((record) => branchFilter === "all" || record.branch === branchFilter)
      .sort((a, b) => Date.parse(b.service_date) - Date.parse(a.service_date)),
    [branchFilter, records],
  );
  const selected = records.find((record) => record.id === selectedId) ?? null;
  const visibleRecords = filtered.slice(0, visibleCount);
  const counts = useMemo(() => {
    const severity = (value: string) => filtered.filter((record) => record.severity === value).length;
    return [
      { category: "Total Feedback", total: filtered.length },
      { category: "Ready to Post", ready: filtered.filter((record) => record.source === "positive").length },
      {
        category: "Escalated",
        high: severity("high"),
        critical: severity("critical"),
        repeat: filtered.filter((record) => ["repeat negative respond", "repeat negative response"].includes(record.severity)).length,
      },
      { category: "Private Queue", low: severity("low"), medium: severity("medium"), none: severity("none") },
    ];
  }, [filtered]);

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const saveResponse = () => {
    if (!selected) return;
    const next = records.map((record) =>
      record.id === selected.id ? { ...record, ai_feedback_response: responseDraft.trim() } : record,
    );
    setRecords(next);
    saveFeedbackCache("negative", next.filter((record) => record.source === "negative"));
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
            <p className="text-sm text-muted-foreground">{filtered.length} feedback record{filtered.length === 1 ? "" : "s"}</p>
          </div>
          <div className="min-w-64">
            <label className="mb-1.5 block text-xs font-medium uppercase text-muted-foreground">Branch / Location</label>
            <Select value={branchFilter} onValueChange={(value) => { setBranchFilter(value); setVisibleCount(PAGE_SIZE); }}>
              <SelectTrigger aria-label="Filter feedback by branch"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {BRANCHES.map((branch) => <SelectItem key={branch} value={branch}>{branch}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <section className="mb-4 border-y border-border bg-card px-4 py-3 sm:px-6" aria-label="Feedback metrics">
          <div className="mb-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {[
              ["Total Feedback", filtered.length],
              ["Ready to Post", filtered.filter((record) => feedbackCategory(record) === "Ready to Post").length],
              ["Escalated", filtered.filter((record) => feedbackCategory(record) === "Escalated").length],
              ["Private Queue", filtered.filter((record) => feedbackCategory(record) === "Private Queue").length],
            ].map(([label, value]) => (
              <div key={label} className="border-l-2 border-primary px-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
                <p className="text-xl font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <ChartContainer config={chartConfig} className="h-32 w-full aspect-auto">
            <BarChart data={counts} margin={{ top: 4, right: 12, left: -16, bottom: 0 }} barCategoryGap="42%" maxBarSize={34}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="category" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={[3, 3, 0, 0]} name="Total Feedback" />
              <Bar dataKey="ready" fill="var(--color-ready)" radius={[3, 3, 0, 0]} name="Ready to Post" />
              <Bar dataKey="high" stackId="escalated" fill="var(--color-high)" name="High" />
              <Bar dataKey="critical" stackId="escalated" fill="var(--color-critical)" name="Critical" />
              <Bar dataKey="repeat" stackId="escalated" fill="var(--color-repeat)" radius={[3, 3, 0, 0]} name="Repeat negative respond" />
              <Bar dataKey="low" stackId="queue" fill="var(--color-low)" name="Low" />
              <Bar dataKey="medium" stackId="queue" fill="var(--color-medium)" name="Medium" />
              <Bar dataKey="none" stackId="queue" fill="var(--color-none)" radius={[3, 3, 0, 0]} name="None" />
            </BarChart>
          </ChartContainer>
        </section>

        <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_400px]">
          <DataTablePanel
            scrollRef={scrollRef}
            onScroll={onTableScroll}
            footer={`${visibleRecords.length} of ${filtered.length} records loaded`}
          >
              <Table>
                <TableHeader className="sticky top-0 z-10"><TableRow className="bg-muted">
                  <TableHead>Service Date</TableHead><TableHead>Customer Name</TableHead><TableHead>Branch</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No feedback records available.</TableCell></TableRow>}
                  {visibleRecords.map((record) => { const category = feedbackCategory(record); return <TableRow key={record.id} className="cursor-pointer" data-state={selectedId === record.id ? "selected" : undefined} onClick={() => { setSelectedId(record.id); setEditingResponse(false); }}>
                    <TableCell>{formatServiceDate(record.service_date)}</TableCell><TableCell className="font-medium">{record.customer_name || "—"}</TableCell><TableCell>{record.branch || "—"}</TableCell><TableCell><Badge variant="outline" className={categoryClass[category]}>{category}</Badge></TableCell><TableCell className="text-right" onClick={(event) => event.stopPropagation()}><Button variant="ghost" size="icon" aria-label={`View ${record.customer_name || "feedback"}`} onClick={() => { setSelectedId(record.id); setEditingResponse(false); }}><Eye className="size-4" /></Button></TableCell>
                  </TableRow>)}
                </TableBody>
              </Table>
          </DataTablePanel>

          <DetailsPanel title="Feedback Details" empty="Select a feedback record to view its full details.">
            {selected ? <div className="flex h-full min-h-0 flex-col overflow-hidden p-4">
              <dl className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {[["Service Date", formatServiceDate(selected.service_date)], ["Job ID", selected.job_id], ["Customer Name", selected.customer_name], ["Customer Phone", selected.customer_phone], ["Customer Email", selected.customer_email], ["Branch", selected.branch], ["Service Done", selected.service_done], ["Manager", selected.manager], ["Sentiment Score", selected.sentiment_score], ["Severity", selected.severity]].map(([label, value]) => <div key={label} className={label === "Customer Email" || label === "Service Done" ? "col-span-2 min-w-0" : "min-w-0"}><dt className="text-[10px] uppercase text-muted-foreground">{label}</dt><dd className="truncate font-medium text-foreground" title={value || "—"}>{value || "—"}</dd></div>)}
              </dl>
              <div className="mt-3 flex min-h-0 flex-[3] flex-col gap-3 border-t border-border pt-3">
                <div className={`flex min-h-0 flex-1 flex-col rounded-md p-3 ${selected.source === "negative" ? "bg-negative-feedback text-negative-feedback-foreground" : "bg-muted"}`}>
                  <div className="mb-2 flex items-center justify-between"><h4 className="text-xs font-bold uppercase text-muted-foreground">{selected.source === "positive" ? "Positive Feedback" : "Negative Feedback"}</h4>{selected.source === "positive" && <Button variant="ghost" size="sm" onClick={() => void copyText(selected.feedback, "Feedback")}><Copy className="size-4" /> Copy</Button>}</div>
                  <p className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words pr-1 text-sm leading-5 ${selected.source === "negative" ? "text-negative-feedback-foreground" : "text-foreground"}`}>{selected.feedback || "No comment provided."}</p>
                </div>
                {selected.source === "negative" && <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border p-3">
                  <div className="mb-2 flex items-center justify-between gap-2"><h4 className="text-xs font-bold uppercase text-muted-foreground">AI-Generated Response</h4><div className="flex gap-1">{editingResponse ? <Button variant="ghost" size="sm" onClick={saveResponse}><Save className="size-4" /> Save</Button> : <Button variant="ghost" size="sm" onClick={() => { setResponseDraft(selected.ai_feedback_response); setEditingResponse(true); }}><Pencil className="size-4" /> Edit</Button>}<Button variant="ghost" size="sm" onClick={() => void copyText(editingResponse ? responseDraft : selected.ai_feedback_response, "Response")}><Copy className="size-4" /> Copy</Button></div></div>
                  {editingResponse ? <Textarea value={responseDraft} onChange={(event) => setResponseDraft(event.target.value)} className="min-h-0 flex-1 resize-none overflow-x-hidden overflow-y-auto" aria-label="Edit AI-generated response" /> : <p className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words pr-1 text-sm leading-5 text-foreground">{selected.ai_feedback_response || "No response available."}</p>}
                </div>}
              </div>
            </div> : null}
          </DetailsPanel>
        </div>
      </main>
      <AppFooter />
      <WebhookDialog open={settingsOpen} onOpenChange={setSettingsOpen} config={webhooks} onSave={(config) => { setWebhooks(config); saveWebhooks(config); setSettingsOpen(false); toast.success("Webhook settings saved"); void refresh(config); }} />
    </div>
  );
}