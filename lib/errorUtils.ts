import { Alert } from 'react-native';

export interface ErrorDetails {
  message: string;
  code?: string;
  title?: string;
}

export class AppError extends Error {
  code?: string;
  title?: string;

  constructor(message: string, code?: string, title?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.title = title;
  }
}

export const formatErrorMessage = (error: unknown): ErrorDetails => {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      title: error.title,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      title: 'Error',
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      title: 'Error',
    };
  }

  return {
    message: 'An unexpected error occurred',
    title: 'Error',
  };
};

export const showErrorAlert = (error: unknown) => {
  const { title, message } = formatErrorMessage(error);
  Alert.alert(title || 'Error', message);
};

export const handleApiError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'API_ERROR');
  }

  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR');
};

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.message.includes('offline')
    );
  }
  return false;
};