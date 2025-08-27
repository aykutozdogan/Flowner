
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorPreviewProps {
  error: Error | string;
  onRetry?: () => void;
  context?: string;
}

export const ErrorPreview = ({ error, onRetry, context }: ErrorPreviewProps) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  return (
    <Alert variant="destructive" className="m-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {context ? `${context} Hatası` : 'Preview Hatası'}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="mb-3">{errorMessage}</div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Tekrar Dene
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
