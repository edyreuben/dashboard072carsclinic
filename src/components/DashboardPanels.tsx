import type { ReactNode, UIEventHandler } from "react";
import { cn } from "@/lib/utils";

export const DASHBOARD_PANEL_HEIGHT = "h-full min-h-[420px] lg:min-h-0";

export function DataTablePanel({
  children,
  footer,
  scrollRef,
  onScroll,
  className,
}: {
  children: ReactNode;
  footer: ReactNode;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: UIEventHandler<HTMLDivElement>;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]",
        DASHBOARD_PANEL_HEIGHT,
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-auto">
          {children}
        </div>
        <div className="shrink-0 border-t border-border px-4 py-2 text-right text-xs font-medium text-muted-foreground">
          {footer}
        </div>
      </div>
    </section>
  );
}

export function DetailsPanel({
  title,
  children,
  empty,
  className,
}: {
  title: string;
  children?: ReactNode;
  empty: string;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "flex overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]",
        DASHBOARD_PANEL_HEIGHT,
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="shrink-0 border-b bg-surface-dark px-5 py-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-surface-dark-foreground">
            {title}
          </h3>
        </div>
        {children ? (
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center px-8 text-center text-sm text-muted-foreground">
            <p>{empty}</p>
          </div>
        )}
      </div>
    </aside>
  );
}