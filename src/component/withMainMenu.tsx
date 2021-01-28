import React from "react";
import styled from "styled-components";
import MainMenu from "./MainMenu";

const Wrapper = styled.div`
  display: flex;
  height: 100%;
`;

function withMainMenu<TProps>(wrappedComponent: React.ComponentType<TProps>) {
  return function New(props: TProps): JSX.Element {
    // eslint-disable-next-line
    wrappedComponent.displayName =
      wrappedComponent.displayName || wrappedComponent.name || "Component";
    const WrappedComponent = wrappedComponent;

    return (
      <Wrapper>
        <MainMenu placement="default" />
        <WrappedComponent {...props} />
      </Wrapper>
    );
  };
}

export default withMainMenu;
