type SkeletonProps = {
  className?: string;
  count?: number;
};

export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return (
    <div
      className={`skeleton-item animate-pulse bg-slate-200 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div
      data-testid="skeleton-card"
      className={`p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col gap-4 animate-pulse ${className}`}
      aria-hidden="true"
    >
      <div className="h-4 bg-slate-200 rounded w-1/3" />
      <div className="h-8 bg-slate-200 rounded w-3/4" />
      <div className="h-4 bg-slate-200 rounded w-full" />
      <div className="h-4 bg-slate-200 rounded w-5/6" />
      <div className="h-10 bg-slate-200 rounded w-full mt-2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div
      data-testid="skeleton-table"
      className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse"
      aria-hidden="true"
    >
      <div className="h-12 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={`th-${i}`} className="h-4 bg-slate-300 rounded flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`tr-${r}`} className="h-14 flex items-center px-4 gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={`td-${r}-${c}`} className="h-3 bg-slate-200 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
