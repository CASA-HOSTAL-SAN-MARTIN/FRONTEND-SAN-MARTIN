export function ErrorAlert({ message, onRetry, retrying = false }: {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div className="ui-error-alert" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button className="ui-retry-button" disabled={retrying} onClick={onRetry} type="button">
          {retrying ? 'Reintentando...' : 'Reintentar'}
        </button>
      )}
    </div>
  );
}
