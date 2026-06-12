export const HOW_IT_WORKS_SECTION_ID = "how-it-works";

const SCROLL_STORAGE_KEY = "bookd:scrollToSection";

export function scrollToSection(
  id: string,
  options?: ScrollIntoViewOptions,
): void {
  const el = document.getElementById(id);
  if (!el) return;

  el.scrollIntoView({
    behavior: "smooth",
    block: "start",
    ...options,
  });

  if (window.location.hash !== `#${id}`) {
    window.history.replaceState(null, "", `#${id}`);
  }
}

export function scrollToHowItWorks(): void {
  scrollToSection(HOW_IT_WORKS_SECTION_ID);
}

export function queueScrollToHowItWorks(): void {
  sessionStorage.setItem(SCROLL_STORAGE_KEY, HOW_IT_WORKS_SECTION_ID);
}

export function consumeQueuedSectionScroll(): string | null {
  const id = sessionStorage.getItem(SCROLL_STORAGE_KEY);
  if (id) {
    sessionStorage.removeItem(SCROLL_STORAGE_KEY);
  }
  return id;
}

export function handleHowItWorksClick(
  pathname: string,
  navigate: (to: string) => void,
  onDone?: () => void,
): void {
  if (pathname === "/" || pathname === "") {
    scrollToHowItWorks();
  } else {
    queueScrollToHowItWorks();
    navigate("/");
  }
  onDone?.();
}
