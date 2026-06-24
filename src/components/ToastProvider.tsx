import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

export type ToastVariant = 'info' | 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => undefined });

const TOAST_DURATION = 4200;

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((current) => [...current, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast--${toast.variant}`}
            role={toast.variant === 'error' ? 'alert' : 'status'}
          >
            <span className="toast__icon" aria-hidden="true">
              <ToastIcon variant={toast.variant} />
            </span>
            <div className="toast__body">{toast.message}</div>
            <button
              type="button"
              className="toast__close"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
            >
              <X size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') {
    return <CheckCircle2 size={18} strokeWidth={1.5} aria-hidden="true" />;
  }

  if (variant === 'error') {
    return <TriangleAlert size={18} strokeWidth={1.5} aria-hidden="true" />;
  }

  return <Info size={18} strokeWidth={1.5} aria-hidden="true" />;
}
