import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { WebhookDialog } from "@/components/WebhookDialog";
import { loadWebhooks, saveWebhooks, type WebhookConfig } from "@/lib/jobs";
import { toast } from "sonner";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Status — 072 Cars Clinic Admin" },
      {
        name: "description",
        content: "Check the status of customer service jobs at 072 Cars Clinic.",
      },
      { property: "og:title", content: "Status — 072 Cars Clinic Admin" },
      {
        property: "og:description",
        content: "Check the status of customer service jobs at 072 Cars Clinic.",
      },
    ],
  }),
  component: StatusPage,
});

function StatusPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [webhooks, setWebhooks] = useState<WebhookConfig>(() => loadWebhooks());

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold text-foreground">Status Check</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Customer job status lookup is coming soon.
          </p>
        </div>
      </main>
      <AppFooter />
      <WebhookDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        config={webhooks}
        onSave={(cfg) => {
          setWebhooks(cfg);
          saveWebhooks(cfg);
          setSettingsOpen(false);
          toast.success("Webhook settings saved");
        }}
      />
    </div>
  );
}
