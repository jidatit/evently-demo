import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { handleHowItWorksClick } from "@/lib/smoothScroll";

interface HowItWorksLinkProps {
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
}

export function HowItWorksLink({
  children,
  className,
  onNavigate,
}: HowItWorksLinkProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <a
      href="#how-it-works"
      className={cn(className)}
      onClick={(e) => {
        e.preventDefault();
        handleHowItWorksClick(pathname, navigate, onNavigate);
      }}
    >
      {children}
    </a>
  );
}
