import { useState, useCallback } from 'react';

interface ErrorState {
  message: string;
  code?: string;
  details?: unknown;
}

interface UseErrorHandler {
  error: ErrorState | null;
  setError: (error: unknown) => void;
  clearError: () => void;
  isError: boolean;
}

export function useErrorHandler(): UseErrorHandler {
  const [error, setErrorState] = useState<ErrorState | null>(null);

  const setError = useCallback((err: unknown) => {
    if (!err) {
      setErrorState(null);
      return;
    }

    // Handle Error objects
    if (err instanceof Error) {
      setErrorState({
        message: err.message,
        details: err.stack,
      });
      return;
    }

    // Handle Supabase errors
    if (typeof err === 'object' && err !== null && 'message' in err && 'code' in err) {
      setErrorState({
        message: String(err.message),
        code: String(err.code),
        details: err,
      });
      return;
    }

    // Handle string errors
    if (typeof err === 'string') {
      setErrorState({
        message: err,
      });
      return;
    }

    // Handle unknown errors
    setErrorState({
      message: 'An unexpected error occurred',
      details: err,
    });
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  return {
    error,
    setError,
    clearError,
    isError: error !== null,
  };
}