"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorCount: number;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      errorCount: prev.errorCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      const tooManyRetries = this.state.errorCount >= 3;

      return (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
              Something went wrong
            </h2>
            <p className="text-zinc-500 mb-6">
              {tooManyRetries
                ? "This error keeps occurring. Please refresh the page."
                : "An unexpected error occurred."}
            </p>
            {tooManyRetries ? (
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(249,115,22,0.15)]"
              >
                Refresh Page
              </button>
            ) : (
              <button
                onClick={this.handleRetry}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(249,115,22,0.15)]"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
