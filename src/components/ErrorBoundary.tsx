import React, { useState, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="size-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">문제가 발생했습니다</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
          </p>
          <Button onClick={this.handleReset} variant="outline" className="gap-2">
            <RefreshCw className="size-4" />
            다시 시도
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Async error handler hook
export function useAsyncError() {
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      setError(err);
    } else {
      setError(new Error(String(err)));
    }
  };

  const clearError = () => setError(null);

  const retry = async (asyncFn: () => Promise<void>) => {
    setIsRetrying(true);
    clearError();
    try {
      await asyncFn();
    } catch (err) {
      handleError(err);
    } finally {
      setIsRetrying(false);
    }
  };

  return { error, isRetrying, handleError, clearError, retry };
}

// Network error handler
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError')
    );
  }
  return false;
}

// Supabase error handler
export function getSupabaseErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const supabaseError = error as { message?: string; code?: string };
    
    if (supabaseError.code === 'PGRST301') {
      return '데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.';
    }
    if (supabaseError.code === 'PGRST116') {
      return '요청한 데이터를 찾을 수 없습니다.';
    }
    if (supabaseError.code === '42501') {
      return '접근 권한이 없습니다.';
    }
    
    return supabaseError.message || '데이터를 불러오는 중 오류가 발생했습니다.';
  }
  
  return '알 수 없는 오류가 발생했습니다.';
}
