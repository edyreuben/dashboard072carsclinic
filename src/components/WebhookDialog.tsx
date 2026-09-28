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
import type { WebhookConfig } from "@/lib/jobs";

const FIELDS: { key: keyof WebhookConfig; label: string }[] = [
  { key: "postEvent", label: "Post Customer / Job Event Webhook URL" },
  { key: "getJobs", label: "Get Customer / Job Webhook URL" },
  { key: "getPositiveFeedback", label: "Get Positive Feedback Webhook URL" },
  { key: "getNegativeFeedback", label: "Get Negative Feedback Webhook URL" },
];

export function WebhookDialog({
  open,
  onOpenChange,
  config,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  config: WebhookConfig;
  onSave: (cfg: WebhookConfig) => void;
}) {
  const [values, setValues] = useState<WebhookConfig>(config);
  useEffect(() => {
    if (open) setValues(config);
  }, [open, config]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="bg-surface-dark px-6 py-5 text-left">
          <DialogTitle className="text-base font-bold uppercase tracking-[0.12em] text-surface-dark-foreground">
            n8n Webhook Configuration
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-[0.1em] text-surface-dark-muted">
            Endpoints for job events and data sync
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto bg-card px-6 py-5">
          {FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`hook-${key}`}>{label}</Label>
              <Input
                id={`hook-${key}`}
                value={values[key]}
                onChange={(e) => setValues((p) => ({ ...p, [key]: e.target.value }))}
                placeholder="https://your-n8n.app/webhook/..."
              />
            </div>
          ))}
        </div>
        <DialogFooter className="border-t bg-card px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSave(
                Object.fromEntries(
                  Object.entries(values).map(([k, v]) => [k, v.trim()]),
                ) as WebhookConfig,
              )
            }
          >
            Save Webhooks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
