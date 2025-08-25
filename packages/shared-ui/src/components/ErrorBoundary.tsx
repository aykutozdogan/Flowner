import React, { Component, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="400px"
          textAlign="center"
          p={4}
        >
          <AlertCircle size={48} color="#f44336" />
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Bir hata oluştu
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {this.state.error?.message || 'Beklenmeyen bir hata oluştu'}
          </Typography>
          <Button
            variant="contained"
            onClick={this.handleReset}
          >
            Tekrar Dene
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}