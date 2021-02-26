import React from "react";
import { BrowserRouter } from "react-router-dom";
import { IngressContainer } from "../../styles/layout";
import EmptyContent from "../EmptyContent";
import PageWrapper from "../PageWrapper";

function NotAuthenticated(): JSX.Element {
  return (
    <BrowserRouter>
      <PageWrapper>
        <EmptyContent>
          <IngressContainer>Not authenticated</IngressContainer>
        </EmptyContent>
      </PageWrapper>
    </BrowserRouter>
  );
}

export default NotAuthenticated;
