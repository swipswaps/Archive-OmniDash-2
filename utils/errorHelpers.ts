/**
 * Error Helper Utilities
 * Provides better error messages and suggestions for common errors
 */

export interface EnhancedError {
  title: string;
  message: string;
  suggestions: string[];
}

/**
 * Enhance error messages with helpful context and suggestions
 */
export function enhanceError(error: Error | unknown): EnhancedError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Network errors
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    return {
      title: 'Network Error',
      message: 'Unable to connect to the Internet Archive servers.',
      suggestions: [
        'Check your internet connection',
        'Try enabling Demo Mode in Settings to test the interface',
        'The Archive.org servers might be temporarily down',
        'Try again in a few moments'
      ]
    };
  }
  
  // CORS errors
  if (errorMessage.includes('CORS') || errorMessage.includes('Cross-Origin')) {
    return {
      title: 'CORS Error',
      message: 'Browser security is blocking the request.',
      suggestions: [
        'The app will automatically try a fallback API',
        'Enable Demo Mode in Settings to bypass API calls',
        'Consider using a CORS proxy (configure in Settings)',
        'Some features may require the backend server'
      ]
    };
  }
  
  // Authentication errors
  if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('credentials')) {
    return {
      title: 'Authentication Error',
      message: 'Invalid or missing API credentials.',
      suggestions: [
        'Go to Settings and add your Archive.org API keys',
        'Get your keys from archive.org/account/s3.php',
        'Make sure you copied both Access Key and Secret Key',
        'Try removing and re-adding your credentials'
      ]
    };
  }
  
  // Rate limiting
  if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('Too Many Requests')) {
    return {
      title: 'Rate Limit Exceeded',
      message: 'Too many requests sent to the server.',
      suggestions: [
        'Wait a few minutes before trying again',
        'The Archive.org API has rate limits',
        'Enable Demo Mode to test without API calls',
        'Consider spacing out your requests'
      ]
    };
  }
  
  // Not found errors
  if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
    return {
      title: 'Not Found',
      message: 'The requested item or page could not be found.',
      suggestions: [
        'Check that the identifier or URL is correct',
        'The item might have been removed from Archive.org',
        'Try searching for the item in Deep Search',
        'Verify the URL format is correct'
      ]
    };
  }
  
  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long to complete.',
      suggestions: [
        'The Archive.org servers might be slow',
        'Try again with a smaller query',
        'Check your internet connection speed',
        'Try again in a few moments'
      ]
    };
  }
  
  // Invalid input
  if (errorMessage.includes('Invalid') || errorMessage.includes('invalid')) {
    return {
      title: 'Invalid Input',
      message: errorMessage,
      suggestions: [
        'Check that your input format is correct',
        'Remove any special characters',
        'Try a simpler query',
        'See the documentation for valid formats'
      ]
    };
  }
  
  // Generic error
  return {
    title: 'Error',
    message: errorMessage || 'An unexpected error occurred.',
    suggestions: [
      'Try refreshing the page',
      'Check the browser console for details',
      'Enable Demo Mode in Settings to test the interface',
      'Report this issue if it persists'
    ]
  };
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: Error | unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('Failed to fetch') || 
         message.includes('NetworkError') ||
         message.includes('Network request failed');
}

/**
 * Check if error is a CORS error
 */
export function isCORSError(error: Error | unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('CORS') || message.includes('Cross-Origin');
}

/**
 * Get a user-friendly error title
 */
export function getErrorTitle(error: Error | unknown): string {
  return enhanceError(error).title;
}

/**
 * Get error suggestions
 */
export function getErrorSuggestions(error: Error | unknown): string[] {
  return enhanceError(error).suggestions;
}

