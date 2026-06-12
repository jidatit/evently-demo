import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface SplashIntroProps {
  onComplete: () => void;
}

const FINAL_TEXT = "VENDOR ACCESS";
const REDACTED_CHAR = "█";

export default function SplashIntro({ onComplete }: SplashIntroProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLDivElement>(null);
  const accessWrapRef = useRef<HTMLDivElement>(null);
  const accessMainRef = useRef<HTMLDivElement>(null);
  const accessRedRef = useRef<HTMLDivElement>(null);
  const accessBlueRef = useRef<HTMLDivElement>(null);
  const [revealText, setRevealText] = useState(
    FINAL_TEXT.split("").map((c) => (c === " " ? " " : REDACTED_CHAR)).join("")
  );

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => onComplete(),
    });

    // initial state
    gsap.set(lineRef.current, { scaleX: 0, transformOrigin: "left center", opacity: 0.2 });
    gsap.set(coordsRef.current, { opacity: 0 });
    gsap.set(accessWrapRef.current, { opacity: 0 });
    gsap.set([accessRedRef.current, accessBlueRef.current], { opacity: 0, x: 0 });

    // Step 1: 0 - 0.6s black
    tl.to({}, { duration: 0.6 });

    // Step 2: 0.6 - 1.4s line draws
    tl.to(lineRef.current, { scaleX: 1, duration: 0.8, ease: "power2.inOut" });

    // Step 3: 1.4 - 2.2s coords fade in
    tl.to(coordsRef.current, { opacity: 0.35, duration: 0.8, ease: "power2.out" });

    // Step 4: 2.2 - 3.2s redacted text appears then un-redacts
    tl.to(accessWrapRef.current, { opacity: 1, duration: 0.1 });
    tl.add(() => {
      const total = FINAL_TEXT.length;
      const duration = 1000; // 1s
      const start = performance.now();
      const order = FINAL_TEXT.split("")
        .map((_, i) => i)
        .filter((i) => FINAL_TEXT[i] !== " ")
        .sort(() => Math.random() - 0.5);
      const revealed = new Set<number>();
      FINAL_TEXT.split("").forEach((c, i) => {
        if (c === " ") revealed.add(i);
      });

      const step = () => {
        const elapsed = performance.now() - start;
        const targetCount = Math.min(
          order.length,
          Math.floor((elapsed / duration) * order.length)
        );
        while (revealed.size - (total - order.length) < targetCount) {
          const next = order[revealed.size - (total - order.length)];
          revealed.add(next);
        }
        setRevealText(
          FINAL_TEXT.split("")
            .map((c, i) => (revealed.has(i) ? c : REDACTED_CHAR))
            .join("")
        );
        if (elapsed < duration) {
          requestAnimationFrame(step);
        } else {
          setRevealText(FINAL_TEXT);
        }
      };
      requestAnimationFrame(step);
    });
    tl.to({}, { duration: 1.0 });

    // Step 5: 3.2 - 3.6s single RGB-split glitch
    tl.add(() => {
      gsap.set(accessRedRef.current, { opacity: 0.9, x: -6 });
      gsap.set(accessBlueRef.current, { opacity: 0.9, x: 6 });
      gsap.set(accessMainRef.current, { opacity: 0.7 });
    });
    tl.to({}, { duration: 0.08 });
    tl.add(() => {
      gsap.set(accessRedRef.current, { opacity: 0, x: 0 });
      gsap.set(accessBlueRef.current, { opacity: 0, x: 0 });
      gsap.set(accessMainRef.current, { opacity: 1 });
    });
    tl.to({}, { duration: 0.32 });

    // Step 6: 3.6 - 4.5s fade out everything
    tl.to(rootRef.current, { opacity: 0, duration: 0.9, ease: "power2.inOut" });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  const accessStyle: React.CSSProperties = {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "52px",
    color: "#FF5C1A",
    letterSpacing: "0.04em",
    lineHeight: 1,
    whiteSpace: "pre",
  };

  return (
    <div
      ref={rootRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#080810",
        overflow: "hidden",
      }}
    >
      {/* Coordinates above line */}
      <div
        ref={coordsRef}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, calc(-100% - 24px))",
          fontFamily: "'Space Mono', monospace",
          fontSize: "11px",
          letterSpacing: "6px",
          color: "rgba(255,255,255,0.35)",
          whiteSpace: "nowrap",
        }}
      >
        34.0522° N 118.2437° W
      </div>

      {/* Horizontal line */}
      <div
        ref={lineRef}
        style={{
          position: "absolute",
          top: "50%",
          left: "20%",
          right: "20%",
          height: "1px",
          background: "rgba(255,255,255,1)",
          opacity: 0.2,
        }}
      />

      {/* VENDOR ACCESS below line */}
      <div
        ref={accessWrapRef}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, 24px)",
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            ref={accessRedRef}
            style={{
              ...accessStyle,
              color: "#FF0040",
              position: "absolute",
              top: 0,
              left: 0,
              mixBlendMode: "screen",
            }}
          >
            {revealText}
          </div>
          <div
            ref={accessBlueRef}
            style={{
              ...accessStyle,
              color: "#00B7FF",
              position: "absolute",
              top: 0,
              left: 0,
              mixBlendMode: "screen",
            }}
          >
            {revealText}
          </div>
          <div ref={accessMainRef} style={accessStyle}>
            {revealText}
          </div>
        </div>
      </div>
    </div>
  );
}
