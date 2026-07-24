/**
 * EmptyState — editorial blank-slate for admin lists. Hairline border,
 * centered text, optional action button. No rounded corners.
 */
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center border border-line">
      {icon ? <div className="mb-4 text-stone">{icon}</div> : null}
      <p className="font-serif text-lg text-ink">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-stone leading-relaxed">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
