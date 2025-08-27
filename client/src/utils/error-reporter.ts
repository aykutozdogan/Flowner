
interface ErrorReport {
  message: string;
  stack?: string;
  component?: string;
  url: string;
  userAgent: string;
  timestamp: string;
}

class ErrorReporter {
  private static instance: ErrorReporter;
  private errors: ErrorReport[] = [];

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  report(error: Error | string, component?: string) {
    const errorReport: ErrorReport = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      component,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    this.errors.push(errorReport);
    
    // Console'a log
    console.error('Error Report:', errorReport);

    // Local storage'a kaydet
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem('flowner_error_reports', JSON.stringify(this.errors));
    } catch (e) {
      console.warn('Could not save error reports to localStorage');
    }
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
    localStorage.removeItem('flowner_error_reports');
  }
}

export const errorReporter = ErrorReporter.getInstance();
