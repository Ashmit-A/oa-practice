import { Component } from 'react';
import logger from '../utils/logger';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unexpected error' };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('ui_error', { message: error?.message, stack: error?.stack, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm">{this.state.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

