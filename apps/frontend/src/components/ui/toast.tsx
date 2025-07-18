import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './alert';

export function Toaster() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map(toast => (
        <Alert key={toast.id} variant={toast.variant}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <AlertTitle>{toast.title}</AlertTitle>
              {toast.description && (
                <AlertDescription>{toast.description}</AlertDescription>
              )}
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
}