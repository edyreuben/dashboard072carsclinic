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

export function WebhookDialog({
  open,
  onOpenChange,
  url,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string;
  onSave: (url: string) => void;
}) {
  const [value, setValue] = useState(url);
  useEffect(() => {
    if (open) setValue(url);
  }, [open, url]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="bg-surface-dark px-6 py-5 text-left">
          <DialogTitle className="text-base font-bold uppercase tracking-[0.12em] text-surface-dark-foreground">
            n8n Webhook Configuration
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-[0.1em] text-surface-dark-muted">
            Destination for customer_created &amp; customer_updated events
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 bg-card px-6 py-5">
          <Label htmlFor="hook">N8N_WEBHOOK_URL</Label>
          <Input id="hook" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <DialogFooter className="border-t bg-card px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(value.trim())}>Save Webhook</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
