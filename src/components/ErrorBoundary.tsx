import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Unexpected application error.' };
  }

  componentDidCatch(error: Error) {
    console.error('RAMADAN DEV ErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen ludo-bg-pattern flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full rounded-2xl bg-[#07266b] gold-frame p-6 space-y-4">
            <h1 className="text-2xl font-display font-extrabold text-amber-300">RAMADAN DEV</h1>
            <p className="text-sm text-blue-100">
              Something went wrong while syncing game state. You can safely reload and continue playing.
            </p>
            <p className="text-xs font-mono-num bg-black/30 rounded-lg p-3 text-amber-200 break-words">
              {this.state.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="gold-btn px-6 py-2.5 rounded-xl font-display font-bold text-sm"
            >
              Reload Game
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
