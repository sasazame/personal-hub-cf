import { useState, useEffect } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

const toasts: Toast[] = [];
const listeners = new Set<(toasts: Toast[]) => void>();

function notify() {
  listeners.forEach(listener => listener([...toasts]));
}

export function useToast() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const listener = () => forceUpdate({});
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const toast = (options: ToastOptions) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, ...options };
    toasts.push(newToast);
    notify();

    // Auto-remove after 5 seconds
    setTimeout(() => {
      const index = toasts.findIndex(t => t.id === id);
      if (index > -1) {
        toasts.splice(index, 1);
        notify();
      }
    }, 5000);
  };

  return { toast, toasts: [...toasts] };
}