export function Spinner({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="ui-spinner" role="status" aria-label={label}>
      <span className="ui-spinner-indicator" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
