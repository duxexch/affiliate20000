import type { ReactNode } from "react";
import { Component } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
    return { hasError: true, message };
  }

  componentDidCatch(_error: unknown) {
    // Intentionally left blank: we still render UI with the message.
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-border/50 bg-secondary/20 p-6 space-y-3">
          <div className="text-lg font-black text-primary">Something went wrong</div>
          <div className="text-sm text-muted-foreground break-words">
            {this.state.message ?? "Runtime error"}
          </div>
          <div className="pt-2 text-xs text-muted-foreground">
            Please reload and if it persists, contact support with the error text above.
          </div>
        </div>
      </div>
    );
  }
}
