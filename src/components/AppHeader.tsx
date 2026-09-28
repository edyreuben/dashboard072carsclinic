import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <header className="shrink-0 bg-surface-dark">
      <div className="mx-auto grid max-w-7xl gap-4 px-6 py-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="hidden items-center sm:flex">
          <img
            src="/car-clinic-logo.png"
            alt="072 Cars Clinic logo"
            className="size-12 rounded-md bg-white object-contain p-1"
          />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold uppercase tracking-[0.18em] text-surface-dark-foreground">
            072 Cars Clinic
          </h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-surface-dark-muted">
            Auto Maintenance &amp; Care Specialists
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 sm:justify-self-end">
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              to="/"
              className="rounded-md px-3 py-2 text-sm font-medium text-surface-dark-foreground/90 hover:bg-white/10"
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              activeOptions={{ exact: true }}
            >
              Job / Visits
            </Link>
            <Link
              to="/status"
              className="rounded-md px-3 py-2 text-sm font-medium text-surface-dark-foreground/90 hover:bg-white/10"
              activeProps={{ className: "bg-primary text-primary-foreground" }}
            >
              Status
            </Link>
          </nav>
          <Button
            variant="ghost"
            size="icon"
            aria-label="n8n Webhook Configuration"
            onClick={onOpenSettings}
            className="text-surface-dark-foreground hover:bg-white/10 hover:text-surface-dark-foreground"
          >
            <Settings className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
