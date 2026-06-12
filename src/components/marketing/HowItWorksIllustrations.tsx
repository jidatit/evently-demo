import type { ReactNode } from "react";

function MockWindow({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[200px] mx-auto rounded-lg border border-border/60 bg-white shadow-md overflow-hidden">
      <div className="h-5 bg-foreground/85 flex items-center gap-1 px-2">
        <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

export function BrowseIllustration() {
  return (
    <MockWindow>
      <div className="flex gap-2 mb-3">
        <div className="h-8 w-8 rounded-md bg-primary shrink-0" />
        <div className="flex-1 space-y-1.5 pt-0.5">
          <div className="h-2 w-full rounded bg-muted" />
          <div className="h-2 w-3/4 rounded bg-muted" />
        </div>
      </div>
      <div className="h-6 rounded-md bg-primary/15 border border-primary/20 mb-2 flex items-center px-2">
        <div className="h-1.5 w-12 rounded bg-primary/40" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2 mb-2 last:mb-0">
          <div className="h-2 w-2 rounded-sm border border-muted-foreground/30" />
          <div className="h-1.5 flex-1 rounded bg-muted" />
          <div className="h-3 w-8 rounded bg-primary/80" />
        </div>
      ))}
    </MockWindow>
  );
}

export function RequestIllustration() {
  return (
    <div className="relative w-full max-w-[200px] h-[140px] mx-auto">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute left-1/2 -translate-x-1/2 w-[85%] rounded-lg border border-border/50 bg-white shadow-sm p-2.5 flex items-center gap-2"
          style={{
            top: `${i * 22}px`,
            zIndex: 3 - i,
            opacity: 1 - i * 0.12,
          }}
        >
          <div className="h-7 w-7 rounded-md bg-primary shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-1.5 w-full rounded bg-muted" />
            <div className="h-1.5 w-2/3 rounded bg-muted" />
          </div>
          <div className="h-4 w-10 rounded bg-primary/90 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function ConfirmIllustration() {
  return (
    <div className="relative w-full max-w-[200px] h-[140px] mx-auto">
      <div className="absolute inset-2 rounded-lg border border-border/50 bg-white shadow-md p-2">
        <div className="h-3 w-full rounded bg-muted mb-2" />
        <div className="flex gap-2">
          <div className="h-16 flex-1 rounded bg-muted/60" />
          <div className="w-14 space-y-1">
            <div className="h-6 rounded bg-primary/20 border border-primary/30 p-1">
              <div className="h-1 w-full rounded bg-primary/50" />
            </div>
            <div className="h-4 rounded bg-primary" />
          </div>
        </div>
      </div>
      <div className="absolute -top-1 right-4 h-8 w-14 rounded border border-border/40 bg-white shadow p-1">
        <div className="h-1 w-full rounded bg-muted mb-1" />
        <div className="h-3 rounded bg-primary/80" />
      </div>
    </div>
  );
}

export function PayIllustration() {
  return (
    <div className="relative w-full max-w-[200px] h-[140px] mx-auto flex items-end justify-center gap-2 pb-2">
      <div className="h-24 w-14 rounded-lg border border-border/40 bg-white/80 shadow-sm p-2 flex flex-col justify-end gap-1 opacity-60">
        <div className="h-8 w-full rounded bg-muted/50" />
        <div className="h-1.5 w-full rounded bg-muted" />
      </div>
      <div className="relative h-28 w-16 rounded-lg border-2 border-primary/30 bg-white shadow-lg p-2 flex flex-col items-center justify-end">
        <div className="flex items-end justify-center gap-0.5 h-12 w-full mb-2">
          <div className="w-2 bg-primary/40 rounded-t h-4" />
          <div className="w-2 bg-primary/60 rounded-t h-7" />
          <div className="w-2 bg-primary rounded-t h-10" />
        </div>
        <div className="h-1.5 w-full rounded bg-muted" />
        <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-md ring-2 ring-white">
          <svg
            viewBox="0 0 12 12"
            className="h-3.5 w-3.5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              d="M2 6l3 3 5-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <div className="h-20 w-14 rounded-lg border border-border/40 bg-white/80 shadow-sm p-2 flex flex-col justify-end gap-1 opacity-60">
        <div className="h-6 w-full rounded bg-muted/50" />
        <div className="h-1.5 w-full rounded bg-muted" />
      </div>
    </div>
  );
}
