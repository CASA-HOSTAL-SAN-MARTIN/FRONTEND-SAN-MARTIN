import type { ReactNode } from 'react';

export function EmptyState({ title, description, action }: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section className="ui-empty-state" aria-live="polite">
      <span className="ui-empty-state-mark" aria-hidden="true">—</span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </section>
  );
}
