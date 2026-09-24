import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRANCHES, OTHERS, SERVICES, STATUSES, type JobRecord, type JobStatus } from "@/lib/jobs";

export type JobFormValues = Omit<JobRecord, "job_id" | "completed_at">;

const empty: JobFormValues = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  manager_email: "",
  branch: BRANCHES[0],
  service_done: SERVICES[0],
  job_status: "Pending",
};

export function JobFormDialog({
  open,
  onOpenChange,
  initial,
  ids,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: JobRecord | null;
  ids: { job_id: string };
  onSubmit: (values: JobFormValues) => void;
}) {
  const [values, setValues] = useState<JobFormValues>(empty);
  const [serviceChoice, setServiceChoice] = useState<string>(SERVICES[0]);
  const [customService, setCustomService] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (initial) {
      const preset = (SERVICES as readonly string[]).includes(initial.service_done);
      setValues({
        customer_name: initial.customer_name,
        customer_phone: initial.customer_phone,
        customer_email: initial.customer_email,
        manager_email: initial.manager_email ?? "",
        branch: initial.branch,
        service_done: initial.service_done,
        job_status: initial.job_status,
      });
      setServiceChoice(preset ? initial.service_done : OTHERS);
      setCustomService(preset ? "" : initial.service_done);
    } else {
      setValues(empty);
      setServiceChoice(SERVICES[0]);
      setCustomService("");
    }
  }, [open, initial]);

  const set = <K extends keyof JobFormValues>(key: K, v: JobFormValues[K]) =>
    setValues((p) => ({ ...p, [key]: v }));

  const submit = () => {
    const service = serviceChoice === OTHERS ? customService.trim() : serviceChoice;
    const next = { ...values, service_done: service };
    const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (
      !next.customer_name.trim() ||
      !next.customer_phone.trim() ||
      !next.customer_email.trim() ||
      !next.manager_email.trim() ||
      !next.branch ||
      !service ||
      !next.job_status
    ) {
      setError("All fields are required.");
      return;
    }
    if (!emailOk(next.customer_email) || !emailOk(next.manager_email)) {
      setError("Please enter valid email addresses.");
      return;
    }
    onSubmit(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="bg-surface-dark px-6 py-5 text-left">
          <DialogTitle className="text-base font-bold uppercase tracking-[0.12em] text-surface-dark-foreground">
            {initial ? "Edit Job Record" : "Add New Customer / Job"}
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-[0.1em] text-surface-dark-muted">
            {initial ? initial.job_id : ids.job_id}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto bg-card px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="name">Customer Name</Label>
            <Input
              id="name"
              value={values.customer_name}
              onChange={(e) => set("customer_name", e.target.value)}
              placeholder="Babatunde Adeleke"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Customer Phone</Label>
              <Input
                id="phone"
                value={values.customer_phone}
                onChange={(e) => set("customer_phone", e.target.value)}
                placeholder="7067102694"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Customer Email</Label>
              <Input
                id="email"
                type="email"
                value={values.customer_email}
                onChange={(e) => set("customer_email", e.target.value)}
                placeholder="customer@email.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="manager">Manager Email</Label>
            <Input
              id="manager"
              type="email"
              value={values.manager_email}
              onChange={(e) => set("manager_email", e.target.value)}
              placeholder="manager@072carsclinic.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Branch</Label>
            <Select value={values.branch} onValueChange={(v) => set("branch", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {BRANCHES.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Service Done</Label>
            <Select value={serviceChoice} onValueChange={setServiceChoice}>
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
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
            {serviceChoice === OTHERS && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="custom">Specify Custom Service</Label>
                <Input
                  id="custom"
                  value={customService}
                  onChange={(e) => setCustomService(e.target.value)}
                  placeholder="Describe the service performed"
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Job Status</Label>
            <Select
              value={values.job_status}
              onValueChange={(v) => set("job_status", v as JobStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm font-medium text-primary">{error}</p>}
        </div>

        <DialogFooter className="border-t bg-card px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>{initial ? "Save Changes" : "Create Job"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
