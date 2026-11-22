type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
};

export function LoadingSpinner({
  size = 'md',
  message = 'Cargando información...',
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`loading-container flex flex-col items-center justify-center p-6 gap-3 ${className}`}
    >
      <div
        className={`spinner-element rounded-full border-blue-200 border-t-blue-700 animate-spin ${sizeClasses}`}
        aria-hidden="true"
      />
      {message && <span className="text-sm font-medium text-slate-600">{message}</span>}
      <span className="sr-only">{message}</span>
    </div>
  );
}
