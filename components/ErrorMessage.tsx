import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from './ui/Button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  suggestions?: string[];
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
  onRetry,
  onDismiss,
  suggestions = [],
  className = ''
}) => {
  return (
    <div className={`bg-red-500/10 border-2 border-red-500/30 rounded-lg p-4 ${className}`}>
      <div className="flex gap-3">
        <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-bold text-red-300">{title}</h4>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-red-400 hover:text-red-300 transition-colors"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-red-200 text-sm mb-3">{message}</p>
          
          {suggestions.length > 0 && (
            <div className="text-xs text-red-300 space-y-1 mb-3">
              <p className="font-semibold">💡 Try:</p>
              <ul className="list-disc list-inside space-y-1">
                {suggestions.map((suggestion, idx) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="secondary"
              className="bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
