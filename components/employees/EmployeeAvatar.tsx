import { cn } from "@/lib/utils";
import type { Gender } from "@/types";

interface EmployeeAvatarProps {
  gender: Gender;
  className?: string;
}

function MaleSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <circle cx="32" cy="24" r="11" fill="currentColor" />
      <path d="M10 58c0-13.8 9.85-22 22-22s22 8.2 22 22" fill="currentColor" />
    </svg>
  );
}

function FemaleSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <path
        d="M32 11c-7 0-12.5 5.7-12.5 13 0 4.9 2 8.2 4 10.3-1.2 1.7-2.6 2.9-4.3 3.7 2.6 2.2 6.6 3.3 10.8 3.3h4c4.2 0 8.2-1.1 10.8-3.3-1.7-.8-3.1-2-4.3-3.7 2-2.1 4-5.4 4-10.3 0-7.3-5.5-13-12.5-13Z"
        fill="currentColor"
      />
      <path d="M9 58c0-13 10.3-19 23-19s23 6 23 19" fill="currentColor" />
    </svg>
  );
}

export function EmployeeAvatar({ gender, className }: EmployeeAvatarProps) {
  const Silhouette = gender === "female" ? FemaleSilhouette : MaleSilhouette;
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-soft text-ink-soft",
        className
      )}
    >
      <Silhouette className="size-[65%]" />
    </div>
  );
}
