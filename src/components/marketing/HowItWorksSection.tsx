import { cn } from "@/lib/utils";
import { HOW_IT_WORKS_SECTION_ID } from "@/lib/smoothScroll";
import {
  BrowseIllustration,
  PayIllustration,
  RequestIllustration,
} from "./HowItWorksIllustrations";

const STEPS = [
  {
    title: "Browse & discover",
    description:
      "Search verified vendors by category, location, and budget. Compare portfolios and pricing in one place.",
    Illustration: BrowseIllustration,
  },
  {
    title: "Request & confirm",
    description:
      "Send a booking request with your event details. Your vendor reviews and accepts when it's a match.",
    Illustration: RequestIllustration,
  },
  {
    title: "Pay securely",
    description:
      "Checkout once accepted. Your payment is encrypted and handled safely on Evently.",
    Illustration: PayIllustration,
  },
] as const;

/** Curved dashed connector (desktop) — loops through each step like the reference layout */
function FlowConnector() {
  return (
    <svg
      className="absolute left-0 right-0 top-[72px] hidden lg:block w-full h-[100px] pointer-events-none text-primary"
      viewBox="0 0 1000 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <marker
          id="how-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="currentColor" />
        </marker>
      </defs>
      {/* Loop at step 1 */}
      <path
        d="M 120 70 
           C 120 35, 155 25, 170 45
           C 185 65, 155 80, 120 70"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="7 5"
        strokeLinecap="round"
      />
      {/* Arc to step 2 */}
      <path
        d="M 195 55
           C 280 15, 380 15, 460 55
           C 500 75, 480 85, 450 80"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="7 5"
        strokeLinecap="round"
        markerEnd="url(#how-arrow)"
      />
      {/* Arc to step 3 */}
      <path
        d="M 530 70
           C 620 20, 720 25, 800 60
           C 860 85, 900 75, 880 65"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="7 5"
        strokeLinecap="round"
        markerEnd="url(#how-arrow)"
      />
    </svg>
  );
}

interface HowItWorksSectionProps {
  className?: string;
  compact?: boolean;
}

export function HowItWorksSection({
  className,
  compact = false,
}: HowItWorksSectionProps) {
  return (
    <section
      id={HOW_IT_WORKS_SECTION_ID}
      className={cn(
        "scroll-mt-24 relative overflow-hidden bg-white",
        compact ? "py-12" : "py-16 md:py-24",
        className,
      )}
    >
      {/* Subtle dot grid (reference-style background) */}
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--muted-foreground) / 0.12) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={cn("text-center max-w-2xl mx-auto", compact ? "mb-12" : "mb-16 lg:mb-20")}>
          <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-primary" aria-hidden />
          <h2
            className={cn(
              "font-heading font-bold text-foreground tracking-tight",
              compact ? "text-3xl" : "text-4xl md:text-5xl",
            )}
          >
            How it works
          </h2>
          <p className="font-body text-muted-foreground mt-4 text-base md:text-lg leading-relaxed px-4">
            Plan your event in three simple steps — find vendors, confirm your
            booking, and pay with confidence.
          </p>
        </div>

        {/* Steps + connector */}
        <div className="relative">
          <FlowConnector />

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-14 md:gap-8 lg:gap-6 relative z-10">
            {STEPS.map((step, index) => {
              const Illustration = step.Illustration;
              const isLast = index === STEPS.length - 1;

              return (
                <li key={step.title} className="flex flex-col items-center text-center">
                  <div className="h-[150px] w-full flex items-center justify-center mb-6">
                    <Illustration />
                  </div>

                  {!isLast && (
                    <div
                      className="md:hidden w-px h-8 bg-gradient-to-b from-primary/50 to-transparent mb-4"
                      aria-hidden
                    />
                  )}

                  <h3 className="font-heading text-lg md:text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground mt-2 max-w-[240px] leading-relaxed">
                    {step.description}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
