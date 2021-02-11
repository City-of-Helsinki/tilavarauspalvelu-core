import React, { ErrorInfo } from "react";
import styled from "styled-components";
import Navigation from "./Navigation";

interface IProps {
  children: React.ReactNode;
}

interface IState {
  hasError: boolean;
}

const Content = styled.div`
  width: 100%;
  height: 100%;
`;

export default class PageWrapper extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): IState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(error, errorInfo);
  }

  render(): JSX.Element {
    const content = this.state.hasError ? (
      <div>Something went wrong</div>
    ) : (
      this.props.children
    );

    return (
      <>
        <Navigation />
        <Content>{content}</Content>
      </>
    );
  }
}
