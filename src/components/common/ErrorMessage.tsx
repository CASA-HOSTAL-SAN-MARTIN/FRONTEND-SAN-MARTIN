type ErrorMessageProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorMessage({
  title = 'Ha ocurrido un error',
  message,
  onRetry,
  className = '',
}: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 flex flex-col gap-2 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden="true">
          ⚠
        </span>
        <strong className="font-bold text-red-800">{title}</strong>
      </div>
      <p className="text-sm text-red-700 m-0">{message}</p>
      {onRetry && (
        <div className="mt-2">
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg border-0 cursor-pointer transition-colors"
          >
            🔄 Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
