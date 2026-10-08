import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M18.5 7 13 25" className="stroke-brand" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M9.5 13 5.5 16l4 3M22.5 13l4 3-4 3" className="stroke-primary-foreground" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight", className)}>
      <LogoMark />
      <span>
        Linkly<span className="text-brand-text">/</span>
      </span>
    </span>
  );
}
