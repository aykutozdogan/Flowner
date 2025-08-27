
import { useEffect } from 'react';
import { useToast } from './use-toast';

interface ErrorEvent {
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  error?: Error;
}

export const useErrorTracking = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Global error handler
    const handleError = (event: ErrorEvent | Event) => {
      const errorEvent = event as ErrorEvent;
      console.error('Global Error:', {
        message: errorEvent.message,
        filename: errorEvent.filename,
        line: errorEvent.lineno,
        column: errorEvent.colno,
        stack: errorEvent.error?.stack
      });

      // Kullanıcıya göster
      toast({
        title: 'Hata Oluştu',
        description: errorEvent.message || 'Beklenmeyen bir hata oluştu',
        variant: 'destructive'
      });
    };

    // Unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      
      toast({
        title: 'İstek Hatası',
        description: 'Bir network işlemi başarısız oldu',
        variant: 'destructive'
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [toast]);

  const logError = (error: Error, context?: string) => {
    console.error('Manual Error Log:', {
      message: error.message,
      stack: error.stack,
      context
    });
  };

  return { logError };
};
