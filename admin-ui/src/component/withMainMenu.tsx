import React from "react";
import styled from "styled-components";
import { breakpoints } from "../styles/util";
import MainMenu from "./MainMenu";

const Wrapper = styled.div`
  display: flex;
`;

const InnerWrapper = styled.div`
  width: 100%;

  @media (min-width: ${breakpoints.m}) {
    width: calc(100% - var(--main-menu-width) - 2.625rem);
  }
`;
export const MainMenuWrapper: React.FC = ({ children }) => {
  return (
    <Wrapper>
      <MainMenu placement="default" />
      <InnerWrapper>{children}</InnerWrapper>
    </Wrapper>
  );
};

function withMainMenu<TProps>(wrappedComponent: React.ComponentType<TProps>) {
  return function New(props: TProps): JSX.Element {
    // eslint-disable-next-line
    wrappedComponent.displayName =
      wrappedComponent.displayName || wrappedComponent.name || "Component";
    const WrappedComponent = wrappedComponent;

    return (
      <MainMenuWrapper>
        <WrappedComponent {...props} />
      </MainMenuWrapper>
    );
  };
}

export default withMainMenu;
