import { LoadingSpinner } from './LoadingSpinner';

type LoadingOverlayProps = {
  message?: string;
};

export function LoadingOverlay({ message = 'Procesando operación...' }: LoadingOverlayProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={message}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full flex flex-col items-center">
        <LoadingSpinner size="lg" message={message} />
      </div>
    </div>
  );
}
