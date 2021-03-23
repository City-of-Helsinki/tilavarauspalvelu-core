import React, { ErrorInfo, ReactNode } from 'react';

type State = { hasError: boolean };
type Props = { children: ReactNode; errorContent: ReactNode };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false } as State;
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.log('errooorr!!!!');
    if (errorInfo.componentStack.indexOf('@axa')) {
      console.log('auth error', sessionStorage);
      sessionStorage.clear();
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.errorContent;
    }

    return this.props.children;
  }
}
