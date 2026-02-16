"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
              Something went wrong
            </h2>
            <p className="text-zinc-500 mb-6">An unexpected error occurred.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(249,115,22,0.15)]"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
