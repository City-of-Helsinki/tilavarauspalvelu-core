import React from "react";
import styled from "styled-components";
import { BrowserRouter } from "react-router-dom";
import EmptyContent from "../EmptyContent";
import PageWrapper from "../PageWrapper";
import Loader from "../Loader";

interface IProps {
  noNavigation?: boolean;
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 70vh;
`;

function Authenticating({ noNavigation }: IProps): JSX.Element {
  return (
    <BrowserRouter>
      {noNavigation ? (
        <EmptyContent>
          <Wrapper>
            <Loader />
          </Wrapper>
        </EmptyContent>
      ) : (
        <PageWrapper>
          <EmptyContent>
            <Wrapper>
              <Loader />
            </Wrapper>
          </EmptyContent>
        </PageWrapper>
      )}
    </BrowserRouter>
  );
}

export default Authenticating;
